const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize Supabase Client lazily
let supabase;
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
    console.warn("⚠️ WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY! Chat features will not work.");
}

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Brastorne Backend is running 🚀' });
});

// Chat Endpoint (Replaces Supabase Edge Function)
app.post('/api/chat', async (req, res) => {
    try {
        const { query, history } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        if (!supabase || !geminiKey) {
            return res.status(503).json({ error: 'Chat service is not configured. Missing environment variables.' });
        }

        console.log(`📩 Received query: "${query}"`);

        // 1. Generate embedding for the user query using Gemini
        const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: query }] }
            })
        });

        if (!embeddingResponse.ok) {
            throw new Error(`Gemini Embedding API Error: ${embeddingResponse.statusText}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.embedding.values;

        // 2. Search knowledge base in Supabase
        const { data: documents, error: matchError } = await supabase.rpc('match_knowledge_base', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3,
        });

        if (matchError) {
            console.error("Supabase RPC Error:", matchError);
            throw matchError;
        }

        // 3. Construct Context
        const contextText = documents?.map(doc =>
            `Service: ${doc.service_name}\nContent: ${doc.content}`
        ).join('\n\n') ?? "No specific service information found.";

        // 4. Generate AI response using Gemini 1.5 Flash
        const prompt = `
      You are the Brastorne AI Assistant, a professional and helpful guide for www.brastorne.com. 
      Your goal is to explain how Brastorne reach the unconnected in Africa through services like mAgri, Mpotsa, and Vuka.
      
      User Question: "${query}"
      
      Context from Brastorne Documentation:
      ${contextText}
      
      Chat History:
      ${JSON.stringify(history)}
      
      Instructions:
      - Use the provided context to answer the question accurately.
      - If the user asks in Setswana, respond in Setswana. If in English, respond in English.
      - If the answer isn't in the context, tell the user to contact the Brastorne office at +267 390 1234.
      - Keep responses concise and professional.
      - Bold key information like USSD codes (e.g., *157#).
    `;

        const chatResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!chatResponse.ok) {
            throw new Error(`Gemini Chat API Error: ${chatResponse.statusText}`);
        }

        const chatData = await chatResponse.json();
        const reply = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now.";

        res.json({ reply });

    } catch (error) {
        console.error("❌ Chat processing error:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Brastorne Backend running on port ${PORT}`);
});
