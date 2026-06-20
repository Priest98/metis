'use client';

import React, { useEffect, useState } from 'react';
import { Coins, ShieldCheck, Zap, Activity } from 'lucide-react';

interface FeedItem {
    id: string;
    message: string;
    timestamp: string;
    type: 'payment' | 'signal' | 'system';
    value?: string;
}

export default function LivePaymentFeed() {
    const [feed, setFeed] = useState<FeedItem[]>([
        { id: '1', message: 'User 0x71C...76B unlocked BTCUSDT entry target details', timestamp: 'Just now', type: 'payment', value: '0.0010 USDC' },
        { id: '2', message: 'Strategy "RSI Scalper" generated BUY signal on ETHUSDT', timestamp: '2m ago', type: 'signal' },
        { id: '3', message: 'User 0x4fa...ef3 unlocked SOLUSDT signal explanation', timestamp: '4m ago', type: 'payment', value: '0.0005 USDC' },
        { id: '4', message: 'AI Agent "Gemini-Quant" completed market regime analysis', timestamp: '8m ago', type: 'system' },
        { id: '5', message: 'User 0x98d...a3e unlocked BTCUSDT risk metrics', timestamp: '12m ago', type: 'payment', value: '0.0010 USDC' }
    ]);

    useEffect(() => {
        const templates = [
            { message: 'User 0x{addr} unlocked {sym} entry target details', type: 'payment', val: '{price} USDC' },
            { message: 'Strategy "{strat}" generated {dir} signal on {sym}', type: 'signal' },
            { message: 'User 0x{addr} unlocked {sym} trade justification', type: 'payment', val: '{price} USDC' },
            { message: 'AI Agent "Gemini-Quant" updated probability score for {sym}', type: 'system' }
        ];

        const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSD', 'GBPUSD'];
        const strategies = ['RSI Scalper', 'EMA Trend Follower', 'FvG Liquidity Sweep', 'MACD Divergence'];
        const prices = ['0.0010', '0.0015', '0.0005', '0.0020'];

        const interval = setInterval(() => {
            const template = templates[Math.floor(Math.random() * templates.length)];
            const sym = symbols[Math.floor(Math.random() * symbols.length)];
            const strat = strategies[Math.floor(Math.random() * strategies.length)];
            const price = prices[Math.floor(Math.random() * prices.length)];
            const dir = Math.random() > 0.5 ? 'BUY' : 'SELL';
            
            // Random address
            const addr = Array.from({ length: 6 }, () => 
                Math.floor(Math.random() * 16).toString(16).toUpperCase()
            ).join('');

            let msg = template.message
                .replace('{sym}', sym)
                .replace('{strat}', strat)
                .replace('{dir}', dir)
                .replace('{addr}', addr);

            const newItem: FeedItem = {
                id: Math.random().toString(),
                message: msg,
                timestamp: 'Just now',
                type: template.type as any,
                value: template.val ? template.val.replace('{price}', price) : undefined
            };

            setFeed(prev => {
                // Update previous "Just now" timestamps to "1m ago"
                const updated = prev.map(item => {
                    if (item.timestamp === 'Just now') {
                        return { ...item, timestamp: '1m ago' };
                    }
                    return item;
                });
                return [newItem, ...updated.slice(0, 4)];
            });
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-card rounded-2xl p-6 border border-white/[0.04] glow-indigo relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h3 className="text-lg font-bold text-white tracking-tight">Live Arc L1 Nanopayments</h3>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Sync Active</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {feed.map((item) => (
                    <div 
                        key={item.id} 
                        className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/[0.01] border border-white/[0.02] hover:bg-white/[0.02] hover:border-white/[0.04] transition-all duration-300 animate-fade-in"
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                item.type === 'payment' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : item.type === 'signal'
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                                {item.type === 'payment' ? <Coins className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-300 leading-snug">{item.message}</p>
                                <span className="text-[10px] text-slate-500 font-semibold">{item.timestamp}</span>
                            </div>
                        </div>
                        {item.value && (
                            <span className="text-xs font-bold text-amber-400 whitespace-nowrap bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                {item.value}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
