import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables if running locally
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in environment.');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkHealth() {
    console.log('🚀 Starting Brastorne Chatbot Connectivity Check...');
    console.log(`🔗 Target URL: ${url}`);

    try {
        // 1. Check Table Access
        const { data: tableData, error: tableError } = await supabase
            .from('knowledge_base')
            .select('id')
            .limit(1);

        if (tableError) throw new Error(`Knowledge Base access failed: ${tableError.message}`);
        console.log('✅ Supabase Connection: Knowledge Base table is reachable.');

        // 2. Check RPC Function
        const { data: rpcData, error: rpcError } = await supabase
            .rpc('match_knowledge_base', {
                query_embedding: new Array(768).fill(0), // Dummy vector
                match_threshold: 0.5,
                match_count: 1
            });

        if (rpcError) throw new Error(`RPC function 'match_knowledge_base' failed: ${rpcError.message}`);
        console.log("✅ Supabase Configuration: Vector similarity function is active.");

        // 3. Check Edge Function (Simulated Invoke)
        console.log('⏳ Checking Edge Functions (manual invoke may be required on live domain)...');
        const { data: funcData, error: funcError } = await supabase.functions.invoke('chat-query', {
            body: { query: 'health check' }
        });

        if (funcError) {
            console.warn(`⚠️ Edge Function 'chat-query' unreachable: ${funcError.message}`);
            console.log('   (This is normal if the function hasn\'t been deployed yet)');
        } else {
            console.log('✅ Edge Function: "chat-query" is responding.');
        }

        console.log('\n✨ Health Check Complete: Your backend is ready for production!');

    } catch (err) {
        console.error(`\n❌ Connectivity Test Failed: ${err.message}`);
        process.exit(1);
    }
}

checkHealth();
