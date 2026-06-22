'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import DemoSimulator from '@/components/DemoSimulator';

interface PlatformStats {
    total_signals: number;
    avg_win_rate: number;
    avg_sharpe: number;
    total_usdc_earned: number;
    total_backtests: number;
}

// Live stats tick configuration
const BASE_STATS = { signals: 47, usdc: 0.1432, agents: 5, txns: 312, scans: 18076 };
const SESSION_START = Date.now();

export default function LandingPage() {
    const shouldReduceMotion = useReducedMotion();
    const easeCurve: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Premium bezier expo-out curve

    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [liveStats, setLiveStats] = useState(BASE_STATS);
    const [demoOpen, setDemoOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Countdown state (Days:Hours:Minutes:Seconds)
    const [countdown, setCountdown] = useState({ d: 0, h: 4, m: 12, s: 18 });
    const [livePrices, setLivePrices] = useState<Record<string, { price: string; pct: string; up: boolean }>>({});

    // Demo search address input on the landing page visualized section
    const [visualizedSearch, setVisualizedSearch] = useState('');
    const [visualizedRiskResult, setVisualizedRiskResult] = useState<any | null>(null);
    const [isScanningVisualized, setIsScanningVisualized] = useState(false);

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
                scans:   BASE_STATS.scans + Math.floor(elapsed / 4)
            });
        }, 1000);
        return () => clearInterval(id);
    }, []);

    const formatNumber = (num: number) => {
        return num < 10 ? `0${num}` : num.toString();
    };

    const handleVisualizedSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!visualizedSearch) return;
        setIsScanningVisualized(true);
        setVisualizedRiskResult(null);

        setTimeout(() => {
            setIsScanningVisualized(false);
            setVisualizedRiskResult({
                score: Math.floor(Math.random() * 40) + 50, // 50 - 90
                riskFactors: [
                    'Smart Contract containing self-destruct function pattern.',
                    'High percentage of tokens held by top 3 whale wallets (centralized risk).',
                    'Multiple transaction re-entrancy warning indicators found.'
                ]
            });
        }, 1800);
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
        <div className="min-h-screen bg-[#06060c] text-[#ECEEF4] font-sans selection:bg-[#7c3aed] selection:text-white overflow-hidden">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#7c3aed]/10 to-transparent blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-[#7c3aed]/5 to-transparent blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#7c3aed]/8 to-transparent blur-[120px] pointer-events-none" />

            {/* ────────────────── HEADER ─────────────────── */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#06060c]/70 backdrop-blur-md border-b border-white/[0.04]">
                <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                    
                    {/* Logo & Branding */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="size-8 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center shadow-lg shadow-[#7c3aed]/20 border border-white/10 group-hover:scale-105 transition-transform duration-300">
                            <svg className="size-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                            </svg>
                        </div>
                        <span className="font-display text-lg font-bold tracking-tight text-white uppercase bg-clip-text">
                            Risor <span className="text-xs text-purple-400 font-mono tracking-widest lowercase">by metis</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation links */}
                    <nav className="hidden md:flex items-center gap-8 font-mono text-xs text-[#8b93a5]">
                        <Link href="/" className="text-white hover:text-purple-400 transition-colors">Home</Link>
                        <a href="#features" className="hover:text-white transition-colors">Technology</a>
                        <a href="#capabilities" className="hover:text-white transition-colors font-medium">Features</a>
                        <Link href="/api-docs" className="hover:text-white transition-colors">Developers</Link>
                    </nav>

                    {/* Header Action buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login" className="font-mono text-xs text-[#8b93a5] hover:text-white border border-white/[0.06] hover:border-white/20 bg-[#12121e]/40 px-4 py-2.5 rounded-full transition-colors">
                            Link Wallet
                        </Link>
                        <Link href="/signup" className="font-mono text-xs font-semibold bg-white text-black hover:bg-[#7c3aed] hover:text-white px-5 py-2.5 rounded-full transition-all hover:scale-102 active:scale-98 shadow-md">
                            Sign Up
                        </Link>
                    </div>

                    {/* Mobile menu trigger */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-white hover:text-purple-400 transition-colors"
                        aria-label="Toggle mobile menu"
                    >
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Drawer Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden border-t border-white/[0.04] bg-[#06060c] overflow-hidden"
                        >
                            <div className="px-6 py-6 space-y-4 flex flex-col font-mono text-xs">
                                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-white">Home</Link>
                                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[#8b93a5] hover:text-white">Technology</a>
                                <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="text-[#8b93a5] hover:text-white">Features</a>
                                <Link href="/api-docs" onClick={() => setMobileMenuOpen(false)} className="text-[#8b93a5] hover:text-white">Developers</Link>
                                
                                <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-3">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-[#8b93a5] border border-white/[0.06] bg-[#12121e]/40 py-3 rounded-full">
                                        Link Wallet
                                    </Link>
                                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="text-center bg-white text-black font-semibold py-3 rounded-full">
                                        Sign Up
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ────────────────── HERO SECTION ─────────────────── */}
            <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 border-b border-white/[0.04]">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        
                        {/* Left Column: Copywriting & CTAs */}
                        <div className="lg:col-span-7 space-y-8 text-left">
                            <div className="inline-flex items-center gap-2 bg-[#7c3aed]/10 px-3.5 py-1.5 border border-[#7c3aed]/25 rounded-full">
                                <span className="size-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                                <span className="font-mono text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                                    Secure Wallet Shield active
                                </span>
                            </div>

                            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-white">
                                Scan Your Wallet,<br />
                                <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-white bg-clip-text text-transparent">Detect Risk Instantly.</span>
                            </h1>

                            <p className="max-w-xl text-sm sm:text-base text-[#8b93a5] leading-relaxed">
                                A premium dynamic platform to analyze and monitor risk instantly for Web3 users and companies. Verify transaction states, assess smart contract traps, and evaluate safety before executing.
                            </p>

                            {/* Button CTA Action Row */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                                <Link 
                                    href="/signup" 
                                    className="font-mono text-xs font-semibold bg-white text-black hover:bg-[#7c3aed] hover:text-white px-8 py-4 rounded-full transition-all text-center hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Get started
                                </Link>
                                
                                <Link 
                                    href="/login" 
                                    className="font-mono text-xs font-semibold border border-white/[0.08] bg-[#12121e]/30 hover:bg-[#18182b]/60 text-white px-8 py-4 rounded-full transition-all text-center hover:border-purple-500/20 active:scale-[0.98]"
                                >
                                    View dashboard
                                </Link>
                            </div>

                            {/* Wallet Integrations */}
                            <div className="space-y-3.5 pt-4">
                                <span className="font-mono text-[10px] text-[#8b93a5]/50 uppercase tracking-widest block">
                                    Supported Auth Providers
                                </span>
                                <div className="flex flex-wrap items-center gap-3">
                                    {[
                                        { name: 'Google', url: '/login', path: 'M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.133 1 1 6.133 1 12.24s5.133 11.24 11.24 11.24c6.378 0 10.623-4.484 10.623-10.82 0-.73-.08-1.28-.175-1.832H12.24z' },
                                        { name: 'Apple', url: '/login', path: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z' },
                                        { name: 'Telegram', url: '/login', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z' }
                                    ].map(p => (
                                        <Link
                                            key={p.name}
                                            href={p.url}
                                            title={p.name}
                                            className="size-10 rounded-full border border-white/[0.06] bg-[#12121e]/50 flex items-center justify-center text-[#8b93a5] hover:border-purple-500 hover:text-purple-400 hover:bg-[#18182b] transition-all hover:scale-105 active:scale-95 shadow-inner"
                                        >
                                            <svg className="size-4.5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d={p.path} />
                                            </svg>
                                        </Link>
                                    ))}
                                    
                                    {/* EVM Wallet button */}
                                    <Link
                                        href="/login"
                                        title="EVM Wallet"
                                        className="size-10 rounded-full border border-white/[0.06] bg-[#12121e]/50 flex items-center justify-center text-[#8b93a5] hover:border-purple-500 hover:text-purple-400 hover:bg-[#18182b] transition-all hover:scale-105 active:scale-95 shadow-inner"
                                    >
                                        <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                                        </svg>
                                    </Link>
                                    
                                    {/* Faucet Link & Demo trigger */}
                                    <button
                                        onClick={() => setDemoOpen(true)}
                                        className="flex items-center gap-1.5 font-mono text-[10px] font-bold border border-[#7c3aed]/30 bg-[#7c3aed]/5 text-purple-300 px-3.5 py-2 rounded-full hover:bg-[#7c3aed] hover:text-white transition-colors"
                                    >
                                        <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
                                        Simulate Flow
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: 3D Render Asset */}
                        <div className="lg:col-span-5 flex justify-center relative select-none">
                            
                            {/* Neon glow backdrop */}
                            <div className="absolute w-72 h-72 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            
                            {/* 3D Cylinder Image */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 1, ease: easeCurve }}
                                className="relative w-80 sm:w-96 aspect-square max-w-full flex items-center justify-center filter drop-shadow-[0_15px_40px_rgba(124,58,237,0.15)]"
                            >
                                <img
                                    src="/hero_3d_cylinder.png"
                                    alt="Risor 3D Cylindrical Shield Asset"
                                    className="object-contain w-full h-full max-h-[420px] select-none pointer-events-none animate-float"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ────────────────── POWERED BY ADVANCED AI INTELLIGENCE ─────────────────── */}
            <section id="features" className="py-24 border-b border-white/[0.04] bg-[#090912]/40 relative">
                <div className="absolute inset-0 bg-grid-bg opacity-[0.15] pointer-events-none" />
                <div className="mx-auto max-w-7xl px-6 relative z-10">
                    
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-[0.25em] block">
                            Platform Security Core
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Powered by Advanced AI Intelligence
                        </h2>
                        <p className="text-sm text-[#8b93a5] leading-relaxed">
                            Learn more about our advanced security features and how they keep your wallet safe.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                num: '01',
                                title: 'Monitor',
                                desc: 'Aggregate transaction history, balance trends, and token allocations across multiple chains.'
                            },
                            {
                                num: '02',
                                title: 'Analysis',
                                desc: 'Automatically run threat modeling on smart contracts and protocols you interact with.'
                            },
                            {
                                num: '03',
                                title: 'Prevent',
                                desc: 'Get alert notifications for malicious addresses, honeypots, and sudden liquidity drains.'
                            },
                            {
                                num: '04',
                                title: 'Real-Time Analytics',
                                desc: 'Track gas spikes, block times, and contract interactions in real-time.'
                            },
                            {
                                num: '05',
                                title: 'Token & Asset Mapping',
                                desc: 'Map token permissions and approvals to identify hidden risk vectors.'
                            },
                            {
                                num: '06',
                                title: 'Risk Statistics',
                                desc: 'Get a comprehensive risk score calculated based on your historical behavior.'
                            }
                        ].map((feat) => (
                            <div 
                                key={feat.num}
                                className="group relative border border-white/[0.04] bg-[#12121e]/30 hover:bg-[#18182b]/50 p-8 rounded-[1.75rem] transition-all duration-300 hover:scale-[1.01] hover:border-purple-500/20"
                            >
                                <div className="absolute top-6 right-8 font-mono text-[11px] text-purple-500/50 group-hover:text-purple-400 font-semibold">{feat.num}</div>
                                <h3 className="font-display font-bold text-lg text-white mb-3 group-hover:text-purple-300 transition-colors">{feat.title}</h3>
                                <p className="text-xs text-[#8b93a5] leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ────────────────── WHAT IT CAN DO ─────────────────── */}
            <section id="capabilities" className="py-24 border-b border-white/[0.04]">
                <div className="mx-auto max-w-7xl px-6">
                    
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-[0.25em] block">
                            Risk Prevention Suite
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            What It Can Do
                        </h2>
                        <p className="text-sm text-[#8b93a5] leading-relaxed">
                            Explore the features and tools we offer to protect your wallet and assets.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                        
                        {/* Left Column: Transaction Risk & Address Analysis */}
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            
                            {/* Card 1: Transaction Risk Detection */}
                            <div className="border border-white/[0.04] bg-[#12121e]/30 p-8 rounded-[1.75rem] flex flex-col sm:flex-row items-center justify-between gap-8 group hover:border-purple-500/10 transition-colors">
                                <div className="space-y-4 max-w-md">
                                    <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Pre-tx scanner</span>
                                    <h3 className="font-display font-bold text-xl text-white">Transaction Risk Detection</h3>
                                    <p className="text-xs text-[#8b93a5] leading-relaxed">
                                        Scan transactions before they are submitted to the network. Avoid drainers, slippage traps, and honeypot forks.
                                    </p>
                                </div>
                                <div className="relative size-32 shrink-0 flex items-center justify-center">
                                    
                                    {/* Radar circles */}
                                    <div className="absolute inset-0 border border-purple-500/10 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
                                    <div className="absolute w-[80%] h-[80%] border border-purple-500/20 rounded-full" />
                                    <div className="absolute w-[50%] h-[50%] border border-purple-500/35 rounded-full" />
                                    <div className="absolute size-2 bg-purple-500 rounded-full shadow-[0_0_10px_#7c3aed]" />
                                    
                                    {/* Sweeping bar SVG */}
                                    <svg className="absolute inset-0 size-full text-purple-500/20 animate-spin" style={{ animationDuration: '6s' }} viewBox="0 0 100 100" fill="none">
                                        <path d="M50 50L100 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 2: Deep Address Analysis */}
                            <div className="border border-white/[0.04] bg-[#12121e]/30 p-8 rounded-[1.75rem] flex flex-col sm:flex-row items-center justify-between gap-8 group hover:border-purple-500/10 transition-colors">
                                <div className="space-y-4 max-w-md">
                                    <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Entity Auditor</span>
                                    <h3 className="font-display font-bold text-xl text-white">Deep Address Analysis</h3>
                                    <p className="text-xs text-[#8b93a5] leading-relaxed">
                                        Evaluate the security profile of any destination address. Detect contract deployment history, code verified state, and previous risk alerts.
                                    </p>
                                </div>
                                <div className="size-32 bg-[#1b1b2f]/30 border border-white/[0.04] rounded-2xl flex items-center justify-center shrink-0">
                                    <svg className="size-16 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18a2.25 2.25 0 0 1-2.25 2.25h-6A2.25 2.25 0 0 1 5.25 18v-8.25A2.25 2.25 0 0 1 7.5 7.5h3m3.75 3.75 3 3m0 0-3 3m3-3h-9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Smart Contract Analyzer & Portfolio Safety Score */}
                        <div className="lg:col-span-5 flex flex-col gap-8">
                            
                            {/* Card 3: Smart Contract Analyzer */}
                            <div className="flex-1 border border-white/[0.04] bg-[#12121e]/30 p-8 rounded-[1.75rem] flex flex-col justify-between gap-6 group hover:border-purple-500/10 transition-colors">
                                <div className="space-y-4">
                                    <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Bytecode compiler</span>
                                    <h3 className="font-display font-bold text-xl text-white">Smart Contract Analyzer</h3>
                                    <p className="text-xs text-[#8b93a5] leading-relaxed">
                                        Instantly check contract source code for vulnerability patterns. Detect re-entrancy vectors, uninitialized logic, and mint permission leaks.
                                    </p>
                                </div>
                                <div className="h-28 bg-[#18182b]/30 border border-white/[0.04] rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
                                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7c3aed]/80 to-transparent animate-bounce" style={{ animationDuration: '3s' }} />
                                    <svg className="size-12 text-[#8b93a5]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 4: Portfolio Safety Score */}
                            <div className="flex-1 border border-white/[0.04] bg-[#12121e]/30 p-8 rounded-[1.75rem] flex flex-col justify-between gap-6 group hover:border-purple-500/10 transition-colors">
                                <div className="space-y-4">
                                    <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Portfolio rating</span>
                                    <h3 className="font-display font-bold text-xl text-white">Portfolio Safety Score</h3>
                                    <p className="text-xs text-[#8b93a5] leading-relaxed">
                                        Get an overall security rating for your entire Web3 portfolio. We compile wallet risk levels and score them based on protocol exposures.
                                    </p>
                                </div>
                                <div className="h-28 bg-[#18182b]/30 border border-white/[0.04] rounded-xl flex items-center justify-center p-4">
                                    <svg className="size-12 text-[#22c787]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ────────────────── YOUR WALLET'S SAFETY, VISUALIZED ─────────────────── */}
            <section className="py-24 border-b border-white/[0.04] bg-[#090912]/40 relative">
                <div className="absolute inset-0 bg-grid-bg opacity-[0.1] pointer-events-none" />
                <div className="mx-auto max-w-7xl px-6 relative z-10">
                    
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        
                        {/* Left Column: Context Copy */}
                        <div className="lg:col-span-5 space-y-6 text-left">
                            <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-[0.25em] block">
                                Interactive Sandbox
                            </span>
                            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                                Your Wallet&apos;s Safety, Visualized
                            </h2>
                            <p className="text-sm text-[#8b93a5] leading-relaxed">
                                A modern dashboard designed to present your risk factors clearly and intuitively. Enter any wallet address below to simulate a real-time risk diagnostic scan.
                            </p>
                            
                            <form onSubmit={handleVisualizedSearch} className="relative flex items-center bg-[#12121e]/80 border border-white/[0.06] focus-within:border-purple-500/50 rounded-full p-1.5 transition-colors">
                                <input
                                    type="text"
                                    value={visualizedSearch}
                                    onChange={(e) => setVisualizedSearch(e.target.value)}
                                    placeholder="Enter wallet address (0x...)"
                                    className="bg-transparent text-white placeholder:text-[#8b93a5]/40 pl-5 pr-32 py-2.5 w-full text-xs font-mono focus:outline-none rounded-full"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isScanningVisualized}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#7c3aed] text-white hover:bg-[#8b5cf6] font-mono text-xs font-semibold px-5 rounded-full transition-all disabled:opacity-40"
                                >
                                    {isScanningVisualized ? 'Scanning...' : 'Scan Now'}
                                </button>
                            </form>

                            <div className="pt-2">
                                <Link 
                                    href="/login" 
                                    className="font-mono text-xs text-purple-400 hover:text-white transition-colors hover:underline underline-offset-4"
                                >
                                    Launch Full Dashboard →
                                </Link>
                            </div>
                        </div>

                        {/* Right Column: Visualized Dashboard Preview */}
                        <div className="lg:col-span-7">
                            <div className="border border-white/[0.06] bg-[#0c0c14] shadow-2xl p-6 rounded-[2rem] space-y-6 text-left relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                                
                                <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#8b93a5]">Risor Scanner v1.0</span>
                                    </div>
                                    <span className="font-mono text-[9px] text-[#8b93a5]/60 uppercase">Epoch #726</span>
                                </div>

                                <div className="grid md:grid-cols-12 gap-6">
                                    
                                    {/* Left Sub-col: Safety Score Dial */}
                                    <div className="md:col-span-5 flex flex-col items-center justify-center border border-white/[0.04] bg-[#12121e]/30 p-5 rounded-2xl text-center">
                                        <span className="font-mono text-[9px] text-[#8b93a5] uppercase mb-4 block">Safety Score</span>
                                        <div className="relative size-32 flex items-center justify-center">
                                            
                                            {/* Circular Dial SVG */}
                                            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="none" />
                                                <circle 
                                                    cx="50" 
                                                    cy="50" 
                                                    r="40" 
                                                    stroke="#7c3aed" 
                                                    strokeWidth="8" 
                                                    fill="none" 
                                                    strokeDasharray="251.2" 
                                                    strokeDashoffset={visualizedRiskResult ? 251.2 - (251.2 * visualizedRiskResult.score) / 100 : 251.2 - (251.2 * 74) / 100}
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            
                                            <div className="flex flex-col items-center justify-center font-mono">
                                                <span className="text-3xl font-bold text-white tabular-nums">
                                                    {visualizedRiskResult ? visualizedRiskResult.score : 74}%
                                                </span>
                                                <span className="text-[8px] text-purple-400 font-bold uppercase mt-0.5">Secure</span>
                                            </div>
                                        </div>
                                        <p className="font-mono text-[8px] text-[#8b93a5] mt-4 leading-relaxed max-w-[150px]">
                                            {visualizedRiskResult ? 'Target scan metrics resolved.' : 'Your wallet is moderately secure. Fix outstanding alerts.'}
                                        </p>
                                    </div>

                                    {/* Right Sub-col: Risk Factors List */}
                                    <div className="md:col-span-7 space-y-4">
                                        <div>
                                            <span className="font-mono text-[9px] text-[#8b93a5] uppercase block mb-1">Detected Risk Factors</span>
                                            <span className="font-display text-sm font-bold text-white">Active Threat Vectors</span>
                                        </div>

                                        <div className="space-y-2.5 font-mono text-[10px] text-[#8b93a5]">
                                            {isScanningVisualized ? (
                                                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                                                    <div className="size-5 animate-spin border-b border-purple-500 rounded-full" />
                                                    <span className="text-[10px] text-purple-400">Compiling bytecode patterns...</span>
                                                </div>
                                            ) : visualizedRiskResult ? (
                                                visualizedRiskResult.riskFactors.map((fact: string, idx: number) => (
                                                    <div key={idx} className="flex gap-2 p-2.5 border border-white/[0.04] bg-white/[0.01] rounded-lg">
                                                        <span className="text-red-400 font-bold">⚠️</span>
                                                        <span>{fact}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <>
                                                    <div className="flex gap-2 p-2.5 border border-white/[0.04] bg-white/[0.01] rounded-lg">
                                                        <span className="text-amber-400 font-bold">⚠️</span>
                                                        <span>Contract containing approval validation anomalies.</span>
                                                    </div>
                                                    <div className="flex gap-2 p-2.5 border border-white/[0.04] bg-white/[0.01] rounded-lg">
                                                        <span className="text-red-400 font-bold">⚠️</span>
                                                        <span>Large wallet balance centralized in a single asset pool.</span>
                                                    </div>
                                                    <div className="flex gap-2 p-2.5 border border-white/[0.04] bg-white/[0.01] rounded-lg">
                                                        <span className="text-purple-400 font-bold">ℹ️</span>
                                                        <span>Last wallet state scan executed 2 minutes ago.</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ────────────────── STATISTICS BAR: SCANNING WALLETS 24/7 ─────────────────── */}
            <section className="py-24 border-b border-white/[0.04]">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-[0.25em] block">
                            Global Coverage Stats
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Scanning Wallets Worldwide — 24/7
                        </h2>
                        <p className="text-sm text-[#8b93a5] leading-relaxed">
                            Join thousands of users who trust Risor to secure their assets.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto border border-white/[0.04] bg-[#12121e]/30 shadow-2xl p-10 rounded-[2rem] text-center mb-16 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
                        <div className="absolute size-40 bg-[#7c3aed]/5 rounded-full blur-3xl pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        
                        <div className="font-display text-5xl sm:text-6xl font-black text-white tracking-wider tabular-nums">
                            {liveStats.scans.toLocaleString()}
                        </div>
                        <p className="font-mono text-[10px] text-purple-400 uppercase tracking-widest mt-3 font-semibold">
                            total active scans today
                        </p>
                    </div>

                    {/* Three Sub-Metrics Below */}
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto font-mono text-xs">
                        {[
                            {
                                icon: (
                                    <svg className="size-4.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0 1 12 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
                                    </svg>
                                ),
                                title: '5+ Chains',
                                desc: 'Ethereum, Arbitrum, BSC, Polygon & Solana'
                            },
                            {
                                icon: (
                                    <svg className="size-4.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                    </svg>
                                ),
                                title: '25k+ Threat Indicators',
                                desc: 'Detected malwares, drainers, phishing & honeypots'
                            },
                            {
                                icon: (
                                    <svg className="size-4.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                    </svg>
                                ),
                                title: '99.9% Uptime',
                                desc: 'Guaranteed real-time threat intelligence feeds'
                            }
                        ].map((stat, i) => (
                            <div key={i} className="flex gap-4 p-5 border border-white/[0.04] bg-[#12121e]/20 rounded-2xl items-start">
                                <div className="p-3 bg-[#1b1b2f] border border-white/[0.04] rounded-xl shrink-0">
                                    {stat.icon}
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <h4 className="font-display text-sm font-bold text-white">{stat.title}</h4>
                                    <p className="text-[10px] text-[#8b93a5] leading-relaxed">{stat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ────────────────── WHO IT'S FOR ─────────────────── */}
            <section className="py-24 border-b border-white/[0.04] bg-[#090912]/40 relative">
                <div className="absolute inset-0 bg-grid-bg opacity-[0.1] pointer-events-none" />
                <div className="mx-auto max-w-7xl px-6 relative z-10">
                    
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-[0.25em] block">
                            Target Audience
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Who It&apos;s For
                        </h2>
                        <p className="text-sm text-[#8b93a5] leading-relaxed">
                            Risor is built for everyone from retail crypto users to large organizations.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[
                            {
                                title: 'Cryptoinvestors',
                                desc: 'Monitor your personal wallets, staking positions, and DeFi interactions.',
                                icon: (
                                    <svg className="size-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Alpha/Web3 Teams',
                                desc: 'Secure treasury multisigs, project wallets, and employee credentials.',
                                icon: (
                                    <svg className="size-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m0 0a5.941 5.941 0 0 1-.54-2.228 3 3 0 0 0-4.682-2.72m.94 3.198.002.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 6 21c2.17 0 4.207-.576 5.963-1.584A6.062 6.062 0 0 1 12 18.719m0 0a5.941 5.941 0 0 1-.54-2.228M12 18.72a9.094 9.094 0 0 0 3.741-.479M12 18.72c-2.17 0-4.207-.576-5.963-1.584A9.062 9.062 0 0 1 12 16.5m0-12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7.72 2.25a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0ZM4.5 6.75a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Security Analysts',
                                desc: 'Run ad-hoc scans on contracts and protocol deployments.',
                                icon: (
                                    <svg className="size-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                    </svg>
                                )
                            }
                        ].map((t, idx) => (
                            <div 
                                key={idx}
                                className="border border-white/[0.04] bg-[#12121e]/30 hover:border-purple-500/10 p-8 rounded-[1.75rem] flex flex-col justify-between h-56 transition-colors"
                            >
                                <div className="p-3 bg-[#1b1b2f] border border-white/[0.04] rounded-xl self-start">
                                    {t.icon}
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-base text-white mb-2">{t.title}</h3>
                                    <p className="text-xs text-[#8b93a5] leading-relaxed">{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ────────────────── CALL TO ACTION ─────────────────── */}
            <section className="py-24 border-b border-white/[0.04] relative">
                <div className="absolute w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-[#7c3aed]/5 to-transparent blur-[120px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="mx-auto max-w-7xl px-6 relative z-10 text-center">
                    
                    <div className="max-w-3xl mx-auto space-y-8">
                        <h2 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight">
                            Protect Your Wallet — Before It&apos;s Too Late.
                        </h2>
                        
                        <p className="text-sm sm:text-base text-[#8b93a5] leading-relaxed max-w-xl mx-auto">
                            Start monitoring your wallets and assets with Risor&apos;s premium security suite today. Take advantage of low gas micro-settlements on the Arc L1 Network.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                            <Link 
                                href="/signup" 
                                className="w-full sm:w-auto font-mono text-xs font-semibold bg-white text-black hover:bg-[#7c3aed] hover:text-white px-8 py-4 rounded-full transition-all hover:scale-102 active:scale-98"
                            >
                                Get started
                            </Link>
                            
                            <button 
                                onClick={() => setDemoOpen(true)}
                                className="w-full sm:w-auto font-mono text-xs font-semibold border border-white/[0.08] bg-[#12121e]/30 hover:bg-[#18182b]/60 text-white px-8 py-4 rounded-full transition-all active:scale-0.98"
                            >
                                Simulate Agent
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ────────────────── FOOTER ─────────────────── */}
            <footer className="bg-[#040408]">
                <div className="mx-auto max-w-7xl px-6 py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 border-b border-white/[0.04] text-left">
                    
                    {/* Brand column */}
                    <div className="space-y-4 font-mono text-xs text-[#8b93a5]">
                        <div className="flex items-center gap-2.5 text-white">
                            <div className="size-6 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center">
                                <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                </svg>
                            </div>
                            <span className="font-display text-sm font-bold uppercase tracking-tight text-white">Risor</span>
                        </div>
                        <p className="text-[10px] leading-relaxed max-w-xs">
                            A premium dynamic platform to analyze and monitor risk instantly for Web3 users and companies. Underpinned by Google Gemini 1.5 Pro and settled via USDC on Arc L1.
                        </p>
                    </div>

                    {/* Columns */}
                    {[
                        {
                            title: 'Product',
                            links: [
                                { label: 'Features', url: '#features' },
                                { label: 'Capabilities', url: '#capabilities' },
                                { label: 'API Docs', url: '/api-docs' },
                                { label: 'Demo Sandbox', url: '/demo' }
                            ]
                        },
                        {
                            title: 'Legal',
                            links: [
                                { label: 'Privacy Policy', url: '#' },
                                { label: 'Terms of Use', url: '#' },
                                { label: 'Disclaimer', url: '#' },
                                { label: 'Audit Report', url: '#' }
                            ]
                        },
                        {
                            title: 'Developers',
                            links: [
                                { label: 'GitHub Repos', url: 'https://github.com' },
                                { label: 'Arc Network Scan', url: 'https://testnet.arcscan.app' },
                                { label: 'Circle Faucet', url: 'https://faucet.circle.com' },
                                { label: 'Vercel Console', url: '#' }
                            ]
                        }
                    ].map((col, idx) => (
                        <div key={idx} className="space-y-4 font-mono text-xs">
                            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">{col.title}</h4>
                            <ul className="space-y-2.5 text-[#8b93a5]">
                                {col.links.map((lnk, lIdx) => (
                                    <li key={lIdx}>
                                        <Link href={lnk.url} className="hover:text-purple-400 transition-colors">
                                            {lnk.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom credits */}
                <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-[#8b93a5]">
                    <div>
                        <span>© 2026 Risor. All Rights Reserved. Built for Lepton Agents Hackathon.</span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:text-purple-400">Privacy</Link>
                        <span className="text-white/5">|</span>
                        <Link href="#" className="hover:text-purple-400">Terms</Link>
                    </div>
                </div>
            </footer>

            {/* Simulated flow drawer overlay */}
            <DemoSimulator open={demoOpen} onClose={() => setDemoOpen(false)} />
        </div>
    );
}
