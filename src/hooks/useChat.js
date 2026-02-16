import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useChat = () => {
    const [messages, setMessages] = useState(() => {
        // Load history from localStorage on initialization
        const saved = localStorage.getItem('brastorne_chat_history');
        return saved ? JSON.parse(saved) : [
            { id: '1', role: 'assistant', content: 'Dumela! I am Lebo, your Brastorne assistant. How can I help you with mAgri, Mpotsa, or Vuka today? / ke nna Lebo, nka go thusa jang ka mAgri, Mpotsa, kgotsa Vuka gompieno?' }
        ];
    });

    const [isLoading, setIsLoading] = useState(false);

    const logEvent = async (query) => {
        // Simple analytics to track which services are being discussed
        const lowercaseQuery = query.toLowerCase();
        let service = 'general';
        if (lowercaseQuery.includes('magri')) service = 'mAgri';
        else if (lowercaseQuery.includes('mpotsa')) service = 'Mpotsa';
        else if (lowercaseQuery.includes('vuka')) service = 'Vuka';

        try {
            await supabase.from('analytics_logs').insert([{
                event_type: 'query',
                service_tag: service,
                metadata: { query_preview: query.substring(0, 50) }
            }]);
        } catch (e) {
            console.warn('Analytics log failed', e);
        }
    };

    // Persist messages to localStorage
    useEffect(() => {
        localStorage.setItem('brastorne_chat_history', JSON.stringify(messages));
    }, [messages]);

    const sendMessage = async (content) => {
        if (!content.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        await logEvent(content);

        // --- MOCK MODE LOGIC ---
        if (import.meta.env.VITE_MOCK_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
            setTimeout(() => {
                let reply = "I'm Lebo, the Brastorne AI. I can tell you about our services (mAgri, Mpotsa, Vuka), our leadership team, our mission to connect the unconnected, or our recent global awards. What would you like to know?";

                const lower = content.toLowerCase();
                if (lower.includes('magri')) {
                    reply = "mAgri (*157#) is our flagship agricultural platform. It connects smallholder farmers to markets and real-time advice. Farmers have seen up to a 250% increase in yields using our USSD service!";
                } else if (lower.includes('mpotsa')) {
                    reply = "Mpotsa (*152#) is our SMS-based Q&A service, often called 'Google for feature phones.' It provides localized answers on health, jobs, and more to those without internet.";
                } else if (lower.includes('vuka')) {
                    reply = "Vuka (*156#) is a low-bandwidth social network that works without data. It allows communities to stay connected and build digital profiles on basic phones.";
                } else if (lower.includes('who are you') || lower.includes('about brastorne') || lower.includes('what is brastorne')) {
                    reply = "Brastorne is a Botswana-based impact tech company founded in 2013. We connect the 'Missing Middle' in Africa—those with phones but no internet. We currently serve over 5.3 million people across 6 countries.";
                } else if (lower.includes('leader') || lower.includes('ceo') || lower.includes('team') || lower.includes('founder')) {
                    reply = "Brastorne was co-founded by Martin Stimela (CEO) and Naledi Magowe (CGO/CMO). Our team of 28 is dedicated to scaling digital equity across the African continent.";
                } else if (lower.includes('mission') || lower.includes('vision') || lower.includes('value')) {
                    reply = "Our mission is to connect the 760M Africans lacking digital access. Our vision is to 'Connect the Unconnected to the World,' driven by values like Impact, Boldness, and Innovation.";
                } else if (lower.includes('award') || lower.includes('win') || lower.includes('mit') || lower.includes('google')) {
                    reply = "We've won several global awards, including the MIT Solver (2021), Google Black Founders Fund (2022), and the AYuTe Africa Challenge (2022). Recently, we received the SAIS Female Founder Award in 2025!";
                } else if (lower.includes('country') || lower.includes('where') || lower.includes('botswana')) {
                    reply = "We are headquartered in Gaborone, Botswana, and also operate in the DRC, Cameroon, Guinea, and Zambia. We're soon expanding to countries like Mali and Côte d'Ivoire!";
                } else if (lower.includes('setswana') || lower.includes('dumela')) {
                    reply = "Dumela! Re kgetha go go thusa ka Setswana. O ka botsa ka mAgri, Mpotsa, kgotsa Vuka mme re tla go araba ka botlalo.";
                }

                const aiMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: reply
                };
                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);
            }, 1500);
            return;
        }
        // --- END MOCK MODE ---

        try {
            // Call the Supabase Edge Function 'chat-query'
            const { data, error } = await supabase.functions.invoke('chat-query', {
                body: { query: content, history: messages.slice(-5) } // Send last 5 messages for context
            });

            if (error) throw error;

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I am having trouble connecting. Please call our office at +267 390 1234 or try again later. / Ke maswabi, go na le mathata a thulaganyo. Tswee-tswee leletsa ofisi ya rona kwa +267 390 1234 kgotsa o leke gape morago."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        localStorage.removeItem('brastorne_chat_history');
        setMessages([{
            id: '1',
            role: 'assistant',
            content: 'History cleared. How can I help you now?'
        }]);
    };

    return {
        messages,
        sendMessage,
        isLoading,
        clearHistory
    };
};
