import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useChat = () => {
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('brastorne_chat_history');
        if (saved) return JSON.parse(saved);

        // Initial onboarding message
        return [
            { id: '1', role: 'assistant', content: "Dumela! Welcome to Brastorne. I'm Lebo, and I'm excited to help you. Before we dive into our services, could you please tell me your name? / Leina la gago ke mang?" }
        ];
    });

    const [onboardingStep, setOnboardingStep] = useState(() => {
        const step = localStorage.getItem('brastorne_onboarding_step');
        return step ? parseInt(step) : 0;
    });

    const [userData, setUserData] = useState(() => {
        const data = localStorage.getItem('brastorne_user_data');
        return data ? JSON.parse(data) : { name: '', email: '', interest: '' };
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

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('brastorne_chat_history', JSON.stringify(messages));
        localStorage.setItem('brastorne_onboarding_step', onboardingStep.toString());
        localStorage.setItem('brastorne_user_data', JSON.stringify(userData));
    }, [messages, onboardingStep, userData]);

    const saveLead = async (data) => {
        try {
            await supabase.from('leads').insert([data]);
        } catch (e) {
            console.warn('Lead capture failed', e);
        }
    };

    const sendMessage = async (content) => {
        if (!content.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // --- ONBOARDING LOGIC ---
        if (onboardingStep < 3) {
            setTimeout(async () => {
                let reply = "";
                let nextStep = onboardingStep;
                let nextData = { ...userData };

                if (onboardingStep === 0) {
                    nextData.name = content;
                    reply = `Nice to meet you, ${content}! Could you share your email address so we can keep in touch? / O ka re naya email ya gago gore re kgone go ikgolaganya le wena?`;
                    nextStep = 1;
                } else if (onboardingStep === 1) {
                    // Simple email validation
                    if (!content.includes('@')) {
                        reply = "That doesn't look like a valid email. Please try again! / Email eo e lebega e se fela ka fa re e tlhokang ka gone. Tswee-tswee leka gape.";
                    } else {
                        nextData.email = content;
                        reply = "Got it! Lastly, what are you most interested in? (mAgri, Mpotsa, or Vuka) / O tlhoka go itse thata ka eng gareng ga tse: mAgri, Mpotsa, kgotsa Vuka?";
                        nextStep = 2;
                    }
                } else if (onboardingStep === 2) {
                    nextData.interest = content;
                    reply = `Thank you, ${userData.name}! You're all set. I can now answer any questions you have about Brastorne or our services. What's on your mind?`;
                    nextStep = 3;

                    // Finalize onboarding and save lead
                    await saveLead(nextData);
                }

                setUserData(nextData);
                setOnboardingStep(nextStep);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: reply
                }]);
                setIsLoading(false);
            }, 800);
            return;
        }
        // --- END ONBOARDING ---

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
            // Determine if we should use Supabase Edge Functions or the Railway Backend
            // Default to Backend if not specified, or if VITE_API_URL is present
            const useBackend = !import.meta.env.VITE_USE_EDGE_FUNCTION;
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            let replyText = '';

            if (useBackend) {
                // Call Railway Backend
                const response = await fetch(`${backendUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: content, history: messages.slice(-5) })
                });

                if (!response.ok) {
                    throw new Error(`Backend Error: ${response.statusText}`);
                }

                const data = await response.json();
                replyText = data.reply;
            } else {
                // Fallback: Use Supabase Edge Function
                const { data, error } = await supabase.functions.invoke('chat-query', {
                    body: { query: content, history: messages.slice(-5) }
                });

                if (error) throw error;
                replyText = data.reply;
            }

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: replyText
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
        localStorage.removeItem('brastorne_onboarding_step');
        localStorage.removeItem('brastorne_user_data');
        setOnboardingStep(0);
        setUserData({ name: '', email: '', interest: '' });
        setMessages([{
            id: '1',
            role: 'assistant',
            content: "Dumela! Welcome back to Brastorne. Could you please tell me your name again? / Leina la gago ke mang?"
        }]);
    };

    return {
        messages,
        sendMessage,
        isLoading,
        clearHistory
    };
};
