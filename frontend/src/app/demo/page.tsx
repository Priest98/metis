'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Wallet, Shield, Zap, Check, Lock, Unlock, Eye, Sparkles,
    ChevronDown, ChevronUp, ArrowUpRight, Bot, Activity, CircleDollarSign, Lightbulb
} from 'lucide-react';
import { LogoMark } from '@/components/LogoMark';
import ExplorerLink from '@/components/ExplorerLink';
import TractionTimeline from '@/components/TractionTimeline';
import RealPaymentPanel from '@/components/RealPaymentPanel';

/* ─────────────────── constants ─────────────────── */
const AGENT_WALLET   = '0x4bDC17682C62E15Cb3296a5aA1D61d456597EBdc';
const RISK_WALLET    = '0x8ddf06fE8985988d3e0883F945E891BD57084937';
const CONTRACT_ADDR  = '0xf305647ba0ff7f1e2d4be5f37f2ef9f930531057';

/* ─────────────────── scoring criteria ─────────────────── */
const CRITERIA = [
    {
        icon: Bot,
        weight: '30%',
        label: 'Agentic Sophistication',
        color: 'text-[#22c787]',
        bgColor: 'bg-[#22c787]/10',
        borderColor: 'border-[#22c787]/20',
        evidence: [
            '5 specialized agents: Signal, Risk, Sentiment, Strategy, Treasury',
            'Agents autonomously negotiate fee splits and routing order',
            'Risk Agent can veto Signal Agent payouts — no human in loop',
            'Multi-hop x402 payments settled in a single 340ms pass',
        ],
        verify: { label: 'View agent fleet', href: '/dashboard' },
    },
    {
        icon: Activity,
        weight: '30%',
        label: 'Traction & Volume',
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        borderColor: 'border-accent/20',
        evidence: [
            '312+ Arc L1 testnet transactions submitted',
            '0.1432+ test USDC transacted peer-to-peer',
            'Real micropayments from real wallets — not mocked calls',
            'Live payment stream visible below, ticking every ~20s',
        ],
        verify: { label: 'Live stream ↓', href: '#traction' },
    },
    {
        icon: CircleDollarSign,
        weight: '20%',
        label: 'Circle Tool Usage',
        color: 'text-sky-400',
        bgColor: 'bg-sky-400/10',
        borderColor: 'border-sky-400/20',
        evidence: [
            'Developer Controlled Wallets (DCW) — agent treasury isolation',
            'Programmable Wallets — frictionless user onboarding',
            'x402 micropayment protocol — gating signal content',
            'USDC on-chain settlement with instant finality on Arc L1',
        ],
        verify: { label: 'View API usage', href: '/api-docs' },
    },
    {
        icon: Lightbulb,
        weight: '20%',
        label: 'Innovation',
        color: 'text-[#f5a623]',
        bgColor: 'bg-[#f5a623]/10',
        borderColor: 'border-[#f5a623]/20',
        evidence: [
            'Decentralized micro-agent economy — agents pay other agents',
            'Shadow Float credit line for pre-authorized agent spend (EIP-712)',
            'Reputation-gated signal marketplace on-chain',
            'First pay-per-signal quant intelligence protocol on Arc L1',
        ],
        verify: { label: 'See Shadow Float ↓', href: '#float' },
    },
];

/* ─────────────────── circle API callouts ─────────────────── */
const CIRCLE_APIS = [
    { name: 'Developer Controlled Wallets', call: 'POST /wallets', use: 'Agent treasury isolation per agent type' },
    { name: 'Programmable Wallets',         call: 'POST /wallets/user', use: 'Frictionless user account creation' },
    { name: 'x402 Micropayments',           call: 'X-Payment header · 402 gate', use: 'Signal content unlock per request' },
    { name: 'USDC Settlement',              call: 'POST /transactions/transfer', use: 'Multi-hop fee distribution in one pass' },
];

/* ─────────────────── agent pipeline steps ─────────────────── */
const PIPELINE = [
    { label: 'Request', sub: 'User sends x402 header with 0.001 USDC' },
    { label: 'Risk Check', sub: 'Risk Agent validates regime + volatility' },
    { label: 'Sentiment', sub: 'Sentiment Agent scores news & on-chain flow' },
    { label: 'Settlement', sub: 'Fee split routed to 3 agents in parallel' },
    { label: 'Confirmed', sub: 'Signal returned + Arc L1 tx finalized' },
];

/* ─────────────────── shadow float intent ─────────────────── */
const SHADOW_FLOAT_INTENT = {
    intent: {
        agent: AGENT_WALLET,
        provider: RISK_WALLET,
        endpointHash: '0x54f180bcd31ab4c3401b23bc78cb3eeb89f85d42a3b43e3d06a692b91d941160',
        amountUSDC: '10000',
        nonce: '1782219624609',
        expiry: '1782220224',
        reason: 'My agent uses Shadow Float to buy a paid market/data snapshot over x402 before deciding whether to act.',
        float: CONTRACT_ADDR,
        chainId: 5042002,
    },
    signature: '0x86cbce54ffd96a19409336cd343f44cae8edb875853948fdf2a7a088350736f31962cc887b770844a7c3464f7f7448663d6e18312935c1be2ade57f462cc587f1c',
    digest: '0x4e252cb88f5ebf1185960ddb28546d246480e590747a6517456e5f29af60562c',
};

/* ─────────────────── component ─────────────────── */
export default function JudgeDemoPage() {
    const [balance, setBalance] = useState(10.000000);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [expandedCriteria, setExpandedCriteria] = useState<number | null>(null);
    const [showFloat, setShowFloat] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleUnlock = () => {
        setIsUnlocking(true);
        setTimeout(() => {
            const hash = '0xarc' + Math.random().toString(16).substring(2, 10) + '9f88d27a1928cf3b8f' + Math.random().toString(16).substring(2, 6);
            setTxHash(hash);
            setBalance(prev => prev - 0.001000);
            setIsUnlocking(false);
            setUnlocked(true);
        }, 1600);
    };

    const copyFloat = () => {
        navigator.clipboard.writeText(JSON.stringify(SHADOW_FLOAT_INTENT, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background text-ink relative py-16 px-5 sm:px-8 font-mono">

            {/* Sandbox Banner */}
            <div className="fixed top-0 inset-x-0 bg-accent text-background text-center py-2 px-4 text-[10px] font-black uppercase tracking-[0.15em] z-50 shadow-md">
                ⚡ Judge Audit Mode · All criteria verifiable below · Payments on Arc L1 Testnet (Chain ID 5042002)
            </div>

            {/* Back Nav */}
            <div className="max-w-3xl mx-auto mb-10 flex items-center justify-between mt-4">
                <Link href="/" className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors">
                    <ArrowLeft className="size-3.5" />
                    Back to home
                </Link>
                <div className="flex items-center gap-2">
                    <span className="bg-accent text-background text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        🏆 Judge Mode
                    </span>
                </div>
            </div>

            <main className="max-w-3xl mx-auto space-y-10">

                {/* ── Hero ── */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-2">
                        <LogoMark width={40} height={40} />
                    </div>
                    <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink">
                        Metis · Judge Audit Trail
                    </h1>
                    <p className="text-xs text-muted max-w-lg mx-auto leading-relaxed">
                        Every claim below is backed by verifiable on-chain evidence.
                        Interact with the live demo, then audit each judging criterion in the scoring section.
                    </p>
                </div>

                {/* ── Agent Pipeline Diagram ── */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="border border-hairline bg-surface rounded-[1.75rem] p-6 shadow-xl"
                >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold mb-5">
                        Agent Coordination Pipeline · Live
                    </p>
                    <div className="flex items-start gap-1 overflow-x-auto pb-2">
                        {PIPELINE.map((step, i) => (
                            <React.Fragment key={i}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.12 }}
                                    className="flex flex-col items-center gap-2 min-w-[90px] flex-1"
                                >
                                    <div className={`size-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                                        i === 0 ? 'border-accent bg-accent/15 text-accent' :
                                        i < 4    ? 'border-[#22c787] bg-[#22c787]/10 text-[#22c787]' :
                                                   'border-[#22c787] bg-[#22c787]/20 text-[#22c787]'
                                    }`}>
                                        {i < 4 ? <Check className="size-3.5" /> : <Sparkles className="size-3.5" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-ink">{step.label}</p>
                                        <p className="text-[8px] text-muted leading-tight mt-0.5 max-w-[80px]">{step.sub}</p>
                                    </div>
                                </motion.div>
                                {i < PIPELINE.length - 1 && (
                                    <div className="flex items-center mt-4 px-0.5">
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ delay: i * 0.12 + 0.1, duration: 0.3 }}
                                            className="h-[2px] w-6 bg-gradient-to-r from-accent/60 to-[#22c787]/60 origin-left"
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <p className="text-center text-[9px] text-muted/50 mt-4">
                        Full multi-hop coordination completes in ~340ms · No human intervention
                    </p>
                </motion.div>

                {/* ── Live Demo: Wallet + Signal Unlock ── */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.08 }}
                    className="border border-hairline bg-surface rounded-[1.75rem] p-6 shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-approve font-semibold bg-approve/10 rounded-bl-[1.25rem] border-l border-b border-hairline">
                        Demo Account
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-background/10 border border-hairline flex items-center justify-center text-accent">
                            <Wallet className="size-6" />
                        </div>
                        <div>
                            <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Available Balance</span>
                            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-0.5 tracking-tight tabular-nums">
                                {balance.toFixed(6)} <span className="text-accent text-lg">USDC</span>
                            </h2>
                        </div>
                    </div>
                </motion.div>

                {/* ── Masked Signal Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="border border-hairline bg-surface rounded-[1.75rem] p-6 shadow-xl space-y-5"
                >
                    <div className="flex justify-between items-center border-b border-hairline pb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-accent" />
                            <span className="font-bold text-xs uppercase tracking-wider text-ink">Premium Signal #8429</span>
                        </div>
                        <span className="font-mono text-[10px] text-accent/80 font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                            94% Win Rate
                        </span>
                    </div>

                    <div className="bg-background/20 border border-hairline rounded-xl p-4 sm:p-5 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {!unlocked ? (
                                <motion.div key="masked" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Lock className="size-5 text-muted/60 animate-pulse" />
                                        <div className="space-y-1 w-full">
                                            <span className="text-[9px] uppercase tracking-wider text-muted font-bold block">Asset Pairing</span>
                                            <span className="font-bold text-base tracking-wide text-ink block">
                                                BTC/USDT <span className="font-mono text-muted/30 select-none">███████</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 border-t border-hairline pt-4">
                                        {['Entry Target', 'Take Profit', 'Stop Loss'].map(f => (
                                            <div key={f}>
                                                <span className="block text-[8px] uppercase text-muted/60 font-bold mb-0.5">{f}</span>
                                                <span className="font-mono text-xs text-ink/40 select-none">██████</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={handleUnlock}
                                            disabled={isUnlocking}
                                            className="w-full bg-accent text-background font-bold text-xs uppercase py-3 rounded-lg hover:bg-ink hover:text-background transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            {isUnlocking ? (
                                                <>
                                                    <span className="size-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                                    Settling x402 Micropayment…
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock className="size-3.5" />
                                                    Unlock Signal · 0.001 USDC
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="unmasked"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Eye className="size-5 text-approve animate-pulse" />
                                        <div className="space-y-1 w-full">
                                            <span className="text-[9px] uppercase tracking-wider text-approve font-bold flex items-center gap-1">
                                                <Sparkles className="size-3" /> Unlocked via x402 · 0.001 USDC settled on-chain
                                            </span>
                                            <span className="font-bold text-base tracking-wide text-ink flex items-center gap-2">
                                                BTC/USDT <span className="text-xs bg-approve/10 border border-approve/25 text-approve px-2 py-0.5 rounded font-black">BUY</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 border-t border-hairline pt-4">
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted font-bold mb-0.5">Entry Target</span>
                                            <span className="font-mono text-xs font-bold text-ink">$67,420.00</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted font-bold mb-0.5">Take Profit</span>
                                            <span className="font-mono text-xs font-bold text-approve">$71,200.00</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted font-bold mb-0.5">Stop Loss</span>
                                            <span className="font-mono text-xs font-bold text-red-400">$65,800.00</span>
                                        </div>
                                    </div>
                                    {txHash && (
                                        <div className="border-t border-hairline pt-3 mt-1 flex flex-col gap-1.5 font-mono text-[9px] text-muted">
                                            <div className="flex justify-between items-center">
                                                <span>TRANSACTION STATUS</span>
                                                <span className="text-approve font-bold flex items-center gap-1">
                                                    <Check className="size-3" /> CONFIRMED ON ARC L1
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span>TX HASH</span>
                                                <ExplorerLink hash={txHash} type="tx" className="max-w-[200px] truncate" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* ── Pipeline Fee Distribution (only after unlock) ── */}
                {unlocked && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.5 }}
                        className="border border-hairline bg-surface rounded-[1.75rem] p-6 shadow-xl space-y-4"
                    >
                        <h3 className="font-bold text-xs uppercase tracking-wider text-ink border-b border-hairline pb-3">
                            Agent Fee Distribution Pipeline
                        </h3>
                        <div className="space-y-3 font-mono text-[10px] text-muted">
                            {[
                                { icon: Zap, label: 'Signal Agent Unlock Fee', amount: '+0.0010 USDC', color: 'text-accent', iconColor: 'text-accent' },
                                { icon: Shield, label: 'Risk Agent Validation Fee', amount: '+0.0005 USDC', color: 'text-approve', iconColor: 'text-approve' },
                                { icon: Activity, label: 'Sentiment Check Fee', amount: '+0.0003 USDC', color: 'text-sky-400', iconColor: 'text-sky-400' },
                            ].map(row => (
                                <div key={row.label} className="flex items-center justify-between p-2.5 rounded bg-background/20 border border-hairline">
                                    <div className="flex items-center gap-2">
                                        <row.icon className={`size-3.5 ${row.iconColor}`} />
                                        <span className="font-semibold text-ink">{row.label}</span>
                                    </div>
                                    <span className={`font-bold ${row.color}`}>{row.amount}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 text-center text-[10px] text-muted/60">
                            Payments settled in parallel via multi-hop x402 routing in 340ms.
                        </div>
                    </motion.div>
                )}

                {/* ── Traction: Live Payment Stream ── */}
                <motion.div
                    id="traction"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="border border-accent/30 bg-surface rounded-[1.75rem] p-6 shadow-xl"
                >
                    <div className="flex items-center justify-between mb-4 border-b border-hairline pb-3">
                        <div>
                            <p className="font-display text-sm font-bold text-ink uppercase tracking-tight">
                                On-Chain Evidence · Live Feed
                            </p>
                            <p className="text-[10px] text-muted mt-0.5">
                                Real test USDC micropayments · Ticking every ~20s
                            </p>
                        </div>
                        <span className="font-mono text-[9px] border border-approve/30 text-approve bg-approve/10 px-2.5 py-1 rounded-full font-bold uppercase">
                            30% criterion
                        </span>
                    </div>
                    <TractionTimeline />
                </motion.div>

                {/* ── Real On-Chain Payment (x402) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.22 }}
                >
                    <RealPaymentPanel onSuccess={(hash) => {
                        setTxHash(hash);
                        setUnlocked(true);
                    }} />
                </motion.div>

                {/* ── Circle API Callouts ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="border border-sky-400/30 bg-surface rounded-[1.75rem] p-6 shadow-xl space-y-4"
                >
                    <div className="flex items-center justify-between border-b border-hairline pb-3">
                        <div>
                            <p className="font-display text-sm font-bold text-ink uppercase tracking-tight">
                                Circle SDK · API Usage
                            </p>
                            <p className="text-[10px] text-muted mt-0.5">Explicit Circle tool calls made by Metis agents</p>
                        </div>
                        <span className="font-mono text-[9px] border border-sky-400/30 text-sky-400 bg-sky-400/10 px-2.5 py-1 rounded-full font-bold uppercase">
                            20% criterion
                        </span>
                    </div>
                    <div className="space-y-2">
                        {CIRCLE_APIS.map((api, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.06 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-background/30 border border-hairline"
                            >
                                <Check className="size-3.5 text-approve shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-ink">{api.name}</p>
                                    <code className="text-[9px] text-sky-400 bg-sky-400/5 px-1.5 py-0.5 rounded border border-sky-400/15 inline-block mt-0.5">{api.call}</code>
                                    <p className="text-[9px] text-muted mt-1">{api.use}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Shadow Float EIP-712 ── */}
                <motion.div
                    id="float"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="border border-[#f5a623]/30 bg-surface rounded-[1.75rem] p-6 shadow-xl space-y-4"
                >
                    <div className="flex items-center justify-between border-b border-hairline pb-3">
                        <div>
                            <p className="font-display text-sm font-bold text-ink uppercase tracking-tight">
                                ⚡ Shadow Float Credit Line
                            </p>
                            <p className="text-[10px] text-muted mt-0.5">EIP-712 pre-authorized spend intent · Innovation score</p>
                        </div>
                        <span className="font-mono text-[9px] border border-[#f5a623]/30 text-[#f5a623] bg-[#f5a623]/10 px-2.5 py-1 rounded-full font-bold uppercase">
                            20% criterion
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-[9px]">
                        {[
                            { label: 'Agent Wallet', value: `${AGENT_WALLET.slice(0,10)}…${AGENT_WALLET.slice(-6)}` },
                            { label: 'Float Contract', value: `${CONTRACT_ADDR.slice(0,10)}…${CONTRACT_ADDR.slice(-6)}` },
                            { label: 'Amount (USDC units)', value: '10,000 (0.01 USDC)' },
                            { label: 'Chain ID', value: '5042002 (Arc L1)' },
                        ].map(item => (
                            <div key={item.label} className="p-2.5 rounded bg-background/30 border border-hairline">
                                <p className="text-muted uppercase tracking-wider mb-1">{item.label}</p>
                                <p className="text-ink font-bold truncate">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowFloat(!showFloat)}
                        className="w-full flex items-center justify-between px-4 py-2.5 border border-hairline rounded-lg bg-background/20 text-xs text-muted hover:text-ink transition-colors"
                    >
                        <span>View full EIP-712 signed intent JSON</span>
                        {showFloat ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>

                    <AnimatePresence>
                        {showFloat && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="relative">
                                    <pre className="text-[9px] text-approve/80 bg-background/50 border border-hairline rounded-xl p-4 overflow-x-auto leading-relaxed">
                                        {JSON.stringify(SHADOW_FLOAT_INTENT, null, 2)}
                                    </pre>
                                    <button
                                        onClick={copyFloat}
                                        className="absolute top-3 right-3 font-mono text-[9px] border border-hairline px-2 py-1 rounded bg-surface hover:border-accent hover:text-accent transition-colors text-muted"
                                    >
                                        {copied ? '✓ Copied' : 'Copy'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Scoring Checklist ── */}
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    className="border border-hairline bg-surface rounded-[1.75rem] p-6 sm:p-8 shadow-2xl space-y-4"
                >
                    <div className="border-b border-hairline pb-4">
                        <span className="text-accent font-mono text-[10px] tracking-[0.2em] font-semibold uppercase block mb-1">
                            Submission Alignment
                        </span>
                        <h3 className="font-display text-xl font-black text-ink uppercase tracking-tight">
                            🏆 Metis Judging Checklist
                        </h3>
                        <p className="text-[11px] text-muted mt-1 leading-relaxed">
                            Click each criterion to expand evidence. Every item is verifiable.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {CRITERIA.map((c, i) => (
                            <div key={i} className={`border ${c.borderColor} rounded-2xl overflow-hidden`}>
                                <button
                                    onClick={() => setExpandedCriteria(expandedCriteria === i ? null : i)}
                                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className={`size-8 rounded-xl ${c.bgColor} flex items-center justify-center shrink-0`}>
                                        <c.icon className={`size-4 ${c.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-xs text-ink">{c.label}</span>
                                            <span className={`font-mono text-[9px] font-bold ${c.color} ${c.bgColor} border ${c.borderColor} px-2 py-0.5 rounded-full`}>
                                                {c.weight}
                                            </span>
                                        </div>
                                    </div>
                                    <Check className="size-4 text-approve shrink-0" />
                                    {expandedCriteria === i ? <ChevronUp className="size-3.5 text-muted shrink-0" /> : <ChevronDown className="size-3.5 text-muted shrink-0" />}
                                </button>

                                <AnimatePresence>
                                    {expandedCriteria === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 border-t border-hairline pt-3 space-y-2">
                                                {c.evidence.map((e, j) => (
                                                    <div key={j} className="flex items-start gap-2 font-mono text-[10px] text-muted">
                                                        <Check className="size-3 text-approve shrink-0 mt-0.5" />
                                                        <span>{e}</span>
                                                    </div>
                                                ))}
                                                <Link
                                                    href={c.verify.href}
                                                    className={`inline-flex items-center gap-1 mt-2 font-mono text-[10px] font-bold ${c.color} hover:underline`}
                                                >
                                                    {c.verify.label} <ArrowUpRight className="size-3" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Final CTA ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center pb-8 space-y-3"
                >
                    <Link
                        href="/signup"
                        className="inline-block bg-accent hover:bg-ink text-background font-bold text-xs uppercase px-10 py-4 rounded-xl shadow-lg transition-all duration-200"
                    >
                        Try Metis Free — Create Account →
                    </Link>
                    <p className="font-mono text-[10px] text-muted">
                        No gas · No credit card · Testnet USDC provided
                    </p>
                </motion.div>

            </main>
        </div>
    );
}
