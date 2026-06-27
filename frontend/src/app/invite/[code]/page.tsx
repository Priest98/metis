'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowRight, Zap, Link2, Gift } from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const fadeIn = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5, delay },
});

// ── Pulsing dot ───────────────────────────────────────────────────────────────

function PulsingDot() {
    return (
        <span className="relative flex h-2 w-2">
            <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"
                animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
    );
}

// ── What-you-get card ─────────────────────────────────────────────────────────

interface PerksCardProps {
    emoji: string;
    title: string;
    desc: string;
    delay: number;
}

function PerksCard({ emoji, title, desc, delay }: PerksCardProps) {
    return (
        <motion.div
            {...fadeUp(delay)}
            className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-6 hover:border-accent/30 transition-colors duration-300"
        >
            <span className="text-3xl">{emoji}</span>
            <h3 className="font-display font-bold text-ink text-lg">{title}</h3>
            <p className="text-muted text-sm leading-relaxed">{desc}</p>
        </motion.div>
    );
}

// ── Step item ─────────────────────────────────────────────────────────────────

interface StepProps {
    n: string;
    label: string;
    delay: number;
    last?: boolean;
}

function Step({ n, label, delay, last }: StepProps) {
    return (
        <motion.div {...fadeUp(delay)} className="flex items-center gap-4">
            <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-sm font-bold text-accent shrink-0">
                    {n}
                </div>
                {!last && <div className="mt-2 h-8 w-px bg-hairline" />}
            </div>
            <span className="font-sans text-ink text-sm pb-8 last:pb-0">{label}</span>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InvitePage() {
    const params = useParams();
    const rawCode = typeof params?.code === 'string' ? params.code : 'unknown';
    const displayCode =
        rawCode.length > 10
            ? `${rawCode.slice(0, 6)}…${rawCode.slice(-4)}`
            : rawCode;

    const [copied, setCopied] = useState(false);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(rawCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <main className="min-h-screen bg-background overflow-x-hidden">

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">

                {/* Accent glow */}
                <motion.div
                    {...fadeIn(0)}
                    className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[420px] w-[700px] rounded-full"
                    style={{
                        background:
                            'radial-gradient(ellipse at top, rgba(215,255,62,0.18) 0%, transparent 70%)',
                    }}
                />

                {/* Grid overlay */}
                <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl mx-auto">

                    {/* Eyebrow tag */}
                    <motion.span
                        {...fadeUp(0.1)}
                        className="font-mono text-xs text-accent tracking-widest uppercase border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full"
                    >
                        You&apos;ve Been Invited
                    </motion.span>

                    {/* Headline */}
                    <motion.h1
                        {...fadeUp(0.2)}
                        className="font-display text-5xl md:text-6xl font-black text-ink uppercase leading-none tracking-tight"
                    >
                        Join the<br />
                        <span className="text-accent">Agent Economy</span>
                    </motion.h1>

                    {/* Subline */}
                    <motion.p
                        {...fadeUp(0.3)}
                        className="text-muted text-lg md:text-xl max-w-xl leading-relaxed"
                    >
                        Agent{' '}
                        <span className="font-mono text-ink bg-surface border border-hairline px-2 py-0.5 rounded-md text-sm">
                            {displayCode}
                        </span>{' '}
                        invited you to{' '}
                        <span className="text-ink font-semibold">Metis</span> — the AI quant
                        platform where signals cost{' '}
                        <span className="text-accent font-mono font-semibold">$0.001 USDC</span>.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        {...fadeUp(0.4)}
                        className="flex flex-col sm:flex-row items-center gap-3 mt-2"
                    >
                        <Link
                            href="/faucet"
                            className="group flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-bold text-background text-sm hover:brightness-110 transition-all duration-200 shadow-lg shadow-accent/20"
                        >
                            Claim Free USDC &amp; Try a Signal
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-2 rounded-full border border-hairline px-6 py-3 font-display font-semibold text-ink text-sm hover:border-accent/50 hover:text-accent transition-all duration-200"
                        >
                            Explore Platform
                        </Link>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    {...fadeIn(1.0)}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                >
                    <span className="font-mono text-xs text-muted tracking-widest">SCROLL</span>
                    <motion.div
                        className="w-px h-8 bg-gradient-to-b from-muted to-transparent"
                        animate={{ scaleY: [1, 0.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.div>
            </section>

            {/* ── WHAT YOU GET ──────────────────────────────────────────────── */}
            <section className="px-6 py-20 max-w-5xl mx-auto">
                <motion.div {...fadeUp(0)} className="text-center mb-12">
                    <span className="font-mono text-xs text-accent tracking-widest uppercase">
                        What&apos;s included
                    </span>
                    <h2 className="mt-3 font-display text-3xl font-black text-ink">
                        Everything you get for free
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PerksCard
                        emoji="🎁"
                        title="10 Test USDC"
                        desc="Free testnet USDC to unlock your first signals. No real money needed."
                        delay={0.05}
                    />
                    <PerksCard
                        emoji="⚡"
                        title="Instant Signals"
                        desc="AI-generated BTC/ETH/SOL entry, TP, and SL coordinates in <400ms."
                        delay={0.15}
                    />
                    <PerksCard
                        emoji="🔗"
                        title="On-Chain Proof"
                        desc="Every signal unlock is a real Arc L1 transaction. Not simulated."
                        delay={0.25}
                    />
                </div>
            </section>

            {/* ── REFERRAL CHAIN ────────────────────────────────────────────── */}
            <section className="px-6 py-6 max-w-5xl mx-auto">
                <motion.div
                    {...fadeUp(0.05)}
                    className="rounded-2xl border border-hairline bg-surface p-6 flex flex-col md:flex-row items-start md:items-center gap-6"
                >
                    {/* Left label */}
                    <div className="flex items-center gap-3 shrink-0">
                        <PulsingDot />
                        <span className="font-mono text-xs text-muted tracking-wider uppercase">
                            Invited by agent
                        </span>
                    </div>

                    {/* Address display */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-background px-4 py-3">
                            <span className="font-mono text-sm text-ink truncate flex-1 min-w-0">
                                {rawCode}
                            </span>
                            <button
                                onClick={handleCopyAddress}
                                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 font-mono text-xs text-muted hover:border-accent hover:text-accent transition-colors"
                                title="Copy address"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3 h-3 text-approve" />
                                        <span className="text-approve">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right label */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Link2 className="w-4 h-4 text-muted" />
                        <span className="font-mono text-xs text-muted">Via Metis invite network</span>
                    </div>
                </motion.div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
            <section className="px-6 py-20 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Left: label + heading */}
                    <motion.div {...fadeUp(0)}>
                        <span className="font-mono text-xs text-accent tracking-widest uppercase">
                            Simple process
                        </span>
                        <h2 className="mt-3 font-display text-3xl font-black text-ink">
                            How it works
                        </h2>
                        <p className="mt-4 text-muted text-sm leading-relaxed max-w-xs">
                            Get started in under 2 minutes. No credit card. No KYC. Just a wallet
                            and curiosity.
                        </p>
                    </motion.div>

                    {/* Right: steps */}
                    <div className="flex flex-col">
                        <Step n="01" label="Claim your free testnet USDC from the faucet" delay={0.05} />
                        <Step n="02" label="Pay $0.001 USDC to unlock any AI signal" delay={0.15} />
                        <Step n="03" label="Receive your BTC/ETH/SOL entry + TP + SL instantly" delay={0.25} last />
                    </div>
                </div>

                {/* Stat row */}
                <motion.div
                    {...fadeUp(0.35)}
                    className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                    {[
                        { label: 'Signal latency', value: '<400ms', icon: <Zap className="w-4 h-4 text-accent" /> },
                        { label: 'Cost per signal', value: '$0.001', icon: <Gift className="w-4 h-4 text-accent" /> },
                        { label: 'Network', value: 'Arc L1', icon: <Link2 className="w-4 h-4 text-accent" /> },
                    ].map(({ label, value, icon }) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-5 py-4"
                        >
                            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">{icon}</div>
                            <div>
                                <p className="font-mono font-bold text-ink text-lg leading-none">{value}</p>
                                <p className="font-mono text-xs text-muted mt-1">{label}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ── BOTTOM CTA ────────────────────────────────────────────────── */}
            <section className="px-6 py-24">
                <motion.div
                    {...fadeUp(0.05)}
                    className="max-w-3xl mx-auto rounded-3xl border border-accent/20 bg-surface relative overflow-hidden flex flex-col items-center gap-6 py-16 px-8 text-center"
                >
                    {/* Glow */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse at 50% 0%, rgba(215,255,62,0.12) 0%, transparent 60%)',
                        }}
                    />

                    <span className="relative font-mono text-xs text-accent tracking-widest uppercase border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full">
                        Ready to start?
                    </span>

                    <h2 className="relative font-display text-4xl md:text-5xl font-black text-ink uppercase leading-none">
                        Your first signal<br />is waiting
                    </h2>

                    <p className="relative text-muted max-w-sm text-sm leading-relaxed">
                        Claim free USDC, pay one micro-transaction, and see exactly what the AI
                        quant engine sees — in under 400 milliseconds.
                    </p>

                    <motion.div
                        className="relative"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                        <Link
                            href={`/signup?ref=${rawCode}`}
                            className="group flex items-center gap-3 rounded-full bg-accent px-8 py-4 font-display font-black text-background text-base hover:brightness-110 transition-all duration-200 shadow-xl shadow-accent/25"
                        >
                            Get Started — Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>

                    <p className="relative font-mono text-xs text-muted">
                        Invited via agent{' '}
                        <span className="text-ink">{displayCode}</span>
                    </p>
                </motion.div>
            </section>

            {/* ── FOOTER STRIP ──────────────────────────────────────────────── */}
            <footer className="border-t border-hairline px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
                <span className="font-mono text-xs text-muted">
                    © {new Date().getFullYear()} Metis · Arc Testnet
                </span>
                <div className="flex items-center gap-6">
                    <Link href="/" className="font-mono text-xs text-muted hover:text-accent transition-colors">
                        Platform
                    </Link>
                    <Link href="/faucet" className="font-mono text-xs text-muted hover:text-accent transition-colors">
                        Faucet
                    </Link>
                    <Link href="/api-docs" className="font-mono text-xs text-muted hover:text-accent transition-colors">
                        API Docs
                    </Link>
                </div>
            </footer>
        </main>
    );
}
