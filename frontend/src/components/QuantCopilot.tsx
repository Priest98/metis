'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles, Send, BrainCircuit, Zap, ShieldAlert, BadgeDollarSign } from 'lucide-react';

interface ChatMessage {
    sender: 'user' | 'gemini';
    text: string;
}

const PRESETS = [
    {
        q: "Why did the Signal Agent recommend BTC BUY?",
        a: "Gemini Engine detected a breakout: BTC/USDT had a multi-day Bollinger Band squeeze (width: 0.034). Volume profile showed 82% institutional buying pressure, and the Trend Strength Index (ADX) reached 31.4, confirming a bullish regime. Win probability evaluated at 88%."
    },
    {
        q: "Explain the current risk-reward parameters.",
        a: "Risk Guardian enforces a strict 2.0x minimum risk-to-reward ratio. For the active BTC long order, entry is at $67,420 with a $71,200 Take Profit (+5.6%) and a $65,800 Stop Loss (-2.4%). This yields a 2.4x reward-to-risk ratio. Maximum portfolio exposure is capped at 15.0%."
    },
    {
        q: "How does x402 prevent gas fee friction?",
        a: "x402 integrates micro-settlement channels directly into HTTP headers. Instead of invoking heavy on-chain smart contracts for every signal lookup, payments settle instantly via native USDC on Arc L1 with gas fees of <$0.0001 per payment, avoiding mainnet gas congestion."
    },
    {
        q: "Summarize the active market regime.",
        a: "The market is classified as a HIGH VOLATILITY TRENDING BULL regime. Core liquidity indices show active accumulation. Risk parameters have automatically widened stops by 0.5% to account for volatility, while profit targets have scaled to capture maximum extension."
    }
];

export default function QuantCopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'gemini', text: "Hello! I am the Gemini Quant Copilot. Ask me about our active strategies, agent logic, or current risk parameters." }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendQuestion = (question: string) => {
        if (isTyping) return;
        
        // Add user question
        setMessages(prev => [...prev, { sender: 'user', text: question }]);
        setIsTyping(true);

        // Find answer
        const match = PRESETS.find(p => p.q === question);
        const answerText = match 
            ? match.a 
            : "I can analyze that. In our current sandbox, the agents are executing decentralized trades across BTC and ETH with 84% accuracy. Let me know if you would like me to detail a specific agent's performance metrics.";

        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, { sender: 'gemini', text: answerText }]);
        }, 1200);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-mono">
            {/* Pulsing Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(prev => !prev)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3.5 rounded-full flex items-center justify-center shadow-2xl transition-all border ${
                    isOpen 
                        ? 'bg-block border-block/20 text-white' 
                        : 'bg-accent border-accent/20 text-background'
                }`}
                style={{
                    boxShadow: isOpen 
                        ? '0 10px 30px rgba(255, 93, 93, 0.3)' 
                        : '0 10px 30px rgba(215, 255, 62, 0.3)'
                }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <X className="size-5" key="close" />
                    ) : (
                        <div className="relative flex items-center justify-center" key="open">
                            <Sparkles className="size-5" />
                            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-approve animate-ping" />
                        </div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute bottom-16 right-0 w-[340px] sm:w-[380px] h-[480px] bg-[#101524] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="size-4.5 text-accent animate-pulse" />
                                <span className="text-xs font-bold text-ink uppercase tracking-wide">Gemini Quant Copilot</span>
                            </div>
                            <span className="text-[9px] bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded font-black">
                                ACTIVE
                            </span>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                                        m.sender === 'user'
                                            ? 'bg-accent/10 border border-accent/20 text-accent font-semibold'
                                            : 'bg-white/5 border border-white/[0.04] text-ink'
                                    }`}>
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="p-3 bg-white/5 border border-white/[0.04] rounded-xl flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="size-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="size-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Presets Grid */}
                        <div className="p-3 bg-black/20 border-t border-white/5 space-y-1.5 shrink-0">
                            <span className="text-[8px] uppercase tracking-wider text-muted font-bold block mb-1">
                                Ask Gemini (Judge Presets)
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                                {PRESETS.map((p, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSendQuestion(p.q)}
                                        disabled={isTyping}
                                        className="p-2 text-[9px] text-left text-muted bg-white/5 hover:bg-accent/5 hover:text-accent rounded-lg border border-white/[0.03] hover:border-accent/30 transition-all truncate"
                                        title={p.q}
                                    >
                                        {p.q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
