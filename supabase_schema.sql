-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists knowledge_base (
  id bigserial primary key,
  service_name text,
  content text,
  metadata jsonb,
  embedding vector(768) -- using 768 dimensions for Gemini text-embedding-004
);

-- Create a function to search for documents
create or replace function match_knowledge_base (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  service_name text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.service_name,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by (knowledge_base.embedding <=> query_embedding) asc
  limit match_count;
end;
$$;
