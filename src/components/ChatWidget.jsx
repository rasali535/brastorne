import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { MessageSquare, X } from 'lucide-react';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window Container */}
            <div
                className={`transition-all duration-300 ease-in-out transform origin-bottom-right mb-4 ${isOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                    }`}
                style={{ width: 'min(calc(100vw - 48px), 400px)' }}
            >
                {/* We need to override the h-[90vh] and max-w-4xl from ChatWindow if needed, 
                    or we can just let it fit. Actually ChatWindow has h-[90vh] which is too big for a widget.
                    I'll modify ChatWindow to be more flexible or provide a variant.
                 */}
                <div className="h-[600px] max-h-[70vh] bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col">
                    <ChatWindow isWidget={true} closeChat={() => setIsOpen(false)} />
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-zinc-800 text-white rotate-90' : 'bg-brastorne-orange text-white'
                    }`}
                aria-label={isOpen ? "Close chat" : "Open chat with Lebo"}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>
        </div>
    );
};

export default ChatWidget;
