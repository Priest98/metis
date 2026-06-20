'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import HeroCanvas from '@/components/HeroCanvas';
import { LogoMark } from '@/components/LogoMark';

// ── Live stats strip ──────────────────────────────────────────────────────────

interface PlatformStats {
    total_signals: number;
    avg_win_rate: number;
    avg_sharpe: number;
    total_usdc_earned: number;
    total_backtests: number;
}

function LiveStatsStrip() {
    const shouldReduceMotion = useReducedMotion();
    const [stats, setStats] = useState<PlatformStats | null>(null);

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        fetch(`${apiUrl}/stats/`)
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setStats(d))
            .catch(() => {});
    }, []);

    const METRICS = [
        {
            label: 'signals generated',
            value: stats ? stats.total_signals.toLocaleString() : '—',
            note: 'on-chain, verified',
        },
        {
            label: 'avg win rate',
            value: stats ? `${stats.avg_win_rate}%` : '—',
            note: 'across all backtests',
        },
        {
            label: 'avg sharpe ratio',
            value: stats ? stats.avg_sharpe.toFixed(2) : '—',
            note: 'risk-adjusted return',
        },
        {
            label: 'usdc settled',
            value: stats ? `$${stats.total_usdc_earned.toFixed(3)}` : '—',
            note: 'via x402 · Arc L1',
        },
    ];

    return (
        <section className="border-b border-t border-hairline bg-surface">
            <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7 }}
                className="mx-auto max-w-6xl px-5 py-14 sm:px-8"
            >
                <p className="eyebrow mb-8">live platform metrics</p>
                <div className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
                    {METRICS.map((m, i) => (
                        <motion.div
                            key={m.label}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-background p-6 flex flex-col gap-1"
                        >
                            <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">{m.label}</p>
                            <p className="font-display text-3xl font-semibold text-ink tabular-nums">{m.value}</p>
                            <p className="font-mono text-[0.65rem] text-muted/60">{m.note}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}

// ── Step data ────────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
    {
        n: '01',
        label: 'connect wallet',
        desc: 'Link your Web3 wallet to the Arc L1 network. Enables USDC micropayments with sub-cent gas fees.',
    },
    {
        n: '02',
        label: 'select signal type',
        desc: 'Choose symbol, timeframe, and output — ANALYZE (regime), BACKTEST (validation), or full SIGNAL (entry coords).',
    },
    {
        n: '03',
        label: 'payment verified',
        desc: 'HTTP 402 endpoint validates your $0.001 USDC payment on-chain. No payment, no agent run.',
    },
    {
        n: '04',
        label: 'agents run',
        desc: 'Gemini-powered agents detect regime, backtest the strategy, and compute entry / TP / SL coordinates.',
    },
    {
        n: '05',
        label: 'receive signal',
        desc: 'Precise, actionable intelligence delivered instantly. No subscription. No wasted capital.',
    },
];

// ── Ticker entries ───────────────────────────────────────────────────────────
const TICKER = [
    {
        prefix: 'agent: analyze BTCUSDT 4h → regime-detector: trending bull → gemini: RSI oversold at support',
        verdict: '→ SIGNAL: LONG @ 67,420 · TP 71,200 · SL 65,800',
        color:   '#D7FF3E',
    },
    {
        prefix: 'agent: validate momentum-breakout → backtester: 847 trades · sharpe 1.84 → gemini: statistically significant',
        verdict: '→ STATUS: APPROVED · win rate 64%',
        color:   '#22c787',
    },
    {
        prefix: 'agent: check 8% position size on BTCUSDT → risk-engine: exceeds 2% policy limit',
        verdict: '→ BLOCKED · max position enforced at 2%',
        color:   '#ff5d5d',
    },
    {
        prefix: 'agent: analyze ETHUSDT funding rate → on-chain: extreme negative funding (-0.08%) → gemini: mean-reversion setup',
        verdict: '→ SIGNAL: SHORT @ 3,240 · TP 3,010 · SL 3,380',
        color:   '#D7FF3E',
    },
];

// ── Arrow connector ───────────────────────────────────────────────────────────
function StepArrow() {
    return (
        <div className="flex items-center justify-center self-stretch py-2 lg:py-0" aria-hidden="true">
            <svg viewBox="0 0 40 8" className="hidden h-2 w-10 lg:block" fill="none">
                <path d="M0 4 H32 M28 0.5 L33.5 4 L28 7.5" stroke="#8b93a5" strokeWidth="1.5" />
            </svg>
            <svg viewBox="0 0 8 32" className="h-8 w-2 lg:hidden" fill="none">
                <path d="M4 0 V24 M0.5 20 L4 25.5 L7.5 20" stroke="#8b93a5" strokeWidth="1.5" />
            </svg>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    const shouldReduceMotion = useReducedMotion();
    const easeCurve: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Premium expo-out curve

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            }
        }
    };

    const lineVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: easeCurve
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-ink font-sans">

            {/* ────────────────── HERO ─────────────────── */}
            <section className="relative overflow-hidden border-b border-hairline">
                <HeroCanvas />

                {/* Accent glow at base of hero */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-72"
                    style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 115%, rgba(215,255,62,0.07), transparent 70%)' }}
                />

                <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center px-5 pb-20 pt-24 sm:px-8">
                    <div className="max-w-3xl">
                        <motion.p
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: easeCurve }}
                            className="eyebrow mb-6"
                        >
                            powered by Google Gemini · Arc L1 Network
                        </motion.p>

                        <motion.h1
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl"
                        >
                            <motion.span className="block" variants={lineVariants}>Quant intelligence.</motion.span>
                            <motion.span className="block" variants={lineVariants}>Pay only when</motion.span>
                            <motion.span className="block text-accent" variants={lineVariants}>you need it.</motion.span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.45, ease: easeCurve }}
                            className="mt-7 max-w-2xl text-base text-muted sm:text-lg leading-relaxed"
                        >
                            Retail traders shouldn&apos;t pay $100/month for signals they use 3 times.
                            Metis runs AI-powered regime detection, vectorized backtesting, and
                            precise entry coordination — unlocked for <span className="font-mono text-accent">$0.001 USDC</span> per request.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.65, ease: easeCurve }}
                            className="mt-10 flex flex-wrap items-center gap-4"
                        >
                            <Link
                                href="/login"
                                className="font-mono bg-ink px-6 py-3 text-sm font-semibold text-background transition-all hover:bg-accent hover:scale-[1.03] active:scale-[0.98]"
                            >
                                Launch app →
                            </Link>
                            <a
                                href="#how-it-works"
                                className="font-mono border border-hairline px-6 py-3 text-sm text-ink transition-all hover:border-accent hover:text-accent hover:scale-[1.03] active:scale-[0.98]"
                            >
                                How it works
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.85 }}
                            className="mt-10"
                        >
                            <span className="font-mono inline-flex items-center gap-2 border border-hairline bg-surface px-3 py-1.5 text-xs text-muted">
                                <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
                                Built for the Lepton Agents Hackathon.
                            </span>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ───────────────── THE PROBLEM ────────────── */}
            <section className="border-b border-hairline">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
                >
                    <motion.p variants={itemRevealVariants} className="eyebrow mb-6">the problem</motion.p>
                    <motion.h2 variants={itemRevealVariants} className="font-display max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                        A subscription you barely use is pure financial waste.
                    </motion.h2>
                    <motion.p variants={itemRevealVariants} className="mt-6 max-w-2xl text-muted leading-relaxed">
                        Traditional signal platforms lock you into monthly fees regardless of trading frequency.
                        You pay $100/month, use the platform three times, cancel — and repeat. There&apos;s a better model.
                    </motion.p>

                    <motion.div
                        variants={itemRevealVariants}
                        className="mt-14 grid gap-px border border-hairline bg-hairline sm:grid-cols-3"
                    >
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
                            className="bg-surface p-6 transition-all duration-300 hover:border-white/10"
                        >
                            <div className="font-mono text-xs text-muted">01</div>
                            <div className="font-mono mt-3 text-sm font-semibold text-ink">subscription lock-in</div>
                            <p className="mt-2 text-sm text-muted">Pay $100/month whether you trade once or a hundred times. No refunds for idle weeks.</p>
                        </motion.div>
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
                            className="bg-surface p-6 transition-all duration-300 hover:border-white/10"
                        >
                            <div className="font-mono text-xs text-muted">02</div>
                            <div className="font-mono mt-3 text-sm font-semibold text-ink">stale static signals</div>
                            <p className="mt-2 text-sm text-muted">Pre-generated alerts with no real-time regime awareness or on-chain funding data.</p>
                        </motion.div>
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
                            className="bg-surface p-6 transition-all duration-300 hover:border-white/10"
                        >
                            <div className="font-mono text-xs text-muted">03</div>
                            <div className="font-mono mt-3 text-sm font-semibold text-ink">no strategy validation</div>
                            <p className="mt-2 text-sm text-muted">No way to backtest the signal logic before risking capital. You fly blind every time.</p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </section>

            {/* ───────────────── SIGNAL OUTPUTS ─────────── */}
            <section id="signals" className="border-b border-hairline">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
                >
                    <motion.p variants={itemRevealVariants} className="eyebrow mb-6">signal outputs</motion.p>
                    <motion.h2 variants={itemRevealVariants} className="font-display max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                        Every request gets a response.
                    </motion.h2>
                    <motion.p variants={itemRevealVariants} className="mt-6 max-w-2xl text-muted leading-relaxed">
                        Three output types. Each gated by a <span className="font-mono text-accent">$0.001 USDC</span> micropayment
                        verified on Arc L1. Nothing executes without confirmed payment.
                    </motion.p>

                    <motion.div
                        variants={itemRevealVariants}
                        className="mt-14 grid gap-5 lg:grid-cols-3"
                    >
                        {/* ANALYZE */}
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -6, borderColor: 'rgba(255,255,255,0.25)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                            className="flex flex-col border border-hairline bg-surface p-8 transition-all duration-300"
                        >
                            <div className="font-mono text-3xl font-semibold tracking-tight text-approve">ANALYZE</div>
                            <div className="font-mono mt-5 text-sm text-ink">Market regime detection.</div>
                            <p className="mt-3 text-sm text-muted leading-relaxed">
                                Gemini reads live price feeds, order-book depth, and on-chain funding rates
                                to classify the current regime: trending, ranging, or reversal.
                            </p>
                            <span className="font-mono mt-auto pt-6 inline-flex items-center gap-1.5 text-xs text-muted">
                                <span className="inline-block size-1.5 rounded-full bg-approve" />
                                real-time · $0.001 USDC
                            </span>
                        </motion.div>

                        {/* BACKTEST */}
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -6, borderColor: 'rgba(255,255,255,0.25)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                            className="flex flex-col border border-hairline bg-surface p-8 transition-all duration-300"
                        >
                            <div className="font-mono text-3xl font-semibold tracking-tight text-review">BACKTEST</div>
                            <div className="font-mono mt-5 text-sm text-ink">Strategy validation.</div>
                            <p className="mt-3 text-sm text-muted leading-relaxed">
                                Vectorized simulation across 3 years of OHLCV data. Sharpe ratio,
                                max drawdown, win rate — quantified before you risk a dollar.
                            </p>
                            <span className="font-mono mt-auto pt-6 inline-flex items-center gap-1.5 text-xs text-muted">
                                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                                validated · $0.001 USDC
                            </span>
                        </motion.div>

                        {/* SIGNAL */}
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -6, borderColor: 'rgba(215,255,62,0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                            className="flex flex-col border border-hairline bg-surface p-8 transition-all duration-300"
                        >
                            <div className="font-mono text-3xl font-semibold tracking-tight text-accent">SIGNAL</div>
                            <div className="font-mono mt-5 text-sm text-ink">Entry coordinates.</div>
                            <p className="mt-3 text-sm text-muted leading-relaxed">
                                Precise entry price, take-profit levels, stop-loss coordinates,
                                and risk-adjusted position size — ready to execute immediately.
                            </p>
                            <span className="font-mono mt-auto pt-6 inline-flex items-center gap-1.5 text-xs text-muted">
                                <span className="inline-block size-1.5 rounded-full bg-accent" />
                                actionable · $0.001 USDC
                            </span>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* ── Scrolling ticker ─────────────────── */}
                <div className="ticker-wrap overflow-hidden border-t border-hairline bg-surface/60 py-3" role="img" aria-label="Example agent pipeline outputs">
                    <div className="animate-ticker flex w-max">
                        {[0, 1].map((dupe) => (
                            <div key={dupe} className="flex shrink-0 items-center" aria-hidden={dupe === 1}>
                                {TICKER.map((t, i) => (
                                    <span key={i} className="font-mono whitespace-nowrap pr-16 text-xs text-muted">
                                        <span>{t.prefix}</span>
                                        <span style={{ color: t.color }}>&nbsp;{t.verdict}</span>
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────────────── HOW IT WORKS ───────────── */}
            <section id="how-it-works" className="border-b border-hairline">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
                >
                    <motion.p variants={itemRevealVariants} className="eyebrow mb-6">how it works</motion.p>
                    <motion.h2 variants={itemRevealVariants} className="font-display max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                        You request. The agents deliver.
                    </motion.h2>

                    <motion.div
                        variants={itemRevealVariants}
                        className="mt-14 flex flex-col items-stretch lg:flex-row"
                    >
                        {HOW_IT_WORKS.map((step, i) => (
                            <React.Fragment key={step.n}>
                                <motion.div
                                    variants={itemRevealVariants}
                                    whileHover={shouldReduceMotion ? {} : { y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
                                    className="flex-1 border border-hairline bg-surface p-5 transition-all duration-300"
                                >
                                    <div className="font-mono text-xs text-muted">{step.n}</div>
                                    <div className="font-mono mt-3 text-sm font-semibold text-ink">{step.label}</div>
                                    <p className="mt-2 text-xs leading-relaxed text-muted">{step.desc}</p>
                                </motion.div>
                                {i < HOW_IT_WORKS.length - 1 && <StepArrow />}
                            </React.Fragment>
                        ))}
                    </motion.div>

                    <motion.div
                        variants={itemRevealVariants}
                        className="mt-12 border-l-2 border-accent bg-surface/60 px-6 py-5"
                    >
                        <p className="max-w-3xl text-sm text-ink leading-relaxed">
                            Payment is verified on Arc L1 before any agent runs. No payment, no signal.
                            No subscription required, no wasted spend. Pure on-demand intelligence.
                        </p>
                    </motion.div>
                </motion.div>
            </section>

            {/* ───────────────── ON-CHAIN INFRASTRUCTURE ─────────── */}
            <section id="infrastructure" className="border-b border-hairline relative overflow-hidden bg-background">
                {/* Glow ring in background */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 -bottom-24 h-96 w-[120%] -translate-x-1/2 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 100%, #a855f7, transparent 80%)' }}
                />

                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32 relative z-10"
                >
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <motion.p variants={itemRevealVariants} className="eyebrow mb-6 text-purple-400">on-chain infrastructure</motion.p>
                        <motion.h2 variants={itemRevealVariants} className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl mb-6">
                            Transform Your Crypto Journey
                        </motion.h2>
                        <motion.p variants={itemRevealVariants} className="max-w-2xl mx-auto text-muted leading-relaxed">
                            Experience enhanced security, speed, and convenience with our cutting-edge, self-paying agentic cryptocurrency wallet architecture.
                        </motion.p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {/* CARD 1: Embedded EVM Wallet */}
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -6, borderColor: 'rgba(168,85,247,0.4)' }}
                            className="group flex flex-col border border-hairline bg-surface p-8 relative overflow-hidden transition-all duration-300"
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Graphic */}
                            <div className="h-64 flex items-center justify-center relative mb-8">
                                <div className="relative w-44 h-56 bg-[#0e0e15] border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
                                    <div className="flex justify-between items-center">
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                        <div className="w-10 h-1 bg-white/10 rounded-full" />
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                    </div>

                                    {/* Phone Screen Balance Card */}
                                    <div className="my-auto space-y-4">
                                        <div className="border border-white/5 bg-surface/80 backdrop-blur-sm p-3 rounded-xl shadow-lg relative overflow-hidden">
                                            {/* Glow accent */}
                                            <div className="absolute right-0 top-0 w-12 h-12 bg-purple-500/10 rounded-full blur-md" />
                                            <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Active Wallet</p>
                                            <p className="font-mono text-sm font-semibold text-ink mt-1 truncate">0x71C7...476B</p>
                                            <div className="mt-3 flex items-baseline gap-1">
                                                <span className="font-display text-xl font-bold text-ink">50.00</span>
                                                <span className="font-mono text-[10px] text-purple-400 font-bold">USDC</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom home indicator */}
                                    <div className="w-16 h-1 bg-white/20 rounded-full mx-auto" />
                                </div>

                                {/* Orbiting rings */}
                                <div className="absolute border border-purple-500/10 rounded-full w-64 h-64 animate-[spin_20s_linear_infinite]" />
                                <div className="absolute border border-dashed border-white/5 rounded-full w-48 h-48 animate-[spin_10s_linear_infinite_reverse]" />
                            </div>

                            <h3 className="font-display text-lg font-semibold text-ink mb-3">Embedded EVM Wallet</h3>
                            <p className="text-sm text-muted leading-relaxed">
                                Zero setup friction. Sign up via email and instantly receive a secure on-chain USDC wallet for yourself and your agents.
                            </p>
                        </motion.div>

                        {/* CARD 2: On-Chain Micropayments */}
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -6, borderColor: 'rgba(168,85,247,0.4)' }}
                            className="group flex flex-col border border-hairline bg-surface p-8 relative overflow-hidden transition-all duration-300"
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Graphic */}
                            <div className="h-64 flex items-center justify-center relative mb-8">
                                {/* Beam of light */}
                                <div className="absolute w-32 h-48 bg-gradient-to-t from-purple-500/20 to-transparent blur-sm rounded-full transform -translate-y-4" />

                                {/* System Base */}
                                <div className="absolute bottom-6 w-36 h-10 border border-white/10 bg-surface/60 rounded-full flex items-center justify-center shadow-lg">
                                    <div className="w-28 h-6 border border-white/5 bg-background rounded-full" />
                                </div>

                                {/* Floating coin */}
                                <div className="relative bottom-4 w-16 h-16 bg-gradient-to-tr from-purple-600 to-purple-400 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-transform duration-500 group-hover:translate-y-[-10px] group-hover:scale-105">
                                    <span className="font-display text-2xl font-bold text-white tracking-tight">$</span>

                                    {/* Secondary floating coin */}
                                    <div className="absolute -top-6 -right-6 w-8 h-8 bg-gradient-to-tr from-purple-500 to-indigo-400 rounded-full flex items-center justify-center opacity-85 shadow-md">
                                        <span className="font-display text-xs font-bold text-white">c</span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-display text-lg font-semibold text-ink mb-3">On-Chain Micropayments</h3>
                            <p className="text-sm text-muted leading-relaxed">
                                Gated by the HTTP 402 standard. Settle real USDC payments natively on the Arc network with sub-cent transactions and zero subscriptions.
                            </p>
                        </motion.div>

                        {/* CARD 3: Autonomous Agent Fleets */}
                        <motion.div
                            variants={itemRevealVariants}
                            whileHover={shouldReduceMotion ? {} : { y: -6, borderColor: 'rgba(168,85,247,0.4)' }}
                            className="group flex flex-col border border-hairline bg-surface p-8 relative overflow-hidden transition-all duration-300"
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Graphic */}
                            <div className="h-64 flex items-center justify-center relative mb-8">
                                <div className="relative w-52 h-44 flex flex-col justify-between">
                                    {/* Connections lines */}
                                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="104" y1="24" x2="48" y2="124" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
                                        <line x1="104" y1="24" x2="160" y2="124" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
                                    </svg>

                                    {/* Center Top node: Strategy Agent */}
                                    <div className="mx-auto border border-purple-500/30 bg-[#0e0e15] px-4 py-2 shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-105">
                                        <p className="font-mono text-[9px] uppercase tracking-wider text-purple-400">Strategy Agent</p>
                                        <p className="font-mono text-[9px] text-muted mt-0.5">Executes Simulation</p>
                                    </div>

                                    {/* Bottom node left: Signal Agent */}
                                    <div className="flex justify-between w-full">
                                        <div className="border border-white/5 bg-[#0e0e15] px-3 py-1.5 shadow-md transition-transform duration-500 group-hover:-translate-x-1">
                                            <p className="font-mono text-[9px] uppercase text-ink">Signal Agent</p>
                                            <p className="font-mono text-[8px] text-muted">Charges $0.001</p>
                                        </div>

                                        {/* Bottom node right: Risk Agent */}
                                        <div className="border border-white/5 bg-[#0e0e15] px-3 py-1.5 shadow-md transition-transform duration-500 group-hover:translate-x-1">
                                            <p className="font-mono text-[9px] uppercase text-ink">Risk Agent</p>
                                            <p className="font-mono text-[8px] text-muted">Charges $0.0005</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-display text-lg font-semibold text-ink mb-3">Autonomous Agent Fleets</h3>
                            <p className="text-sm text-muted leading-relaxed">
                                Multi-agent coordination: Strategy Agents pay Signal Agents for insights and Risk Agents for on-chain safety validation automatically.
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ───────────────── REQUEST FORMAT ─────────── */}
            <section className="border-b border-hairline">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:items-center"
                >
                    <div className="space-y-6">
                        <motion.p variants={itemRevealVariants} className="eyebrow">request format</motion.p>
                        <motion.h2 variants={itemRevealVariants} className="font-display max-w-md text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                            One request. Full intelligence pipeline.
                        </motion.h2>
                        <motion.p variants={itemRevealVariants} className="max-w-xl text-muted leading-relaxed">
                            Each API call triggers the complete agent stack: regime detection, historical
                            validation, then signal generation. The <span className="font-mono text-ink">HTTP 402</span> Payment
                            Required standard gates every response behind a verified USDC micropayment on Arc L1.
                        </motion.p>
                    </div>

                    <motion.div variants={itemRevealVariants}>
                        <div className="border border-hairline bg-surface">
                            <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
                                <span className="font-mono text-xs text-muted">signal-request.json</span>
                                <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">http 402 · arc l1</span>
                            </div>
                            <pre className="overflow-x-auto p-5 text-[0.8rem] leading-relaxed text-ink font-mono">
{`{
  "symbol":    "BTCUSDT",
  "timeframe": "4h",
  "type":      "SIGNAL",
  "backtest": {
    "enabled":      true,
    "period_years": 3
  },
  "risk": {
    "max_position_pct": 2,
    "rr_ratio":         2.5
  },
  "payment": {
    "amount":  "0.001",
    "token":   "USDC",
    "network": "arc-l1"
  }
}`}
                            </pre>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* ───────────────── LIVE DEPLOYMENT ───────── */}
            <section className="border-b border-hairline">
                <motion.div
                    variants={sectionRevealVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
                >
                    <motion.p variants={itemRevealVariants} className="eyebrow mb-6">live deployment</motion.p>
                    <motion.h2 variants={itemRevealVariants} className="font-display max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                        Live on Arc L1 Network.
                    </motion.h2>

                    <motion.div variants={itemRevealVariants} className="mt-14 max-w-3xl">
                        <div className="relative overflow-hidden border border-hairline bg-surface">
                            {/* Top accent line */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(215,255,62,0.5) 35%, rgba(215,255,62,0.5) 65%, transparent)' }}
                            />
                            <div className="flex items-center gap-2.5 border-b border-hairline px-5 py-3">
                                <span className="inline-block size-1.5 rounded-full bg-accent" />
                                <span className="font-mono text-xs text-muted">tradercopilot · arc-l1-mainnet</span>
                            </div>
                            <dl className="font-mono divide-y divide-hairline text-sm">
                                {[
                                    { k: 'network',          v: 'Arc L1 Mainnet' },
                                    { k: 'payment token',    v: 'USDC — $0.001 per signal request' },
                                    { k: 'payment standard', v: 'HTTP 402 Payment Required' },
                                    { k: 'ai backbone',      v: 'Google Gemini 1.5 Pro (agent orchestration)' },
                                    { k: 'stack',            v: 'FastAPI · Next.js · SQLite · Python vectorbt' },
                                ].map(row => (
                                    <div key={row.k} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr]">
                                        <dt className="text-muted">{row.k}</dt>
                                        <dd className="text-ink">{row.v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-5">
                            <p className="text-sm text-muted">Connect a wallet on Arc L1 to access AI quant signals instantly.</p>
                            <Link
                                href="/login"
                                className="font-mono bg-ink px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent"
                            >
                                Launch app →
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            </section>


            {/* ───────────────── LIVE STATS STRIP ──────── */}
            <LiveStatsStrip />

            {/* ────────────────── FOOTER ───────────────── */}

            <footer>
                <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5 text-ink">
                            <LogoMark width={16} height={16} />
                            <span className="font-display text-base font-medium tracking-tight">Metis</span>
                            <span className="font-mono ml-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted">quant on demand</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <Link
                                href="/login"
                                className="font-mono border border-hairline bg-surface px-4 py-2 text-xs text-ink transition-colors hover:border-accent hover:text-accent"
                            >
                                Launch app →
                            </Link>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-muted transition-colors hover:text-ink"
                            >
                                View source
                            </a>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-mono inline-flex items-center gap-2 text-xs text-muted">
                            <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
                            Built for the Lepton Agents Hackathon.
                        </span>
                        <span className="font-mono text-xs text-muted">© 2026 Metis</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
