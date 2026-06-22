'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Shield, Brain, TrendingUp, Activity } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TxEvent {
    id: string;
    ts: string;
    hash: string;
    from: string;
    to: string;
    amount: string;
    type: 'signal_unlock' | 'risk_fee' | 'sentiment_fee' | 'strategy_fee' | 'reward';
    label: string;
    asset?: string;
    direction?: 'BUY' | 'SELL';
    status: 'Pending' | 'Finalized';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AGENTS = [
    { name: 'SignalAgent',    icon: Zap,        color: '#D7FF3E', bg: 'rgba(215,255,62,0.10)'   },
    { name: 'RiskAgent',     icon: Shield,     color: '#22c787', bg: 'rgba(34,199,135,0.10)'  },
    { name: 'SentimentAgent',icon: Brain,      color: '#6ba3ff', bg: 'rgba(75,139,255,0.10)'  },
    { name: 'StrategyAgent', icon: TrendingUp, color: '#f5a623', bg: 'rgba(245,166,35,0.10)'  },
];

const TX_TEMPLATES = [
    { from: 'StrategyAgent', to: 'SignalAgent',     amount: '0.001000', type: 'signal_unlock' as const, label: 'Signal unlock fee',      asset: '{sym}', direction: '{dir}' as any },
    { from: 'StrategyAgent', to: 'RiskAgent',       amount: '0.000500', type: 'risk_fee' as const,      label: 'Risk validation fee',    asset: '{sym}' },
    { from: 'StrategyAgent', to: 'SentimentAgent',  amount: '0.000300', type: 'sentiment_fee' as const, label: 'Sentiment context fee',  asset: '{sym}' },
    { from: 'SignalAgent',   to: 'StrategyAgent',   amount: '0.000200', type: 'reward' as const,        label: 'Accuracy reward share',  asset: '{sym}' },
    { from: 'RiskAgent',     to: 'StrategyAgent',   amount: '0.000150', type: 'reward' as const,        label: 'Risk model royalty',     asset: '{sym}' },
];

const ASSETS   = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const DIRS     = ['BUY', 'SELL'] as const;

function randomHex(n: number) {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function nowTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function makeTx(): TxEvent {
    const tpl    = TX_TEMPLATES[Math.floor(Math.random() * TX_TEMPLATES.length)];
    const asset  = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    const dir    = DIRS[Math.floor(Math.random() * DIRS.length)];
    return {
        id:        Math.random().toString(36).slice(2),
        ts:        nowTime(),
        hash:      '0xarc' + randomHex(16),
        from:      tpl.from,
        to:        tpl.to,
        amount:    tpl.amount,
        type:      tpl.type,
        label:     tpl.label,
        asset:     tpl.asset ? asset : undefined,
        direction: tpl.direction ? dir : undefined,
        status:    'Finalized',
    };
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function AgentChip({ name }: { name: string }) {
    const agent = AGENTS.find(a => a.name === name) || AGENTS[0];
    const Icon  = agent.icon;
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold shrink-0"
            style={{ background: agent.bg, color: agent.color, border: `1px solid ${agent.color}30` }}
        >
            <Icon className="w-2.5 h-2.5" />
            {name}
        </span>
    );
}

function AmountPill({ amount }: { amount: string }) {
    return (
        <span className="font-mono text-[11px] font-bold text-[#D7FF3E] bg-[rgba(215,255,62,0.08)] border border-[rgba(215,255,62,0.2)] px-2 py-0.5 rounded-full shrink-0">
            +{amount} <span className="text-muted font-normal">USDC</span>
        </span>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

const SEED_TXS: TxEvent[] = Array.from({ length: 4 }, (_, i) => ({
    ...makeTx(),
    ts: `${new Date(Date.now() - (4 - i) * 8000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
    status: 'Finalized',
}));

export default function LivePaymentFeed() {
    const [txs,          setTxs]          = useState<TxEvent[]>(SEED_TXS);
    const [totalUsdc,    setTotalUsdc]    = useState(() =>
        SEED_TXS.reduce((s, t) => s + parseFloat(t.amount), 0)
    );
    const [pulse,        setPulse]        = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const delay = 3000 + Math.random() * 2000;

        intervalRef.current = setInterval(() => {
            const tx = makeTx();
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
            setTxs(prev => [tx, ...prev].slice(0, 8));
            setTotalUsdc(prev => parseFloat((prev + parseFloat(tx.amount)).toFixed(6)));
        }, delay);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    return (
        <div className="border border-white/10 bg-[#182030] rounded-[1.75rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                    <div className={`size-2 rounded-full bg-[#D7FF3E] transition-all duration-300 ${pulse ? 'animate-ping' : 'animate-pulse'}`} />
                    <span className="font-display text-sm font-semibold text-ink">ARC L1 · Agent Transaction Feed</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted">
                        Total: <span className="text-[#D7FF3E] font-bold">{totalUsdc.toFixed(6)} USDC</span>
                    </span>
                    <span className="flex items-center gap-1 bg-approve/10 border border-approve/20 px-2 py-0.5 rounded-full">
                        <Activity className="w-2.5 h-2.5 text-approve" />
                        <span className="font-mono text-[9px] font-bold text-approve uppercase tracking-wider">Live</span>
                    </span>
                </div>
            </div>

            {/* TX List */}
            <div className="divide-y divide-white/[0.04]">
                <AnimatePresence initial={false}>
                    {txs.map((tx) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, y: -8, backgroundColor: 'rgba(215,255,62,0.04)' }}
                            animate={{ opacity: 1, y: 0,  backgroundColor: 'rgba(0,0,0,0)' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="px-5 py-3 flex flex-col gap-1.5"
                        >
                            {/* Row 1: from → to + amount */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <AgentChip name={tx.from} />
                                <ArrowRight className="w-3 h-3 text-muted shrink-0" />
                                <AgentChip name={tx.to} />
                                <div className="ml-auto">
                                    <AmountPill amount={tx.amount} />
                                </div>
                            </div>

                            {/* Row 2: label + asset + hash */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] text-muted">{tx.label}</span>
                                {tx.asset && (
                                    <span className="font-mono text-[10px] font-semibold text-ink/60 bg-white/5 px-1.5 rounded">
                                        {tx.asset.replace('USDT','')}
                                        {tx.direction && (
                                            <span className={tx.direction === 'BUY' ? ' text-approve' : ' text-block'}>
                                                {' '}{tx.direction}
                                            </span>
                                        )}
                                    </span>
                                )}
                                <span className="ml-auto font-mono text-[9px] text-muted/40 truncate max-w-[110px]">{tx.hash}</span>
                                <span className="font-mono text-[9px] text-approve/70 bg-approve/5 border border-approve/15 px-1.5 py-px rounded-full shrink-0">
                                    {tx.status}
                                </span>
                            </div>

                            {/* Row 3: timestamp */}
                            <span className="font-mono text-[9px] text-muted/40">{tx.ts}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
