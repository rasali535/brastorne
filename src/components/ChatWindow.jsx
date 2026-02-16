import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Wifi, WifiOff, Loader2, Trash2, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';

const ChatWindow = ({ isWidget = false, closeChat }) => {
    const { messages, sendMessage, isLoading, clearHistory } = useChat();
    const [input, setInput] = useState('');
    const [lowDataMode, setLowDataMode] = useState(false);
    const scrollRef = useRef(null);
    const isMock = import.meta.env.VITE_MOCK_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL;

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const text = input;
        setInput('');
        await sendMessage(text);
    };

    const containerClasses = isWidget
        ? "flex flex-col h-full w-full bg-white relative overflow-hidden"
        : "flex flex-col h-[90vh] w-full max-w-4xl mx-auto bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-100 sm:rounded-3xl overflow-hidden relative";

    return (
        <div className={containerClasses} role="main" aria-label="Brastorne AI Website Assistant">
            {isMock && (
                <div className="absolute top-0 left-0 w-full bg-yellow-400 text-yellow-900 text-[10px] font-bold text-center py-1 z-50 uppercase tracking-widest">
                    Preview Mode: Mock Analytics and AI Responses Active
                </div>
            )}

            {/* Header */}
            <header className={`${isWidget ? 'px-6 py-4' : 'px-8 py-6'} bg-brastorne-black text-white flex items-center justify-between shadow-xl z-10 transition-all`}>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className={`${isWidget ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-tr from-brastorne-orange to-[#ff8c52] rounded-2xl flex items-center justify-center shadow-lg rotate-3`}>
                            <Bot size={isWidget ? 24 : 28} className="text-white -rotate-3" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-brastorne-green border-2 border-brastorne-black rounded-full shadow-sm"></span>
                    </div>
                    <div>
                        <h1 className={`${isWidget ? 'text-lg' : 'text-xl'} font-extrabold tracking-tight leading-tight`}>Lebo</h1>
                        <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">Assistant</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={clearHistory}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                        aria-label="Clear chat history"
                        title="Clear History"
                    >
                        <Trash2 size={isWidget ? 18 : 20} />
                    </button>

                    <button
                        onClick={() => setLowDataMode(!lowDataMode)}
                        className={`flex items-center space-x-2 ${isWidget ? 'p-2' : 'px-4 py-2'} rounded-xl transition-all text-[10px] font-bold border ${lowDataMode
                            ? 'bg-brastorne-orange border-brastorne-orange text-white shadow-lg'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                        aria-pressed={lowDataMode}
                        aria-label="Toggle low data mode"
                    >
                        {lowDataMode ? <WifiOff size={16} /> : <Wifi size={16} />}
                        {!isWidget && <span className="hidden md:inline">{lowDataMode ? 'LOW DATA ACTIVE' : 'STANDARD MODE'}</span>}
                    </button>

                    {isWidget && (
                        <button
                            onClick={closeChat}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                            aria-label="Close chat"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </header>

            {/* Message Area */}
            <main
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                aria-live="polite"
                aria-relevant="additions"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar - Hidden in Low Data Mode */}
                            {!lowDataMode && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${msg.role === 'user' ? 'ml-2 bg-zinc-200' : 'mr-2 bg-brastorne-green text-white'
                                    }`} aria-hidden="true">
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                            )}

                            <div className={`px-4 py-3 rounded-2xl shadow-sm border ${msg.role === 'user'
                                ? 'bg-brastorne-orange text-white border-brastorne-orange rounded-tr-none'
                                : 'bg-white text-zinc-800 border-zinc-100 rounded-tl-none'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <time className={`text-[10px] mt-1 block opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'
                                    }`}>
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </time>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start" aria-label="Brastorne AI is typing">
                        <div className="flex items-center bg-white border border-zinc-100 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm">
                            <Loader2 size={16} className="text-brastorne-green animate-spin mr-2" />
                            <span className="text-xs text-zinc-500 font-medium italic">Thinking...</span>
                        </div>
                    </div>
                )}
            </main>

            {/* Input Field */}
            <footer className="bg-white p-4 border-t border-zinc-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about mAgri, Mpotsa..."
                        className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brastorne-orange focus:border-transparent transition-all text-sm"
                        aria-label="Chat input"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1.5 p-2 bg-brastorne-orange text-white rounded-lg hover:bg-[#d95a1d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
                <p className="text-[10px] text-zinc-400 text-center mt-3 uppercase tracking-widest font-bold">
                    Empowering the underserved
                </p>
            </footer>
        </div>
    );
};

export default ChatWindow;
