'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import HeroCanvas from '@/components/HeroCanvas';
import { LogoMark } from '@/components/LogoMark';

interface PlatformStats {
    total_signals: number;
    avg_win_rate: number;
    avg_sharpe: number;
    total_usdc_earned: number;
    total_backtests: number;
}

export default function LandingPage() {
    const shouldReduceMotion = useReducedMotion();
    const easeCurve: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Premium expo-out curve

    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [heroEmail, setHeroEmail] = useState('');
    
    // Countdown state (Days:Hours:Minutes:Seconds)
    const [countdown, setCountdown] = useState({ d: 0, h: 4, m: 12, s: 18 });

    useEffect(() => {
        // Fetch stats from backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        fetch(`${apiUrl}/stats/`)
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setStats(d))
            .catch(() => {});

        // Countdown timer tick
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev.s > 0) {
                    return { ...prev, s: prev.s - 1 };
                } else if (prev.m > 0) {
                    return { ...prev, m: prev.m - 1, s: 59 };
                } else if (prev.h > 0) {
                    return { ...prev, h: prev.h - 1, m: 59, s: 59 };
                } else if (prev.d > 0) {
                    return { d: prev.d - 1, h: 23, m: 59, s: 59 };
                } else {
                    // Reset to a randomized interval to keep it ticking
                    return { d: 0, h: Math.floor(Math.random() * 6), m: Math.floor(Math.random() * 60), s: 59 };
                }
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num: number) => {
        return num < 10 ? `0${num}` : num.toString();
    };

    const handleHeroSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (heroEmail) {
            window.location.href = `/login?email=${encodeURIComponent(heroEmail)}`;
        } else {
            window.location.href = '/login';
        }
    };

    // Animation variants
    const sectionRevealVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 32 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: easeCurve,
                staggerChildren: 0.12,
            }
        }
    };

    const itemRevealVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: easeCurve
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-ink font-sans">

            {/* ────────────────── HERO ─────────────────── */}
            <section className="relative overflow-hidden border-b border-hairline">
                <HeroCanvas />

                {/* Accent glow at base of hero */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-96 z-0"
                    style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 115%, rgba(215,255,62,0.06), transparent 70%)' }}
                />

                <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 z-10">
                    <div className="grid lg:grid-cols-12 gap-16 items-center min-h-[82svh]">
                        
                        {/* Left Side: Copywriting & Actions */}
                        <div className="lg:col-span-7 space-y-6">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: easeCurve }}
                                className="text-accent font-mono text-xs tracking-[0.25em] font-semibold uppercase block"
                            >
                                powered by Google Gemini · Arc L1 Network
                            </motion.p>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1, ease: easeCurve }}
                                className="font-display text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight text-ink uppercase"
                            >
                                On-Demand AI <span className="text-accent">Quant Intelligence</span> Platform
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: easeCurve }}
                                className="max-w-xl text-sm sm:text-base text-muted leading-relaxed"
                            >
                                Retail traders shouldn&apos;t pay $100/month for signals they use 3 times.
                                Metis runs AI-powered regime detection, vectorized backtesting, and
                                precise entry coordination — unlocked for <span className="font-mono text-accent">$0.001 USDC</span> per request.
                            </motion.p>

                            {/* Pill inline Input Field */}
                            <motion.form
                                onSubmit={handleHeroSubmit}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3, ease: easeCurve }}
                                className="relative max-w-md w-full flex items-center bg-[#161622]/40 border border-hairline rounded-full p-1"
                            >
                                <input
                                    type="email"
                                    value={heroEmail}
                                    onChange={(e) => setHeroEmail(e.target.value)}
                                    placeholder="Enter your email here"
                                    className="bg-transparent text-ink placeholder:text-muted/40 pl-5 pr-32 py-2.5 w-full text-xs font-mono focus:outline-none rounded-full"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1 top-1 bottom-1 bg-accent text-background hover:bg-accent/90 font-mono text-xs font-semibold px-5 rounded-full transition-all active:scale-[0.98]"
                                >
                                    Sign Up
                                </button>
                            </motion.form>

                            {/* Identity Provider Row */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="space-y-2.5 pt-2"
                            >
                                <span className="font-mono text-[10px] text-muted/60 uppercase tracking-widest block">
                                    Or Connect Instant Terminal
                                </span>
                                <div className="flex flex-wrap items-center gap-3">
                                    {[
                                        {
                                            name: 'Google',
                                            icon: (
                                                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.133 1 1 6.133 1 12.24s5.133 11.24 11.24 11.24c6.378 0 10.623-4.484 10.623-10.82 0-.73-.08-1.28-.175-1.832H12.24z"/>
                                                </svg>
                                            )
                                        },
                                        {
                                            name: 'Apple',
                                            icon: (
                                                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
                                                </svg>
                                            )
                                        },
                                        {
                                            name: 'Telegram',
                                            icon: (
                                                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                                                </svg>
                                            )
                                        },
                                        {
                                            name: 'EVM Wallet',
                                            icon: (
                                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                                                </svg>
                                            )
                                        }
                                    ].map(prov => (
                                        <Link
                                            key={prov.name}
                                            href="/login"
                                            title={prov.name}
                                            className="size-9 rounded-full border border-hairline bg-[#111118]/50 flex items-center justify-center text-muted hover:border-accent hover:text-accent hover:bg-[#161622] transition-all hover:scale-105 active:scale-95"
                                        >
                                            {prov.icon}
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Side: Stacked Metric Boxes */}
                        <div className="lg:col-span-5 space-y-6">
                            
                            {/* Card 1: Next Agent Run */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, delay: 0.2, ease: easeCurve }}
                                className="border border-hairline bg-[#111118]/80 backdrop-blur-md p-6 rounded-[1.5rem] relative overflow-hidden"
                            >
                                <div className="absolute right-0 top-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
                                
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                                        Next Agent Update
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-[#22c787]/10 px-2 py-0.5 border border-[#22c787]/20 rounded-full">
                                        <span className="size-1.5 rounded-full bg-[#22c787] animate-pulse" />
                                        <span className="font-mono text-[9px] text-[#22c787] font-bold uppercase tracking-wider">Active</span>
                                    </div>
                                </div>

                                <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-wider text-ink tabular-nums flex items-baseline gap-1.5">
                                    <span>{formatNumber(countdown.d)}</span>
                                    <span className="text-xs text-muted">d</span>
                                    <span className="text-muted/40">:</span>
                                    <span>{formatNumber(countdown.h)}</span>
                                    <span className="text-xs text-muted">h</span>
                                    <span className="text-muted/40">:</span>
                                    <span>{formatNumber(countdown.m)}</span>
                                    <span className="text-xs text-muted">m</span>
                                    <span className="text-muted/40">:</span>
                                    <span className="text-accent">{formatNumber(countdown.s)}</span>
                                    <span className="text-xs text-accent">s</span>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3.5">
                                    <span className="font-mono text-[9px] text-muted/60 uppercase">Epoch #726</span>
                                    <Link href="/login" className="font-mono text-[10px] text-accent hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider">
                                        See live agent feed →
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Card 2: 24h Signals Volume */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, delay: 0.3, ease: easeCurve }}
                                className="border border-hairline bg-[#111118]/80 backdrop-blur-md p-6 rounded-[1.5rem]"
                            >
                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted block mb-1.5">
                                    24h Trading Volume
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-display text-3xl font-black text-ink">
                                        {stats ? `$${stats.total_usdc_earned.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}` : '—'}
                                    </span>
                                    <span className="font-mono text-xs text-accent font-bold">USDC</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3.5">
                                    <span className="font-mono text-[9px] text-muted/60 uppercase">Settled on Arc L1</span>
                                    <Link href="/login" className="font-mono text-[10px] text-accent hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider">
                                        View tx log →
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Card 3: Popular Signals Table */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, delay: 0.4, ease: easeCurve }}
                                className="border border-hairline bg-[#111118]/80 backdrop-blur-md p-5 rounded-[1.5rem]"
                            >
                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted block mb-3.5">
                                    Popular Signals
                                </span>
                                <div className="space-y-3 font-mono text-xs">
                                    {[
                                        { sym: 'BTC', price: '$67,420.00', pct: '+3.47%', up: true },
                                        { sym: 'ETH', price: '$3,240.50', pct: '-1.08%', up: false },
                                        { sym: 'SOL', price: '$145.20', pct: '+5.22%', up: true },
                                        { sym: 'BNB', price: '$580.40', pct: '-0.15%', up: false }
                                    ].map(coin => (
                                        <div key={coin.sym} className="flex justify-between items-center py-0.5">
                                            <span className="font-bold text-ink">{coin.sym}USDT</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted/80">{coin.price}</span>
                                                <span className={`w-14 text-right font-bold ${coin.up ? 'text-approve' : 'text-block'}`}>
                                                    {coin.pct}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </section>

            {/* ───────────────── CAPABILITIES DECK ─────────── */}
            <section className="border-b border-hairline bg-surface/30">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="mx-auto max-w-6xl px-5 py-20 sm:px-8"
                >
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <p className="text-accent font-mono text-[10px] tracking-[0.25em] font-semibold uppercase block mb-3">
                                agent run types
                            </p>
                            <h2 className="font-display text-3xl font-black text-ink uppercase tracking-tight">
                                Seize Your Next Max Trade
                            </h2>
                        </div>
                        {/* Carousel controls */}
                        <div className="flex items-center gap-2">
                            <button className="size-10 rounded-full border border-hairline bg-[#111118]/50 flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button className="size-10 rounded-full border border-hairline bg-[#111118]/50 flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                type: 'ANALYZE',
                                label: 'Market regime detection.',
                                desc: 'Gemini reads live price feeds, order-book depth, and on-chain funding rates to classify the current regime: trending, ranging, or reversal.',
                                cost: 'real-time · $0.001 USDC',
                                color: 'text-approve',
                                dot: 'bg-approve'
                            },
                            {
                                type: 'BACKTEST',
                                label: 'Strategy validation.',
                                desc: 'Vectorized simulation across 3 years of OHLCV data. Sharpe ratio, max drawdown, win rate — quantified before you risk a single dollar.',
                                cost: 'validated · $0.001 USDC',
                                color: 'text-review',
                                dot: 'bg-[#f5a623]'
                            },
                            {
                                type: 'SIGNAL',
                                label: 'Entry coordinates.',
                                desc: 'Precise entry price, take-profit levels, stop-loss coordinates, and risk-adjusted position size — ready to execute immediately.',
                                cost: 'actionable · $0.001 USDC',
                                color: 'text-accent',
                                dot: 'bg-accent'
                            }
                        ].map((m, idx) => (
                            <motion.div
                                key={m.type}
                                variants={itemRevealVariants}
                                whileHover={shouldReduceMotion ? {} : { y: -6, borderColor: 'rgba(255,255,255,0.18)' }}
                                className="flex flex-col border border-hairline bg-[#111118]/60 p-8 rounded-[1.5rem] transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className={`font-mono text-3xl font-black tracking-tight ${m.color}`}>{m.type}</div>
                                <div className="font-mono mt-5 text-sm font-semibold text-ink">{m.label}</div>
                                <p className="mt-3 text-xs leading-relaxed text-muted">{m.desc}</p>
                                <span className="font-mono mt-8 pt-5 border-t border-hairline/60 inline-flex items-center gap-1.5 text-[10px] text-muted">
                                    <span className={`inline-block size-1.5 rounded-full ${m.dot}`} />
                                    {m.cost}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Sliding indicator dots */}
                    <div className="flex justify-center gap-1.5 mt-8">
                        <span className="w-6 h-1.5 bg-accent rounded-full" />
                        <span className="w-1.5 h-1.5 bg-hairline rounded-full" />
                        <span className="w-1.5 h-1.5 bg-hairline rounded-full" />
                    </div>
                </motion.div>
            </section>

            {/* ───────────────── QUANT SIGNALS FEED ─────────── */}
            <section className="border-b border-hairline">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8"
                >
                    <div className="grid lg:grid-cols-2 gap-8">
                        
                        {/* Table 1: Active Signals */}
                        <div className="border border-hairline bg-[#111118]/50 p-6 rounded-[2rem] space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-hairline">
                                <span className="font-display text-lg font-bold text-ink uppercase tracking-tight">
                                    Active Quant Signals
                                </span>
                                <span className="font-mono text-[9px] bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                    Live
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full font-mono text-xs text-left">
                                    <thead>
                                        <tr className="text-muted/60 border-b border-hairline/40">
                                            <th className="py-2.5 font-medium">Pair</th>
                                            <th className="py-2.5 font-medium text-center">Type</th>
                                            <th className="py-2.5 font-medium text-right">Entry</th>
                                            <th className="py-2.5 font-medium text-right">TP / SL</th>
                                            <th className="py-2.5 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline/35">
                                        {[
                                            { pair: 'BTCUSDT', type: 'LONG', entry: '67,420', tp: '71,200', sl: '65,800', typeColor: 'text-approve' },
                                            { pair: 'ETHUSDT', type: 'SHORT', entry: '3,240', tp: '3,010', sl: '3,380', typeColor: 'text-block' },
                                            { pair: 'SOLUSDT', type: 'LONG', entry: '145.20', tp: '158.00', sl: '141.50', typeColor: 'text-approve' },
                                            { pair: 'BNBUSDT', type: 'LONG', entry: '580.40', tp: '620.00', sl: '565.00', typeColor: 'text-approve' }
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-white/[0.01]">
                                                <td className="py-3 font-semibold text-ink">{row.pair}</td>
                                                <td className={`py-3 text-center font-bold ${row.typeColor}`}>{row.type}</td>
                                                <td className="py-3 text-right">${row.entry}</td>
                                                <td className="py-3 text-right text-muted/95">${row.tp} <span className="text-muted/40">/</span> ${row.sl}</td>
                                                <td className="py-3 text-right">
                                                    <Link href="/login" className="bg-ink hover:bg-accent text-background font-bold text-[10px] uppercase py-1 px-3.5 rounded-full transition-all">
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Table 2: Top Strategies */}
                        <div className="border border-hairline bg-[#111118]/50 p-6 rounded-[2rem] space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-hairline">
                                <span className="font-display text-lg font-bold text-ink uppercase tracking-tight">
                                    Top Performing Strategies
                                </span>
                                <span className="font-mono text-[9px] text-muted uppercase">3y Backtests</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full font-mono text-xs text-left">
                                    <thead>
                                        <tr className="text-muted/60 border-b border-hairline/40">
                                            <th className="py-2.5 font-medium">Strategy</th>
                                            <th className="py-2.5 font-medium text-center">Win Rate</th>
                                            <th className="py-2.5 font-medium text-right">Sharpe</th>
                                            <th className="py-2.5 font-medium text-right">Returns</th>
                                            <th className="py-2.5 font-medium text-right">Run</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline/35">
                                        {[
                                            { name: 'Momentum Breakout', win: '64.2%', sharpe: '1.84', returns: '+114.5%' },
                                            { name: 'Mean Reversion', win: '58.7%', sharpe: '1.42', returns: '+89.2%' },
                                            { name: 'Trend Following', win: '61.5%', sharpe: '1.65', returns: '+102.8%' },
                                            { name: 'Grid Arbitrage', win: '72.1%', sharpe: '2.10', returns: '+156.4%' }
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-white/[0.01]">
                                                <td className="py-3 font-semibold text-ink">{row.name}</td>
                                                <td className="py-3 text-center text-approve font-bold">{row.win}</td>
                                                <td className="py-3 text-right">{row.sharpe}</td>
                                                <td className="py-3 text-right text-approve font-bold">{row.returns}</td>
                                                <td className="py-3 text-right">
                                                    <Link href="/login" className="border border-hairline hover:border-accent hover:text-accent font-bold text-[10px] uppercase py-1 px-3.5 rounded-full transition-all">
                                                        Run
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </section>

            {/* ───────────────── PRODUCT SHOWCASE (MOBILE) ─────────── */}
            <section className="border-b border-hairline relative overflow-hidden bg-surface/10">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 grid lg:grid-cols-2 gap-16 items-center"
                >
                    <div className="space-y-6">
                        <p className="text-accent font-mono text-[10px] tracking-[0.25em] font-semibold uppercase block">
                            trade on the go
                        </p>
                        <h2 className="font-display text-4xl font-black text-ink uppercase tracking-tight">
                            Metis Mobile Terminal.<br />
                            Trade Anytime, Anywhere.
                        </h2>
                        <p className="text-sm text-muted leading-relaxed max-w-lg">
                            Trade smarter with the Metis responsive web interface. Securely audit active signals, 
                            manage dynamic agent wallets, monitor strategy backtesting execution, and toggle 
                            idle funds yield loops directly from your mobile device.
                        </p>
                        
                        {/* QR Code Block & Badges */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4">
                            <div className="bg-[#111118] border border-hairline p-3 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                {/* SVG mock QR Code */}
                                <svg className="size-24 text-ink" viewBox="0 0 100 100" fill="currentColor">
                                    <path d="M5 5h30v30H5V5zm6 6v18h18V11H11zm59-6h30v30H70V5zm6 6v18h18V11H76ZM5 70h30v30H5V70zm6 6v18h18V76H11zm34-31h10v10H45V45zm15 15h10v10H60V60zm-15 15h10v10H45V75zm15-30h10v10H60V45zm15 15h10v10H75V60zM45 5h10v10H45V5zm0 15h10v10H45V20zm15 10h10v10H60V30zm30 30h10v10H90V60zm-30 15h10v10H60V75zm30 15h10v10H90V90zm-15-15h10v10H75V75z" />
                                    <rect x="20" y="20" width="4" height="4" />
                                    <rect x="76" y="20" width="4" height="4" />
                                    <rect x="20" y="76" width="4" height="4" />
                                </svg>
                            </div>
                            <div className="space-y-3.5">
                                <p className="font-mono text-xs text-muted">
                                    Scan QR code to immediately launch the app on your iOS or Android device.
                                </p>
                                <div className="flex flex-wrap gap-2.5 font-mono text-[9px] uppercase tracking-wider font-bold">
                                    {['App Store', 'Google Play', 'Android APK', 'API Docs'].map(item => (
                                        <span key={item} className="px-3 py-1.5 border border-hairline bg-[#111118]/80 text-ink rounded-full">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Chip Graphic */}
                    <div className="flex justify-center relative">
                        {/* Glow backdrops */}
                        <div className="absolute size-96 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
                        
                        {/* Core Processor Chip SVG layout */}
                        <div className="relative w-80 h-80 flex items-center justify-center">
                            
                            {/* Circuit lines SVG */}
                            <svg className="absolute inset-0 size-full text-white/[0.03]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <circle cx="100" cy="100" r="85" strokeDasharray="3 3" />
                                <circle cx="100" cy="100" r="65" />
                                <path d="M100 15v50M100 135v50M15 100h50M135 100h50" />
                                <path d="m40 40 30 30M160 160l-30-30M160 40l-30 30M40 160l30-30" />
                            </svg>

                            {/* Outer animated rotating dashed ring */}
                            <div className="absolute border border-dashed border-accent/25 rounded-full size-64 animate-[spin_25s_linear_infinite]" />
                            
                            {/* Inner rotating solid ring */}
                            <div className="absolute border border-hairline border-t-accent/40 rounded-full size-52 animate-[spin_12s_linear_infinite_reverse]" />

                            {/* Chip Body */}
                            <div className="w-36 h-36 border border-white/10 bg-[#0e0e15] rounded-[1.8rem] shadow-2xl p-4 flex flex-col justify-between items-center relative z-10 transition-transform duration-500 hover:scale-105">
                                <div className="w-full flex justify-between">
                                    <span className="size-2 rounded-full bg-white/10" />
                                    <span className="size-2 rounded-full bg-white/10" />
                                </div>
                                <div className="flex flex-col items-center gap-1.5 py-4">
                                    <LogoMark width={24} height={24} />
                                    <span className="font-display text-sm font-semibold text-ink">METIS CORE</span>
                                    <span className="font-mono text-[8px] text-accent/80 tracking-widest uppercase">Agent L1</span>
                                </div>
                                <div className="w-full flex justify-between">
                                    <span className="size-2 rounded-full bg-white/10" />
                                    <span className="size-2 rounded-full bg-white/10" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ───────────────── FEATURE SHOWCASE 1 (YIELD) ─────────── */}
            <section id="yield-showcase" className="border-b border-hairline">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 grid lg:grid-cols-12 gap-16 items-center"
                >
                    
                    {/* Left: Desktop / Mobile Mockup */}
                    <div className="lg:col-span-6 relative flex items-center justify-center">
                        <div className="absolute size-96 bg-accent/5 rounded-full blur-[85px] pointer-events-none" />
                        
                        {/* Mockup layout */}
                        <div className="relative w-full max-w-md bg-[#0e0e15] border border-hairline rounded-[2rem] shadow-2xl p-5 overflow-hidden group">
                            
                            {/* Card Glow Header */}
                            <div className="absolute right-0 top-0 w-32 h-32 bg-accent/5 rounded-full blur-xl pointer-events-none" />

                            {/* Header row */}
                            <div className="flex justify-between items-center pb-4 border-b border-hairline">
                                <div className="flex items-center gap-2">
                                    <span className="size-2.5 rounded-full bg-accent animate-pulse" />
                                    <span className="font-mono text-xs font-semibold text-ink">Agent-4 (BTC Momentum)</span>
                                </div>
                                <span className="font-mono text-[9px] text-muted">Arc Wallet</span>
                            </div>

                            {/* Balance info */}
                            <div className="py-6 space-y-2">
                                <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">Yield Pool Balance</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-display text-4xl font-black text-ink">52.847</span>
                                    <span className="font-mono text-xs text-accent font-bold">USDC</span>
                                </div>
                                <span className="font-mono text-[9px] text-[#22c787] font-semibold block">
                                    +0.054 USDC earned interest (+5.50% APY)
                                </span>
                            </div>

                            {/* Grid metrics inside mockup */}
                            <div className="grid grid-cols-2 gap-3.5 border-t border-hairline pt-4 font-mono text-xs">
                                <div className="bg-[#111118]/80 p-3.5 border border-hairline rounded-xl">
                                    <span className="text-muted/60 block text-[9px] uppercase tracking-wider mb-1">State</span>
                                    <span className="font-bold text-approve uppercase">Lending Pool</span>
                                </div>
                                <div className="bg-[#111118]/80 p-3.5 border border-hairline rounded-xl">
                                    <span className="text-muted/60 block text-[9px] uppercase tracking-wider mb-1">Network APY</span>
                                    <span className="font-bold text-ink">5.50%</span>
                                </div>
                            </div>

                            {/* Toggle Button layout */}
                            <div className="mt-5 bg-background border border-hairline p-3 rounded-xl flex items-center justify-between">
                                <span className="font-mono text-[10px] text-muted">DeFi Yield Loop</span>
                                <div className="w-10 h-5 bg-[#22c787] rounded-full p-0.5 flex items-center justify-end relative shadow-inner">
                                    <div className="size-4 bg-[#0a0a0f] rounded-full shadow-md" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Text Copy */}
                    <div className="lg:col-span-6 space-y-6">
                        <p className="text-accent font-mono text-[10px] tracking-[0.25em] font-semibold uppercase block">
                            secure trading trend
                        </p>
                        <h2 className="font-display text-4xl font-black text-ink uppercase tracking-tight">
                            Effortless DeFi Personalization
                        </h2>
                        <p className="text-sm text-muted leading-relaxed">
                            Metis Exchange features an autonomous yield loop system built natively for on-chain agent fleets. 
                            When your deployed agents are not locked in active momentum or breakout setups, their idle capital 
                            is automatically redirected into verified DeFi lending pools.
                        </p>
                        <ul className="space-y-3 font-mono text-xs text-muted/90">
                            <li className="flex items-center gap-2.5">
                                <span className="size-1.5 rounded-full bg-accent" />
                                Earn a dynamic 5.50% interest APY automatically
                            </li>
                            <li className="flex items-center gap-2.5">
                                <span className="size-1.5 rounded-full bg-accent" />
                                Sub-cent gas fees on the Arc Testnet layer
                            </li>
                            <li className="flex items-center gap-2.5">
                                <span className="size-1.5 rounded-full bg-accent" />
                                Instant liquidity redemption when trigger conditions hit
                            </li>
                        </ul>
                        <div className="pt-2">
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-[#111118] border border-hairline hover:border-accent hover:text-accent font-mono text-xs font-semibold px-6 py-3 rounded-full transition-colors">
                                Explore Yield Loops →
                            </Link>
                        </div>
                    </div>

                </motion.div>
            </section>

            {/* ───────────────── FEATURE SHOWCASE 2 (COINS) ─────────── */}
            <section className="border-b border-hairline bg-[#0c0c14]/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-bg opacity-30 pointer-events-none" />
                
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 grid lg:grid-cols-12 gap-16 items-center"
                >
                    
                    {/* Left: Floating glowing coin stack */}
                    <div className="lg:col-span-6 flex items-center justify-center relative order-last lg:order-first">
                        <div className="absolute size-96 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
                        
                        <div className="flex gap-4 relative">
                            {/* Coin 1: USDC */}
                            <div className="w-20 h-20 bg-gradient-to-tr from-accent/80 to-[#1e1e2d] border border-accent/25 rounded-2xl shadow-xl flex items-center justify-center text-background font-bold text-2xl animate-float">
                                $
                            </div>
                            {/* Coin 2: ETH */}
                            <div className="w-20 h-20 bg-[#111118]/80 border border-hairline rounded-2xl shadow-xl flex items-center justify-center text-ink font-mono text-lg mt-8" style={{ animationDelay: '1.5s' }}>
                                Ξ
                            </div>
                            {/* Coin 3: BTC */}
                            <div className="w-20 h-20 bg-[#111118]/80 border border-hairline rounded-2xl shadow-xl flex items-center justify-center text-ink font-mono text-lg mt-16" style={{ animationDelay: '3s' }}>
                                ₿
                            </div>
                            {/* Coin 4: SOL */}
                            <div className="w-20 h-20 bg-[#111118]/80 border border-hairline rounded-2xl shadow-xl flex items-center justify-center text-ink font-mono text-sm mt-4" style={{ animationDelay: '4.5s' }}>
                                S
                            </div>
                        </div>
                    </div>

                    {/* Right: Text details */}
                    <div className="lg:col-span-6 space-y-6">
                        <p className="text-accent font-mono text-[10px] tracking-[0.25em] font-semibold uppercase block">
                            community & guidance
                        </p>
                        <h2 className="font-display text-4xl font-black text-ink uppercase tracking-tight">
                            Join Metis with a community of crypto explorers
                        </h2>
                        <p className="text-sm text-muted leading-relaxed">
                            Embark on an institutional-grade algorithmic trading journey. Build custom strategy nodes, 
                            evaluate indicators, execute micro-payment verified queries, and share optimized 
                            rules lists with a decentralized community of quant engineers.
                        </p>
                        <div className="pt-2">
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-accent text-background hover:bg-accent/90 font-mono text-xs font-semibold px-6 py-3 rounded-full transition-colors shadow-lg shadow-accent/15">
                                Start Exploring Now
                            </Link>
                        </div>
                    </div>

                </motion.div>
            </section>

            {/* ───────────────── PARTNERS ROW ─────────── */}
            <section className="border-b border-hairline bg-surface/20 py-10">
                <div className="mx-auto max-w-6xl px-5 sm:px-8">
                    <p className="text-center font-mono text-[9px] text-muted/40 uppercase tracking-widest mb-6">
                        Supported Data & Integration Partners
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16 opacity-35 hover:opacity-50 transition-opacity duration-300">
                        {['CoinMarketCap', 'TradingView', 'Lepton AI', 'Google Gemini', 'Arc L1'].map(partner => (
                            <span key={partner} className="font-display text-xs sm:text-sm font-semibold tracking-wider text-muted uppercase">
                                {partner}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────────────── SUPPORTED NETWORKS ─────────── */}
            <section className="border-b border-hairline bg-surface/40">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8"
                >
                    <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
                        <p className="text-accent font-mono text-[10px] tracking-[0.25em] font-semibold uppercase block">
                            supported collection
                        </p>
                        <h2 className="font-display text-3xl font-black text-ink uppercase tracking-tight">
                            Explore Our Crypto Collection
                        </h2>
                        <p className="text-xs text-muted leading-relaxed">
                            Integrate signals across multiple high-throughput blockchains. Micro-settlements 
                            execute on Arc Testnet via bridged USDC.
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { name: 'Bitcoin Network', ticker: 'BTC', gas: '<0.0001 USDC', speed: '10 min avg', active: '1,428 runs' },
                            { name: 'Ethereum Network', ticker: 'ETH', gas: '$0.001 USDC', speed: '12 sec avg', active: '4,842 runs' },
                            { name: 'Solana Network', ticker: 'SOL', gas: '<0.0001 USDC', speed: '400 ms avg', active: '3,612 runs' },
                            { name: 'Arbitrum One', ticker: 'ARB', gas: '<0.0005 USDC', speed: '250 ms avg', active: '2,947 runs' }
                        ].map((chain, i) => (
                            <motion.div
                                key={i}
                                variants={itemRevealVariants}
                                whileHover={shouldReduceMotion ? {} : { y: -4, borderColor: 'rgba(255,255,255,0.12)' }}
                                className="bg-[#111118]/60 border border-hairline p-5 rounded-[1.5rem] transition-all duration-300 space-y-4"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="size-8 rounded-xl bg-background border border-hairline flex items-center justify-center font-mono font-bold text-xs text-ink">
                                        {chain.ticker.slice(0, 2)}
                                    </div>
                                    <span className="font-mono text-[9px] text-[#22c787] font-semibold bg-[#22c787]/10 px-2 py-0.5 rounded-full">
                                        Active
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-display text-sm font-bold text-ink">{chain.name}</h4>
                                    <span className="font-mono text-[10px] text-muted">{chain.ticker}</span>
                                </div>
                                <div className="border-t border-hairline pt-3 grid grid-cols-2 gap-2 font-mono text-[9px] text-muted">
                                    <div>
                                        <span className="block text-[8px] uppercase text-muted/50 mb-0.5">Est. Gas</span>
                                        <span className="font-semibold text-ink">{chain.gas}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[8px] uppercase text-muted/50 mb-0.5">Speed</span>
                                        <span className="font-semibold text-ink">{chain.speed}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ────────────────── FOOTER ───────────────── */}
            <footer>
                {/* Upper Footer Links */}
                <div className="mx-auto max-w-6xl px-5 pt-20 pb-12 sm:px-8 border-b border-hairline grid gap-10 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs text-left">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-ink">
                            <LogoMark width={18} height={18} />
                            <span className="font-display text-base font-black uppercase tracking-tight">Metis</span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed max-w-xs">
                            On-demand AI-powered quantitative trading signals. Underpinned by Google Gemini 1.5 Pro and settled via USDC on Arc L1.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">Company</h4>
                        <ul className="space-y-2 text-muted">
                            <li><Link href="#" className="hover:text-accent transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-accent transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-accent transition-colors">Tech Stack</Link></li>
                            <li><Link href="#" className="hover:text-accent transition-colors">Hackathon Details</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">Resources</h4>
                        <ul className="space-y-2 text-muted">
                            <li><Link href="#" className="hover:text-accent transition-colors">API Docs</Link></li>
                            <li><Link href="#" className="hover:text-accent transition-colors">USDC Micropayments</Link></li>
                            <li><Link href="#" className="hover:text-accent transition-colors">Backtesting Logic</Link></li>
                            <li><Link href="#" className="hover:text-accent transition-colors">Guides & Tutorials</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">Community</h4>
                        <ul className="space-y-2 text-muted">
                            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">GitHub Repository</a></li>
                            <li><a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">Discord Server</a></li>
                            <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">Twitter Feed</a></li>
                            <li><Link href="#" className="hover:text-accent transition-colors">Vercel Console</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Lower Footer Bottom Bar */}
                <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-muted">
                    <div className="flex items-center gap-2">
                        <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
                        <span>Built for the Lepton Agents Hackathon.</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <span>© 2026 Metis. All Rights Reserved.</span>
                        <div className="flex gap-3">
                            <Link href="#" className="hover:text-accent">Privacy Policy</Link>
                            <span className="text-hairline">|</span>
                            <Link href="#" className="hover:text-accent">Terms of Use</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
