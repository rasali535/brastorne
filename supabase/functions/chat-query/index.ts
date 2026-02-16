import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query, history } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for DB access
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Generate embedding for the user query using Gemini
        const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: query }] }
            })
        })

        const embeddingData = await embeddingResponse.json()
        const embedding = embeddingData.embedding.values

        // 2. Search knowledge base in Supabase
        const { data: documents, error: matchError } = await supabase.rpc('match_knowledge_base', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3,
        })

        if (matchError) throw matchError

        // 3. Construct Context
        const contextText = documents?.map(doc =>
            `Service: ${doc.service_name}\nContent: ${doc.content}`
        ).join('\n\n') ?? "No specific service information found."

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
    `

        const chatResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })

        const chatData = await chatResponse.json()
        const reply = chatData.candidates[0].content.parts[0].text

        return new Response(
            JSON.stringify({ reply }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
