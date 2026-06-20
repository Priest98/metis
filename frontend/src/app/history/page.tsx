'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import SignalProof, { buildProofSteps } from '@/components/SignalProof';
import {
    TrendingUp, TrendingDown, BarChart2, Clock, Shield, AlertTriangle
} from 'lucide-react';

type HistoryTab = 'signals' | 'backtests';

function DirectionBadge({ direction }: { direction: string }) {
    const isBuy = direction?.toUpperCase() === 'BUY' || direction?.toUpperCase() === 'LONG';
    return (
        <span className={`font-mono text-[10px] font-semibold px-2 py-px border ${
            isBuy
                ? 'text-approve border-approve/30 bg-[rgba(34,199,135,0.08)]'
                : 'text-block border-block/30 bg-[rgba(248,113,113,0.08)]'
        }`}>
            {direction?.toUpperCase() ?? '—'}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        active:    'text-accent border-accent/30 bg-[rgba(215,255,62,0.08)]',
        completed: 'text-approve border-approve/30 bg-[rgba(34,199,135,0.08)]',
        running:   'text-[#fbbf24] border-[rgba(251,191,36,0.30)] bg-[rgba(251,191,36,0.08)]',
        failed:    'text-block border-block/30 bg-[rgba(248,113,113,0.08)]',
    };
    return (
        <span className={`font-mono text-[10px] px-2 py-px border ${map[status] ?? 'text-muted border-hairline'}`}>
            {status ?? '—'}
        </span>
    );
}

export default function HistoryPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<HistoryTab>('signals');
    const [signals, setSignals] = useState<any[]>([]);
    const [backtests, setBacktests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            api.get('/signals/history?limit=50').then(r => r.data).catch(() => []),
            api.get('/backtests/?limit=50').then(r => r.data).catch(() => []),
        ]).then(([sigs, bts]) => {
            setSignals(sigs);
            setBacktests(bts);
        }).finally(() => setLoading(false));
    }, [user]);

    const easeCurve: [number, number, number, number] = [0.16, 1, 0.3, 1];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-hairline border-b-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen px-5 py-8 sm:px-8 max-w-6xl mx-auto">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: easeCurve }}
                className="mb-10"
            >
                <p className="eyebrow mb-3">audit trail</p>
                <h1 className="font-display text-3xl font-semibold text-ink">History</h1>
                <p className="font-mono text-xs text-muted mt-2">
                    Every signal issued, every backtest run — with full proof of the agent pipeline.
                </p>
            </motion.div>

            {/* Tab nav */}
            <div className="flex gap-6 border-b border-hairline mb-8">
                {(['signals', 'backtests'] as HistoryTab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`font-mono text-xs uppercase tracking-wider pb-3 border-b-2 transition-all ${
                            tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        {t} ({t === 'signals' ? signals.length : backtests.length})
                    </button>
                ))}
            </div>

            {/* ── Signals tab ─────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {tab === 'signals' && (
                    <motion.div
                        key="signals"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                    >
                        {signals.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-hairline font-mono text-xs text-muted">
                                No signals yet. Generate one from the dashboard.
                            </div>
                        ) : signals.map(sig => (
                            <div
                                key={sig.id}
                                className="border border-hairline bg-surface hover:border-white/15 transition-colors"
                            >
                                {/* Row */}
                                <button
                                    onClick={() => setExpandedId(expandedId === sig.id ? null : sig.id)}
                                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                                >
                                    <TrendingUp size={14} className="text-muted shrink-0" />
                                    <span className="font-display text-sm font-semibold text-ink min-w-[90px]">
                                        {sig.symbol}
                                    </span>
                                    <DirectionBadge direction={sig.direction} />
                                    <StatusBadge status={sig.status} />
                                    {sig.signal_score > 0 && (
                                        <span className="font-mono text-xs text-muted ml-auto">
                                            score <span className="text-ink">{sig.signal_score}/10</span>
                                        </span>
                                    )}
                                    <span className="font-mono text-[10px] text-muted/50 shrink-0">
                                        {sig.created_at
                                            ? new Date(sig.created_at).toLocaleDateString()
                                            : ''}
                                    </span>
                                </button>

                                {/* Expanded proof */}
                                <AnimatePresence>
                                    {expandedId === sig.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden border-t border-hairline"
                                        >
                                            <div className="grid sm:grid-cols-2 gap-px bg-hairline">
                                                {/* Proof timeline */}
                                                <SignalProof
                                                    symbol={sig.symbol}
                                                    timeframe={sig.timeframe}
                                                    signalId={sig.id?.toString().slice(0, 8)}
                                                    steps={buildProofSteps(sig)}
                                                    className="border-0"
                                                />
                                                {/* Signal details */}
                                                <div className="bg-surface p-5">
                                                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">signal parameters</p>
                                                    {sig.gated ? (
                                                        <p className="font-mono text-xs text-muted/60 py-4 text-center border border-dashed border-hairline">
                                                            🔒 Pay $0.001 USDC to unlock entry / SL / TP
                                                        </p>
                                                    ) : (
                                                        <dl className="font-mono text-xs space-y-2">
                                                            {[
                                                                { k: 'Entry', v: sig.entry_price },
                                                                { k: 'Stop Loss', v: sig.stop_loss },
                                                                { k: 'Take Profit', v: sig.take_profit },
                                                                { k: 'Probability', v: sig.probability_score ? `${sig.probability_score}%` : null },
                                                                { k: 'Position Size', v: sig.position_sizing ? `${sig.position_sizing}%` : null },
                                                            ].filter(r => r.v).map(r => (
                                                                <div key={r.k} className="flex justify-between gap-4">
                                                                    <dt className="text-muted">{r.k}</dt>
                                                                    <dd className="text-ink tabular-nums">{String(r.v)}</dd>
                                                                </div>
                                                            ))}
                                                        </dl>
                                                    )}
                                                    {sig.trade_explanation && !sig.gated && (
                                                        <p className="mt-4 font-mono text-[10px] text-muted leading-relaxed border-t border-hairline pt-3">
                                                            {sig.trade_explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── Backtests tab ──────────────────────────────────────────────── */}
                {tab === 'backtests' && (
                    <motion.div
                        key="backtests"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                    >
                        {backtests.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-hairline font-mono text-xs text-muted">
                                No backtests yet. Create a strategy and run a backtest.
                            </div>
                        ) : backtests.map(bt => {
                            const totalReturn = bt.metrics?.total_return ?? bt.total_return ?? 0;
                            const isPos = totalReturn >= 0;
                            return (
                                <div key={bt.id} className="border border-hairline bg-surface">
                                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                        <BarChart2 size={14} className="text-muted shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-display text-sm font-semibold text-ink">
                                                    {bt.strategy_id?.toString().slice(0, 8) ?? 'Strategy'}
                                                </span>
                                                <StatusBadge status={bt.metrics?.status ?? 'completed'} />
                                                <span className={`font-mono text-xs font-semibold ml-auto ${isPos ? 'text-approve' : 'text-block'}`}>
                                                    {isPos ? '+' : ''}{totalReturn.toFixed(2)}%
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                {[
                                                    { label: 'trades',      value: bt.metrics?.total_trades ?? 0 },
                                                    { label: 'win rate',    value: bt.metrics?.win_rate != null ? `${Number(bt.metrics.win_rate).toFixed(1)}%` : '—' },
                                                    { label: 'sharpe',      value: bt.metrics?.sharpe_ratio != null ? Number(bt.metrics.sharpe_ratio).toFixed(2) : '—' },
                                                    { label: 'drawdown',    value: bt.metrics?.max_drawdown != null ? `${Number(bt.metrics.max_drawdown).toFixed(1)}%` : '—', negative: true },
                                                    { label: 'prof. factor', value: bt.metrics?.profit_factor != null ? Number(bt.metrics.profit_factor).toFixed(2) : '—' },
                                                ].map(m => (
                                                    <div key={m.label} className="bg-background p-2.5">
                                                        <p className="font-mono text-[9px] uppercase text-muted">{m.label}</p>
                                                        <p className={`font-display text-base font-semibold ${m.negative ? 'text-block' : 'text-ink'}`}>
                                                            {String(m.value)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="font-mono text-[9px] text-muted/40 px-5 py-2 border-t border-hairline">
                                        ID: {bt.id}
                                    </p>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
