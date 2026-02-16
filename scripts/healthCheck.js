import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Correctly resolve to the project root .env
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('❌ Missing credentials (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).');
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    console.log(`Connecting to ${url}...`);
    // Try to access the knowledge_base table or at least connect
    const { data, error } = await supabase.from('knowledge_base').select('id').limit(1);

    if (error) {
        if (error.code === 'PGRST116') { // Table not found or similar, but connection worked
            console.log('✅ Connection successful! (Table might be missing or empty, but API is reachable)');
        } else {
            console.error('❌ Connection failed:', error.message);
        }
    } else {
        console.log('✅ Connection successful! Accessed knowledge_base table.');
    }
}

check();
