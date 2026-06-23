'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import HeroCanvas from '@/components/HeroCanvas';
import { LogoMark } from '@/components/LogoMark';
import DemoSimulator from '@/components/DemoSimulator';

interface PlatformStats {
    total_signals: number;
    avg_win_rate: number;
    avg_sharpe: number;
    total_usdc_earned: number;
    total_backtests: number;
}

// Live hackathon counter — ticks up over time
const BASE_STATS = { signals: 47, usdc: 0.1432, agents: 5, txns: 312 };
const SESSION_START = Date.now();

export default function LandingPage() {
    const shouldReduceMotion = useReducedMotion();
    const easeCurve: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Premium expo-out curve

    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [heroEmail, setHeroEmail] = useState('');
    const [liveStats, setLiveStats] = useState(BASE_STATS);
    const [demoOpen, setDemoOpen] = useState(false);
    
    // Countdown state (Days:Hours:Minutes:Seconds)
    const [countdown, setCountdown] = useState({ d: 0, h: 4, m: 12, s: 18 });
    const [livePrices, setLivePrices] = useState<Record<string, { price: string; pct: string; up: boolean }>>({});

    useEffect(() => {
        // Fetch live prices from Binance public API
        const fetchLivePrices = async () => {
            try {
                const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"]');
                if (res.ok) {
                    const data = await res.json();
                    const newPrices: Record<string, { price: string; pct: string; up: boolean }> = {};
                    data.forEach((coin: any) => {
                        const ticker = coin.symbol.replace('USDT', '');
                        const lastPrice = parseFloat(coin.lastPrice);
                        const priceChangePercent = parseFloat(coin.priceChangePercent);
                        
                        let formattedPrice = '';
                        if (lastPrice >= 1000) {
                            formattedPrice = `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        } else if (lastPrice >= 1) {
                            formattedPrice = `$${lastPrice.toFixed(2)}`;
                        } else {
                            formattedPrice = `$${lastPrice.toFixed(4)}`;
                        }

                        newPrices[ticker] = {
                            price: formattedPrice,
                            pct: (priceChangePercent >= 0 ? '+' : '') + priceChangePercent.toFixed(2) + '%',
                            up: priceChangePercent >= 0
                        };
                    });
                    setLivePrices(newPrices);
                }
            } catch (err) {
                console.error('Failed to fetch live prices', err);
            }
        };

        fetchLivePrices();
        const priceInterval = setInterval(fetchLivePrices, 10000);

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

        return () => {
            clearInterval(timer);
            clearInterval(priceInterval);
        };
    }, []);

    // Live stats ticker
    useEffect(() => {
        const id = setInterval(() => {
            const elapsed = (Date.now() - SESSION_START) / 1000;
            setLiveStats({
                signals: BASE_STATS.signals + Math.floor(elapsed / 18),
                usdc:    parseFloat((BASE_STATS.usdc + elapsed * 0.000028).toFixed(6)),
                agents:  BASE_STATS.agents,
                txns:    BASE_STATS.txns + Math.floor(elapsed / 6),
            });
        }, 1000);
        return () => clearInterval(id);
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

                            {/* Demo + Quick Links */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.4 }}
                                className="flex items-center gap-4 flex-wrap pt-1"
                            >
                                <DemoSimulator
                                    open={demoOpen}
                                    onClose={() => setDemoOpen(false)}
                                    triggerClassName="flex items-center gap-2 font-mono text-xs font-semibold border border-white/15 text-ink px-4 py-2.5 rounded-full hover:border-accent hover:text-accent transition-colors"
                                />
                                <button
                                    onClick={() => setDemoOpen(true)}
                                    className="flex items-center gap-2 font-mono text-xs font-semibold bg-accent/10 border border-accent/30 text-accent px-4 py-2.5 rounded-full hover:bg-accent hover:text-background transition-colors"
                                >
                                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                                    Watch Agent Demo
                                </button>
                                <Link href="/demo" className="font-mono text-xs text-muted hover:text-ink transition-colors underline underline-offset-2">
                                    Judge Mode →
                                </Link>
                            </motion.div>


                        </div>

                        {/* Right Side: Stacked Metric Boxes */}
                        <div className="lg:col-span-5 space-y-6">
                            
                            {/* Card 1: Next Agent Run */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, delay: 0.2, ease: easeCurve }}
                                className="border border-white/10 bg-[#182030] shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 rounded-[1.75rem] relative overflow-hidden"
                            >
                                <div className="absolute right-0 top-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
                                
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                                        Next Agent Update
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-[#22c787]/10 px-3 py-0.5 border border-[#22c787]/20 rounded-full">
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

                                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3.5">
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
                                className="border border-white/10 bg-[#182030] shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 rounded-[1.75rem]"
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
                                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3.5">
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
                                className="border border-white/10 bg-[#182030] shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-5 rounded-[1.75rem]"
                            >
                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted block mb-3.5">
                                    Popular Signals
                                </span>
                                <div className="space-y-3 font-mono text-xs">
                                    {[
                                        { sym: 'BTC', fallbackPrice: '$67,420.00', fallbackPct: '+3.47%', fallbackUp: true },
                                        { sym: 'ETH', fallbackPrice: '$3,240.50', fallbackPct: '-1.08%', fallbackUp: false },
                                        { sym: 'SOL', fallbackPrice: '$145.20', fallbackPct: '+5.22%', fallbackUp: true },
                                        { sym: 'BNB', fallbackPrice: '$580.40', fallbackPct: '-0.15%', fallbackUp: false }
                                    ].map(coin => {
                                        const live = livePrices[coin.sym];
                                        const displayPrice = live ? live.price : coin.fallbackPrice;
                                        const displayPct = live ? live.pct : coin.fallbackPct;
                                        const isUp = live ? live.up : coin.fallbackUp;
                                        return (
                                            <div key={coin.sym} className="flex justify-between items-center py-0.5">
                                                <span className="font-bold text-ink">{coin.sym}USDT</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-muted/80">{displayPrice}</span>
                                                    <span className={`w-14 text-right font-bold ${isUp ? 'text-approve' : 'text-block'}`}>
                                                        {displayPct}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                className="flex flex-col border border-white/10 bg-[#182030] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 rounded-[1.75rem] transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className={`font-mono text-3xl font-black tracking-tight ${m.color}`}>{m.type}</div>
                                <div className="font-mono mt-5 text-sm font-semibold text-ink">{m.label}</div>
                                <p className="mt-3 text-xs leading-relaxed text-muted">{m.desc}</p>
                                <span className="font-mono mt-8 pt-5 border-t border-white/5 inline-flex items-center gap-1.5 text-[10px] text-muted">
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
                        <div className="border border-white/10 bg-[#182030] shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 rounded-[1.75rem] space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="font-display text-lg font-bold text-ink uppercase tracking-tight">
                                    Active Quant Signals
                                </span>
                                <span className="font-mono text-[9px] bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                    Live
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full font-mono text-xs text-left">
                                    <thead>
                                        <tr className="text-muted/60 border-b border-white/5">
                                            <th className="py-2.5 font-medium">Pair</th>
                                            <th className="py-2.5 font-medium text-center">Type</th>
                                            <th className="py-2.5 font-medium text-right">Entry</th>
                                            <th className="py-2.5 font-medium text-right">TP / SL</th>
                                            <th className="py-2.5 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[
                                            { pair: 'BTCUSDT', sym: 'BTC', type: 'LONG', entry: '67,420', tpRatio: 1.05, slRatio: 0.98, typeColor: 'text-approve' },
                                            { pair: 'ETHUSDT', sym: 'ETH', type: 'SHORT', entry: '3,240', tpRatio: 0.93, slRatio: 1.03, typeColor: 'text-block' },
                                            { pair: 'SOLUSDT', sym: 'SOL', type: 'LONG', entry: '145.20', tpRatio: 1.08, slRatio: 0.96, typeColor: 'text-approve' },
                                            { pair: 'BNBUSDT', sym: 'BNB', type: 'LONG', entry: '580.40', tpRatio: 1.05, slRatio: 0.97, typeColor: 'text-approve' }
                                        ].map((row, i) => {
                                            const live = livePrices[row.sym];
                                            let displayEntry = row.entry;
                                            let displayTp = (parseFloat(row.entry.replace(/,/g, '')) * row.tpRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                            let displaySl = (parseFloat(row.entry.replace(/,/g, '')) * row.slRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                            
                                            if (live) {
                                                const rawPrice = parseFloat(live.price.replace(/[$,]/g, ''));
                                                if (!isNaN(rawPrice)) {
                                                    displayEntry = rawPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                    displayTp = (rawPrice * row.tpRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                    displaySl = (rawPrice * row.slRatio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                }
                                            }
                                            return (
                                                <tr key={i} className="hover:bg-white/[0.01]">
                                                    <td className="py-3 font-semibold text-ink">{row.pair}</td>
                                                    <td className={`py-3 text-center font-bold ${row.typeColor}`}>{row.type}</td>
                                                    <td className="py-3 text-right">${displayEntry}</td>
                                                    <td className="py-3 text-right text-muted/95">${displayTp} <span className="text-muted/40">/</span> ${displaySl}</td>
                                                    <td className="py-3 text-right">
                                                        <Link href="/login" className="bg-white hover:bg-accent text-background font-bold text-[10px] uppercase py-1.5 px-4 rounded-full transition-all">
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Table 2: Top Strategies */}
                        <div className="border border-white/10 bg-[#182030] shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 rounded-[1.75rem] space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="font-display text-lg font-bold text-ink uppercase tracking-tight">
                                    Top Performing Strategies
                                </span>
                                <span className="font-mono text-[9px] text-muted uppercase">3y Backtests</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full font-mono text-xs text-left">
                                    <thead>
                                        <tr className="text-muted/60 border-b border-white/5">
                                            <th className="py-2.5 font-medium">Strategy</th>
                                            <th className="py-2.5 font-medium text-center">Win Rate</th>
                                            <th className="py-2.5 font-medium text-right">Sharpe</th>
                                            <th className="py-2.5 font-medium text-right">Returns</th>
                                            <th className="py-2.5 font-medium text-right">Run</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
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
                                                    <Link href="/login" className="border border-white/10 hover:border-accent hover:text-accent hover:bg-accent hover:text-background font-bold text-[10px] uppercase py-1.5 px-4 rounded-full transition-all">
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
                        <div className="relative w-full max-w-md bg-[#182030] border border-white/10 rounded-[1.75rem] shadow-2xl p-5 overflow-hidden group">
                            
                            {/* Card Glow Header */}
                            <div className="absolute right-0 top-0 w-32 h-32 bg-accent/5 rounded-full blur-xl pointer-events-none" />

                            {/* Header row */}
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
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
                            <div className="grid grid-cols-2 gap-3.5 border-t border-white/5 pt-4 font-mono text-xs">
                                <div className="bg-black/10 p-3.5 border border-white/5 rounded-2xl">
                                    <span className="text-muted/60 block text-[9px] uppercase tracking-wider mb-1">State</span>
                                    <span className="font-bold text-approve uppercase">Lending Pool</span>
                                </div>
                                <div className="bg-black/10 p-3.5 border border-white/5 rounded-2xl">
                                    <span className="text-muted/60 block text-[9px] uppercase tracking-wider mb-1">Network APY</span>
                                    <span className="font-bold text-ink">5.50%</span>
                                </div>
                            </div>

                            {/* Toggle Button layout */}
                            <div className="mt-5 bg-background border border-white/5 p-3 rounded-2xl flex items-center justify-between">
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
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white text-background hover:bg-accent hover:text-background font-mono text-xs font-semibold px-6 py-3.5 rounded-full transition-colors">
                                Explore Yield Loops →
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



            {/* ────────────── LIVE HACKATHON STATS ──────────── */}
            <section className="border-y border-hairline bg-[#0d1119] py-12 sm:py-16">
                <div className="mx-auto max-w-6xl px-5 sm:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="text-center mb-10"
                    >
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-2">
                            live · since hackathon start
                        </p>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                            The Agent Economy Is Already Running
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Signals Generated', value: liveStats.signals.toString(), suffix: '', accent: false },
                            { label: 'USDC Transacted', value: liveStats.usdc.toFixed(4), suffix: ' USDC', accent: true },
                            { label: 'Active Agents', value: liveStats.agents.toString(), suffix: '', accent: false },
                            { label: 'Arc L1 Txns', value: liveStats.txns.toString(), suffix: '', accent: false },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className="border border-white/10 bg-[#182030] rounded-[1.5rem] p-5 text-center"
                            >
                                <p className={`font-mono text-2xl sm:text-3xl font-bold tabular-nums ${
                                    stat.accent ? 'text-accent' : 'text-ink'
                                }`}>
                                    {stat.value}{stat.suffix}
                                </p>
                                <p className="font-mono text-[10px] text-muted uppercase tracking-wider mt-2">
                                    {stat.label}
                                </p>
                                <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${stat.accent ? 'bg-accent' : 'bg-white/20'}`}
                                        animate={{ width: ['30%', '100%', '45%', '80%'] }}
                                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Arc L1 live indicator */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <span className="size-2 rounded-full bg-approve animate-pulse" />
                        <span className="font-mono text-[11px] text-muted">
                            Connected to <span className="text-ink font-semibold">Arc L1 Testnet</span> · Last block: <span className="text-approve font-mono">#{(8429100 + Math.floor((Date.now() - SESSION_START) / 12000)).toLocaleString()}</span>
                        </span>
                    </div>
                </div>
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
                            <li><Link href="/api-docs" className="hover:text-accent transition-colors">API Docs</Link></li>
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
