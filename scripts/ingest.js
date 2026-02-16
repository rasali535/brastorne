import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use service role if you have RLS enabled
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error('❌ Credentials missing in .env file!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function ingestData() {
    console.log('📖 Reading brastorne_data.json...');
    const data = JSON.parse(fs.readFileSync('./brastorne_data.json', 'utf8'));

    for (const item of data) {
        const title = item.topic || item.service || item.service_name;
        const textToEmbed = item.content || `${item.service} (${item.ussd_code}): ${item.description} Features: ${item.key_features?.join(', ') || item.features?.join(', ')}`;

        console.log(`🤖 Generating embedding for: ${title}...`);

        try {
            const result = await model.embedContent(textToEmbed);
            const embedding = result.embedding.values;

            console.log(`📤 Uploading to Supabase...`);
            const { error } = await supabase
                .from('knowledge_base')
                .upsert({
                    service_name: title,
                    content: textToEmbed,
                    embedding: embedding,
                    metadata: {
                        ussd: item.ussd_code || null,
                        category: item.category || 'General',
                        leadership: item.leadership || null,
                        awards: item.awards || null,
                        countries: item.countries || null
                    }
                }, { onConflict: 'service_name' });

            if (error) throw error;
            console.log(`✅ ${title} ingested successfully!`);
        } catch (err) {
            console.error(`❌ Failed to ingest ${title}:`, err.message);
        }
    }

    console.log('\n✨ Knowledge Base Ingestion Complete!');
}

ingestData();
