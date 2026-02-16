-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Table to store chat sessions for history
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id text, -- Can be an anonymous ID or auth.uid()
  metadata jsonb default '{}'::jsonb
);

-- Table to store chat messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for Analytics
create table if not exists analytics_logs (
  id bigint primary key generated always as identity,
  event_type text not null,
  service_tag text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for Brastorne knowledge base with vector support
create table if not exists knowledge_base (
  id bigint primary key generated always as identity,
  service_name text not null,
  category text,
  content text not null,
  embedding vector(768), -- Optimized for Google Gemini text-embedding-004 (768 dimensions)
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an HNSW index for fast vector similarity search
create index on knowledge_base using hnsw (embedding vector_cosine_ops);

-- Function to perform similarity search
create or replace function match_knowledge_base (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  service_name text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kb.id,
    kb.service_name,
    kb.content,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
