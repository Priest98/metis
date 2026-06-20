'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
    Copy, Check, ExternalLink, RefreshCw, Zap, CircleDollarSign,
    Wallet, ArrowRight, CheckCircle2, Clock, AlertTriangle, Play
} from 'lucide-react';

// ── Step definition ───────────────────────────────────────────────────────────

type StepId = 'copy' | 'faucet' | 'confirm' | 'signal';

interface Step {
    id: StepId;
    n: string;
    label: string;
    desc: string;
}

const STEPS: Step[] = [
    {
        id: 'copy',
        n: '01',
        label: 'Copy your testnet wallet address',
        desc: 'Your embedded wallet is generated automatically when you sign up. Copy the address below.',
    },
    {
        id: 'faucet',
        n: '02',
        label: 'Claim USDC from the Arc testnet faucet',
        desc: 'Paste your address into the Circle faucet and select Arc Testnet to receive free USDC.',
    },
    {
        id: 'confirm',
        n: '03',
        label: 'Confirm balance is on-chain',
        desc: 'After claiming, click "Refresh Balance" to pull your real on-chain USDC from Arc.',
    },
    {
        id: 'signal',
        n: '04',
        label: 'Unlock a signal for $0.001 USDC',
        desc: 'Head to the dashboard, pick any signal, and pay with your testnet funds.',
    },
];

// Faucet links (Arc testnet compatible)
const FAUCETS = [
    {
        name: 'Circle USDC Faucet',
        url: 'https://faucet.circle.com',
        note: 'Select "Arc Testnet" • Receive 10 USDC',
        primary: true,
    },
    {
        name: 'Arc Testnet Faucet',
        url: 'https://faucet.testnet.arc.network',
        note: 'Native gas token for transaction fees',
        primary: false,
    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function FaucetPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [walletAddress, setWalletAddress] = useState('');
    const [balance, setBalance]             = useState<number | null>(null);
    const [copied, setCopied]               = useState(false);
    const [refreshing, setRefreshing]       = useState(false);
    const [activeStep, setActiveStep]       = useState<StepId>('copy');
    const [prevBalance, setPrevBalance]     = useState<number | null>(null);
    const [balanceJumped, setBalanceJumped] = useState(false);
    const [pollingActive, setPollingActive] = useState(false);
    const [agents, setAgents]               = useState<any[]>([]);
    const [copiedAgentId, setCopiedAgentId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    // Fetch wallet on mount
    const fetchWallet = useCallback(async () => {
        try {
            const res = await api.get('/wallet/balance');
            setWalletAddress(res.data.wallet_address || '');
            const newBal = res.data.wallet_balance ?? 0;
            setBalance(prev => {
                if (prev !== null && newBal > prev) {
                    setBalanceJumped(true);
                    setTimeout(() => setBalanceJumped(false), 2500);
                }
                setPrevBalance(prev);
                return newBal;
            });
        } catch {
            // Fallback to /wallet/me if /wallet/balance fails
            try {
                const res = await api.get('/wallet/me');
                setWalletAddress(res.data.wallet_address || '');
                setBalance(res.data.wallet_balance ?? 0);
            } catch {/* silently fail */}
        }
    }, []);


    const fetchAgents = useCallback(async () => {
        try {
            const res = await api.get('/wallet/agents');
            setAgents(res.data || []);
        } catch (err) {
            console.error('Failed to fetch agents on faucet page', err);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchWallet();
            fetchAgents();
        }
    }, [user, fetchWallet, fetchAgents]);

    const handleCopyAgent = async (agentId: string, address: string) => {
        await navigator.clipboard.writeText(address);
        setCopiedAgentId(agentId);
        setTimeout(() => setCopiedAgentId(null), 2000);
    };

    // Polling: auto-refresh every 15s while user is on the faucet step
    useEffect(() => {
        if (!pollingActive) return;
        const id = setInterval(fetchWallet, 15000);
        return () => clearInterval(id);
    }, [pollingActive, fetchWallet]);

    const handleCopy = async () => {
        if (!walletAddress) return;
        await navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setActiveStep('faucet');
        setPollingActive(true);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchWallet();
        setRefreshing(false);
        if (balance && balance > 0) setActiveStep('signal');
        else setActiveStep('confirm');
    };

    const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-hairline border-b-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen px-5 py-10 sm:px-8 max-w-4xl mx-auto">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease }}
                className="mb-12"
            >
                <p className="eyebrow mb-3">testnet setup</p>
                <h1 className="font-display text-3xl font-semibold text-ink">
                    Get Testnet Funds & Try the Platform
                </h1>
                <p className="font-mono text-xs text-muted mt-2 max-w-xl">
                    Claim free USDC from the Arc testnet faucet, then use it to pay{' '}
                    <span className="text-accent">$0.001 USDC</span> per signal — exactly like production, but with free money.
                </p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

                {/* ── Left: Step-by-step ──────────────────────────────── */}
                <div className="space-y-3">

                    {/* Step 1 — Copy address */}
                    <StepCard
                        step={STEPS[0]}
                        active={activeStep === 'copy'}
                        done={activeStep !== 'copy'}
                    >
                        <div className="mt-4 space-y-3">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Your Arc testnet wallet</p>
                            <div className="flex items-center gap-2 border border-hairline bg-background p-3">
                                <span className="font-mono text-xs text-ink flex-1 truncate select-all">
                                    {walletAddress || 'Loading…'}
                                </span>
                                <button
                                    onClick={handleCopy}
                                    disabled={!walletAddress}
                                    className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 bg-accent text-background hover:bg-white transition-colors disabled:opacity-40 shrink-0"
                                >
                                    {copied ? <Check size={11} /> : <Copy size={11} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <p className="font-mono text-[10px] text-muted">
                                This is the wallet the platform uses to pay for signals on-chain.
                            </p>
                            {agents.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-hairline space-y-3">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">AI Agent Wallets (Optional)</p>
                                    <p className="font-mono text-[10px] text-muted leading-relaxed">
                                        You can also copy your AI Agent&apos;s wallet address to claim faucet funds directly to it:
                                    </p>
                                    <div className="space-y-2">
                                        {agents.map(a => (
                                            <div key={a.id} className="flex items-center gap-2 border border-hairline bg-surface p-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-[10px] font-bold text-ink truncate">{a.name}</p>
                                                    <p className="font-mono text-[9px] text-muted truncate">{a.wallet_address}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleCopyAgent(a.id, a.wallet_address)}
                                                    className="flex items-center gap-1 font-mono text-[9px] px-2.5 py-1 bg-background border border-hairline text-ink hover:text-accent hover:border-accent transition-colors shrink-0"
                                                >
                                                    {copiedAgentId === a.id ? <Check size={10} /> : <Copy size={10} />}
                                                    {copiedAgentId === a.id ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </StepCard>

                    {/* Step 2 — Faucet */}
                    <StepCard
                        step={STEPS[1]}
                        active={activeStep === 'faucet'}
                        done={activeStep === 'confirm' || activeStep === 'signal'}
                    >
                        <div className="mt-4 space-y-3">
                            {FAUCETS.map(f => (
                                <a
                                    key={f.name}
                                    href={f.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveStep('confirm')}
                                    className={`flex items-center justify-between gap-4 border p-4 transition-colors group ${
                                        f.primary
                                            ? 'border-accent/40 bg-[rgba(215,255,62,0.04)] hover:border-accent/70'
                                            : 'border-hairline bg-surface hover:border-white/20'
                                    }`}
                                >
                                    <div>
                                        <p className={`font-mono text-xs font-semibold ${f.primary ? 'text-accent' : 'text-ink'}`}>
                                            {f.name}
                                        </p>
                                        <p className="font-mono text-[10px] text-muted mt-0.5">{f.note}</p>
                                    </div>
                                    <ExternalLink size={13} className="text-muted group-hover:text-ink transition-colors shrink-0" />
                                </a>
                            ))}
                            <div className="border border-dashed border-hairline p-3">
                                <p className="font-mono text-[10px] text-muted leading-relaxed">
                                    💡 <strong className="text-ink">Tip:</strong> After pasting your address and clicking &quot;Send&quot;, wait ~10–30 seconds for the transaction to confirm. Then come back and hit &quot;Refresh Balance&quot; below.
                                </p>
                            </div>
                        </div>
                    </StepCard>

                    {/* Step 3 — Confirm balance */}
                    <StepCard
                        step={STEPS[2]}
                        active={activeStep === 'confirm'}
                        done={activeStep === 'signal'}
                    >
                        <div className="mt-4 space-y-3">
                            {/* Live balance display */}
                            <div className={`border p-4 transition-all duration-500 ${
                                balanceJumped
                                    ? 'border-approve/60 bg-[rgba(34,199,135,0.08)]'
                                    : 'border-hairline bg-background'
                            }`}>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">On-chain USDC balance</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`font-display text-4xl font-bold tabular-nums transition-colors ${
                                        balanceJumped ? 'text-approve' : 'text-ink'
                                    }`}>
                                        {balance !== null ? balance.toFixed(4) : '—'}
                                    </span>
                                    <span className="font-mono text-sm text-accent font-semibold">USDC</span>
                                    {balanceJumped && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="font-mono text-[10px] text-approve"
                                        >
                                            ✓ Funds received!
                                        </motion.span>
                                    )}
                                </div>
                                {pollingActive && !balanceJumped && (
                                    <p className="font-mono text-[9px] text-muted mt-1 flex items-center gap-1">
                                        <span className="inline-block size-1 rounded-full bg-accent animate-pulse" />
                                        Auto-refreshing every 15s…
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 font-mono text-xs border border-hairline px-4 py-2.5 text-ink hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                            >
                                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                                {refreshing ? 'Refreshing…' : 'Refresh Balance'}
                            </button>

                            {balance !== null && balance > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 font-mono text-[10px] text-approve"
                                >
                                    <CheckCircle2 size={12} />
                                    Balance confirmed on Arc testnet — you&apos;re ready to test!
                                </motion.div>
                            )}
                        </div>
                    </StepCard>

                    {/* Step 4 — Use signal */}
                    <StepCard
                        step={STEPS[3]}
                        active={activeStep === 'signal'}
                        done={false}
                    >
                        <div className="mt-4 space-y-3">
                            <p className="font-mono text-xs text-muted leading-relaxed">
                                Your wallet now has real testnet USDC. Every signal unlock costs exactly{' '}
                                <span className="text-accent font-semibold">$0.001 USDC</span> — verified on Arc L1 via HTTP 402.
                            </p>
                            <div className="grid grid-cols-3 gap-px bg-hairline border border-hairline">
                                {[
                                    { label: 'Signal cost', value: '$0.001 USDC' },
                                    { label: 'Your balance', value: balance !== null ? `$${balance.toFixed(3)}` : '—' },
                                    { label: 'Signals available', value: balance !== null ? Math.floor(balance / 0.001).toLocaleString() : '—' },
                                ].map(m => (
                                    <div key={m.label} className="bg-surface p-3">
                                        <p className="font-mono text-[9px] uppercase text-muted">{m.label}</p>
                                        <p className="font-display text-base font-semibold text-ink">{m.value}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-2 font-mono bg-ink text-background px-5 py-3 text-xs font-semibold hover:bg-accent transition-colors"
                            >
                                <Play size={12} />
                                Go to Dashboard → Unlock Signals
                            </button>
                        </div>
                    </StepCard>
                </div>

                {/* ── Right: Status sidebar ────────────────────────────── */}
                <div className="space-y-4 lg:sticky lg:top-24 self-start">

                    {/* Checklist */}
                    <div className="border border-hairline bg-surface p-5">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-4">Setup checklist</p>
                        <div className="space-y-3">
                            {[
                                { label: 'Wallet created', done: !!walletAddress },
                                { label: 'Address copied', done: activeStep !== 'copy' },
                                { label: 'Faucet opened', done: activeStep === 'confirm' || activeStep === 'signal' },
                                { label: 'USDC confirmed on-chain', done: (balance ?? 0) > 0 },
                                { label: 'Ready to pay for signals', done: (balance ?? 0) >= 0.001 },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2.5">
                                    <span className={item.done ? 'text-approve' : 'text-muted/30'}>
                                        {item.done ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                    </span>
                                    <span className={`font-mono text-[11px] ${item.done ? 'text-ink' : 'text-muted/50'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Current wallet card */}
                    <div className="border border-hairline bg-surface p-5">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Your testnet wallet</p>
                        <div className="space-y-2">
                            <div>
                                <p className="font-mono text-[9px] text-muted">Address</p>
                                <p className="font-mono text-[10px] text-ink break-all">{walletAddress || '—'}</p>
                            </div>
                            <div>
                                <p className="font-mono text-[9px] text-muted">Balance</p>
                                <p className="font-display text-xl font-semibold text-ink">
                                    {balance !== null ? `${balance.toFixed(4)} USDC` : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="font-mono text-[9px] text-muted">Network</p>
                                <p className="font-mono text-[10px] text-accent">Arc L1 Testnet</p>
                            </div>
                        </div>

                        {walletAddress && (
                            <a
                                href={`https://testnet.arcscan.app/address/${walletAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 flex items-center gap-1.5 font-mono text-[9px] text-muted hover:text-accent transition-colors"
                            >
                                View on ArcScan <ExternalLink size={9} />
                            </a>
                        )}
                    </div>

                    {/* Signal math */}
                    {(balance ?? 0) > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-accent/30 bg-[rgba(215,255,62,0.04)] p-5"
                        >
                            <p className="font-mono text-[9px] uppercase tracking-widest text-accent mb-3">Signal capacity</p>
                            <p className="font-display text-3xl font-bold text-ink">
                                {Math.floor((balance ?? 0) / 0.001).toLocaleString()}
                            </p>
                            <p className="font-mono text-[10px] text-muted mt-1">signals you can unlock right now</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── StepCard sub-component ────────────────────────────────────────────────────

function StepCard({
    step, active, done, children
}: {
    step: Step;
    active: boolean;
    done: boolean;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            animate={{
                borderColor: active
                    ? 'rgba(215,255,62,0.35)'
                    : done
                    ? 'rgba(34,199,135,0.25)'
                    : 'var(--color-hairline)',
            }}
            transition={{ duration: 0.3 }}
            className="border bg-surface p-5 transition-colors"
        >
            <div className="flex items-start gap-4">
                <span className={`font-mono text-xl font-bold shrink-0 leading-none mt-px ${
                    done ? 'text-approve' : active ? 'text-accent' : 'text-muted/30'
                }`}>
                    {done ? '✓' : step.n}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={`font-display text-sm font-semibold leading-snug ${
                        active ? 'text-ink' : done ? 'text-muted' : 'text-muted/50'
                    }`}>
                        {step.label}
                    </p>
                    {(active || done) && (
                        <p className="font-mono text-[11px] text-muted mt-1 leading-relaxed">{step.desc}</p>
                    )}
                    <AnimatePresence>
                        {active && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {children}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
