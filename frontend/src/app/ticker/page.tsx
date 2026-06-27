'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

interface TickerSignal {
    id: string;
    pair: string;
    direction: 'LONG' | 'SHORT';
    entry: number;
    tp: number;
    sl: number;
    confidence: number;
    regime: string;
    age: number; // seconds ago
    paid: boolean;
}

interface PriceTick {
    pair: string;
    price: number;
    change24h: number;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
const REGIMES = ['Bullish Momentum', 'Ranging', 'Bearish Reversal', 'Breakout Setup', 'Mean Reversion'];

function genSignal(pair: string, basePrice: number, id: string): TickerSignal {
    const dir: 'LONG' | 'SHORT' = Math.random() > 0.45 ? 'LONG' : 'SHORT';
    const spread = basePrice * 0.004;
    const entry = basePrice + (Math.random() - 0.5) * spread;
    const tp = dir === 'LONG' ? entry * (1 + 0.015 + Math.random() * 0.025) : entry * (1 - 0.015 - Math.random() * 0.025);
    const sl = dir === 'LONG' ? entry * (1 - 0.007 - Math.random() * 0.008) : entry * (1 + 0.007 + Math.random() * 0.008);
    return {
        id,
        pair,
        direction: dir,
        entry,
        tp,
        sl,
        confidence: 70 + Math.floor(Math.random() * 25),
        regime: REGIMES[Math.floor(Math.random() * REGIMES.length)],
        age: Math.floor(Math.random() * 120),
        paid: Math.random() > 0.4,
    };
}

const SEED_PRICES: Record<string, number> = {
    'BTC/USDT': 67420,
    'ETH/USDT': 3540,
    'SOL/USDT': 178,
    'BNB/USDT': 592,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
    return n.toFixed(decimals > 4 ? 4 : decimals);
}

function age(s: number): string {
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TickerPage() {
    const searchParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    const isEmbed = searchParams?.get('embed') === 'true';

    const [prices, setPrices] = useState<Record<string, PriceTick>>(() => ({
        'BTC/USDT': { pair: 'BTC/USDT', price: SEED_PRICES['BTC/USDT'], change24h: 2.14 },
        'ETH/USDT': { pair: 'ETH/USDT', price: SEED_PRICES['ETH/USDT'], change24h: 1.87 },
        'SOL/USDT': { pair: 'SOL/USDT', price: SEED_PRICES['SOL/USDT'], change24h: -0.92 },
        'BNB/USDT': { pair: 'BNB/USDT', price: SEED_PRICES['BNB/USDT'], change24h: 0.34 },
    }));

    const [signals, setSignals] = useState<TickerSignal[]>(() =>
        PAIRS.flatMap((p, i) =>
            [0, 1].map(j => genSignal(p, SEED_PRICES[p], `${p}-${i}-${j}`))
        )
    );

    const [activePair, setActivePair] = useState<string>('BTC/USDT');
    const [totalPaid, setTotalPaid] = useState(312);
    const [lastPaid, setLastPaid] = useState<string | null>(null);
    const pricesRef = useRef(prices);
    pricesRef.current = prices;

    // Simulate live price ticks
    useEffect(() => {
        const id = setInterval(() => {
            setPrices(prev => {
                const next = { ...prev };
                PAIRS.forEach(p => {
                    const drift = (Math.random() - 0.499) * next[p].price * 0.0008;
                    const newPrice = next[p].price + drift;
                    const change = next[p].change24h + (Math.random() - 0.5) * 0.04;
                    next[p] = { ...next[p], price: newPrice, change24h: change };
                });
                return next;
            });
        }, 1800);
        return () => clearInterval(id);
    }, []);

    // Age signals + occasionally push a new one
    useEffect(() => {
        const id = setInterval(() => {
            setSignals(prev => {
                const aged = prev.map(s => ({ ...s, age: s.age + 3 }));
                // Every ~30s add a new signal
                if (Math.random() > 0.85) {
                    const p = PAIRS[Math.floor(Math.random() * PAIRS.length)];
                    const price = pricesRef.current[p]?.price ?? SEED_PRICES[p];
                    const newSig = genSignal(p, price, `${p}-${Date.now()}`);
                    setTotalPaid(t => t + 1);
                    setLastPaid(`Signal unlocked · ${p} · $0.001 USDC`);
                    setTimeout(() => setLastPaid(null), 4000);
                    return [newSig, ...aged].slice(0, 16);
                }
                return aged;
            });
        }, 3000);
        return () => clearInterval(id);
    }, []);

    const filtered = signals.filter(s => activePair === 'ALL' || s.pair === activePair);

    return (
        <div className={`min-h-screen bg-background text-ink ${isEmbed ? '' : 'font-sans'}`}>
            {!isEmbed && (
                <header className="border-b border-hairline bg-background/90 backdrop-blur-sm sticky top-0 z-50">
                    <div className="mx-auto max-w-6xl px-5 sm:px-8 h-12 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="2,17 7,11 12,15 17,7 22,10" />
                                <circle cx="12" cy="15" r="2" fill="#D7FF3E" />
                            </svg>
                            <span className="font-display text-sm font-semibold">Metis</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-muted hidden sm:inline">Live Signals</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="size-1.5 rounded-full bg-approve animate-pulse" />
                            <span className="font-mono text-[10px] text-muted">{totalPaid} signals unlocked</span>
                            <Link href="/signup" className="font-mono text-[11px] bg-accent text-background px-3 py-1 rounded-full font-semibold hover:bg-white transition-colors">
                                Get Access →
                            </Link>
                        </div>
                    </div>
                </header>
            )}

            <div className={`mx-auto max-w-6xl px-4 ${isEmbed ? 'py-3' : 'py-6 sm:px-8'}`}>

                {/* Live notification toast */}
                <AnimatePresence>
                    {lastPaid && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-approve/10 border border-approve/30 text-approve font-mono text-[11px] px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
                        >
                            <span className="size-1.5 rounded-full bg-approve animate-pulse" />
                            {lastPaid}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Price strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {PAIRS.map(pair => {
                        const tick = prices[pair];
                        const isPos = tick.change24h >= 0;
                        return (
                            <motion.button
                                key={pair}
                                onClick={() => setActivePair(activePair === pair ? 'ALL' : pair)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`border p-3 text-left transition-all rounded-2xl ${
                                    activePair === pair
                                        ? 'border-accent bg-accent/5'
                                        : 'border-hairline bg-surface hover:border-white/20'
                                }`}
                            >
                                <p className="font-mono text-[9px] text-muted uppercase tracking-wider mb-1">
                                    {pair.replace('/USDT', '')}
                                </p>
                                <p className="font-display text-base font-bold text-ink tabular-nums">
                                    ${fmt(tick.price)}
                                </p>
                                <p className={`font-mono text-[10px] font-semibold ${isPos ? 'text-approve' : 'text-block'}`}>
                                    {isPos ? '+' : ''}{tick.change24h.toFixed(2)}%
                                </p>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Pair filter tabs */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {['ALL', ...PAIRS].map(p => (
                        <button
                            key={p}
                            onClick={() => setActivePair(p)}
                            className={`font-mono text-[10px] px-3 py-1 rounded-full border transition-all ${
                                activePair === p
                                    ? 'bg-accent text-background border-accent font-semibold'
                                    : 'border-hairline text-muted hover:border-white/20 hover:text-ink'
                            }`}
                        >
                            {p === 'ALL' ? 'All Pairs' : p.replace('/USDT', '')}
                        </button>
                    ))}
                    <span className="ml-auto font-mono text-[10px] text-muted self-center">
                        Showing {filtered.length} signals
                    </span>
                </div>

                {/* Signal cards */}
                <div className="grid gap-2 sm:grid-cols-2">
                    <AnimatePresence>
                        {filtered.map(sig => (
                            <motion.div
                                key={sig.id}
                                layout
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                                className={`border rounded-2xl p-4 ${
                                    sig.direction === 'LONG'
                                        ? 'border-approve/20 bg-approve/[0.03]'
                                        : 'border-block/20 bg-block/[0.03]'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            sig.direction === 'LONG'
                                                ? 'bg-approve/15 text-approve'
                                                : 'bg-block/15 text-block'
                                        }`}>
                                            {sig.direction}
                                        </span>
                                        <span className="font-display text-sm font-bold text-ink">{sig.pair}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sig.paid && (
                                            <span className="font-mono text-[9px] text-approve border border-approve/20 px-1.5 py-0.5 rounded-full">
                                                ✓ paid
                                            </span>
                                        )}
                                        <span className="font-mono text-[9px] text-muted">{age(sig.age)}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {[
                                        { label: 'Entry', value: `$${fmt(sig.entry)}`, color: 'text-ink' },
                                        { label: 'Take Profit', value: `$${fmt(sig.tp)}`, color: 'text-approve' },
                                        { label: 'Stop Loss', value: `$${fmt(sig.sl)}`, color: 'text-block' },
                                    ].map(m => (
                                        <div key={m.label} className="bg-background/60 rounded-xl p-2 text-center">
                                            <p className="font-mono text-[8px] text-muted uppercase mb-0.5">{m.label}</p>
                                            <p className={`font-mono text-[11px] font-semibold tabular-nums ${m.color}`}>{m.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-accent"
                                                style={{ width: `${sig.confidence}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-[10px] text-muted">{sig.confidence}% conf.</span>
                                    </div>
                                    <span className="font-mono text-[9px] text-muted">{sig.regime}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                {!isEmbed && (
                    <div className="mt-8 pt-6 border-t border-hairline flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-approve animate-pulse" />
                            <span className="font-mono text-[10px] text-muted">Live · Arc L1 Testnet · Updates every ~3s</span>
                        </div>
                        <Link href="/signup" className="font-mono text-xs text-accent hover:underline">
                            Get full access — $0.001 USDC/signal →
                        </Link>
                    </div>
                )}

                {isEmbed && (
                    <div className="mt-4 text-center">
                        <a href="https://metis-app.vercel.app" target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[9px] text-muted/50 hover:text-muted transition-colors">
                            Powered by Metis · metis-app.vercel.app
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
