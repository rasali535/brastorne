import React from 'react'
import ChatWidget from './components/ChatWidget'
import './index.css'

function App() {
    return (
        <div className="min-h-screen bg-zinc-50 font-sans">
            {/* Dummy Website Sections to show floating effect */}
            <div className="max-w-6xl mx-auto py-20 px-8 space-y-32">
                <section>
                    <h2 className="text-5xl font-extrabold text-brastorne-black mb-6">Connecting the Unconnected.</h2>
                    <p className="text-xl text-zinc-600 max-w-2xl">
                        Brastorne is committed to bridging the digital divide across Africa through innovative USSD-based solutions.
                    </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {['mAgri', 'Mpotsa', 'Vuka'].map(service => (
                        <div key={service} className="p-8 bg-white rounded-3xl shadow-sm border border-zinc-100 hover:shadow-xl transition-shadow cursor-default group">
                            <div className="w-12 h-12 bg-zinc-100 rounded-2xl mb-6 group-hover:bg-brastorne-orange transition-colors"></div>
                            <h3 className="text-2xl font-bold mb-4">{service}</h3>
                            <p className="text-zinc-500">Transforming lives through accessible mobile technology.</p>
                        </div>
                    ))}
                </section>
            </div>

            {/* The Floating Chatbot */}
            <ChatWidget />
        </div>
    )
}

export default App

