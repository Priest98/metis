'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LogBadge = 'PAY' | 'REGIME' | 'BACKTEST' | 'RISK' | 'SIGNAL' | 'BLOCKED' | 'INFO' | 'ERR';

export interface LogEntry {
    id: string;
    ts: string;        // "14:32:01"
    badge: LogBadge;
    msg: string;
}

interface AgentLogProps {
    /** Inject new log entries from the parent (e.g. from demo-trigger response) */
    entries?: LogEntry[];
    /** If true, the log auto-generates demo entries on mount */
    autoDemo?: boolean;
    maxLines?: number;
    className?: string;
}

// ── Badge config ──────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<LogBadge, string> = {
    PAY:      'bg-[rgba(75,139,255,0.12)] text-[#6ba3ff] border border-[rgba(75,139,255,0.25)]',
    REGIME:   'bg-[rgba(215,255,62,0.10)] text-accent border border-[rgba(215,255,62,0.25)]',
    BACKTEST: 'bg-[rgba(34,199,135,0.10)] text-approve border border-[rgba(34,199,135,0.25)]',
    RISK:     'bg-[rgba(251,191,36,0.10)] text-[#fbbf24] border border-[rgba(251,191,36,0.20)]',
    SIGNAL:   'bg-[rgba(215,255,62,0.15)] text-accent border border-[rgba(215,255,62,0.30)]',
    BLOCKED:  'bg-[rgba(248,113,113,0.10)] text-block border border-[rgba(248,113,113,0.25)]',
    INFO:     'bg-surface text-muted border border-hairline',
    ERR:      'bg-[rgba(248,113,113,0.10)] text-block border border-[rgba(248,113,113,0.25)]',
};

// ── Demo data factory ─────────────────────────────────────────────────────────

function now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const DEMO_SEQUENCES: LogEntry[][] = [
    [
        { id: 'd1', ts: '', badge: 'PAY',      msg: 'x402 payment verified · $0.001 USDC · Arc L1 tx confirmed' },
        { id: 'd2', ts: '', badge: 'REGIME',   msg: 'BTCUSDT 4h → regime-detector: trending_bull · ADX 28.4' },
        { id: 'd3', ts: '', badge: 'BACKTEST', msg: 'momentum-breakout → 847 trades · Sharpe 1.84 · win rate 64%' },
        { id: 'd4', ts: '', badge: 'RISK',     msg: 'position sizing check → 2% rule ✓ · stop distance valid ✓' },
        { id: 'd5', ts: '', badge: 'SIGNAL',   msg: 'BTCUSDT LONG @ 67,420 · TP 71,200 · SL 65,800 · prob 87%' },
    ],
    [
        { id: 'e1', ts: '', badge: 'PAY',     msg: 'x402 payment verified · $0.001 USDC · Arc L1 tx confirmed' },
        { id: 'e2', ts: '', badge: 'REGIME',  msg: 'ETHUSDT 1h → regime-detector: ranging · bandwidth 3.2%' },
        { id: 'e3', ts: '', badge: 'RISK',    msg: 'risk-engine: ranging regime + low ADX → reduced position flag' },
        { id: 'e4', ts: '', badge: 'SIGNAL',  msg: 'ETHUSDT SHORT @ 3,240 · TP 3,010 · SL 3,380 · prob 71%' },
    ],
    [
        { id: 'f1', ts: '', badge: 'PAY',     msg: 'x402 payment verified · $0.001 USDC · Arc L1 tx confirmed' },
        { id: 'f2', ts: '', badge: 'REGIME',  msg: 'SOLUSDT 4h → regime-detector: volatile · VIX equivalent 42' },
        { id: 'f3', ts: '', badge: 'RISK',    msg: 'risk-engine: high volatility regime → position capped at 1%' },
        { id: 'f4', ts: '', badge: 'BLOCKED', msg: 'BLOCKED: 8% position size exceeds 1% cap · signal withheld' },
    ],
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentLog({
    entries: externalEntries,
    autoDemo = false,
    maxLines = 40,
    className = '',
}: AgentLogProps) {
    const [lines, setLines] = useState<LogEntry[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const seqRef = useRef(0);
    const lineRef = useRef(0);

    // Push one line at a time from the current demo sequence
    useEffect(() => {
        if (!autoDemo) return;

        const seq = DEMO_SEQUENCES[seqRef.current % DEMO_SEQUENCES.length];

        const push = () => {
            const entry = { ...seq[lineRef.current], ts: now(), id: `${Date.now()}-${lineRef.current}` };
            setLines(prev => {
                const next = [...prev, entry];
                return next.length > maxLines ? next.slice(next.length - maxLines) : next;
            });
            lineRef.current += 1;

            if (lineRef.current >= seq.length) {
                // Sequence done — wait then start the next one
                lineRef.current = 0;
                seqRef.current += 1;
                setTimeout(push, 4500);
            } else {
                setTimeout(push, 650 + Math.random() * 400);
            }
        };

        const timeout = setTimeout(push, 1200);
        return () => clearTimeout(timeout);
    }, [autoDemo, maxLines]);

    // Merge external entries
    useEffect(() => {
        if (!externalEntries?.length) return;
        setLines(prev => {
            const next = [...prev, ...externalEntries];
            return next.length > maxLines ? next.slice(next.length - maxLines) : next;
        });
    }, [externalEntries, maxLines]);

    // Always scroll to bottom
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [lines]);

    return (
        <div className={`flex flex-col overflow-hidden rounded-none border border-hairline bg-[#060910] ${className}`}>
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-hairline bg-surface px-4 py-2">
                <span className="size-2.5 rounded-full bg-block/60" />
                <span className="size-2.5 rounded-full bg-[#fbbf24]/60" />
                <span className="size-2.5 rounded-full bg-approve/60" />
                <span className="ml-3 font-mono text-[10px] text-muted tracking-widest">agent.log</span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-approve">
                    <span className="inline-block size-1.5 rounded-full bg-approve animate-pulse" />
                    live
                </span>
            </div>

            {/* Log body */}
            <div ref={containerRef} className="flex flex-col gap-0.5 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed"
                style={{ maxHeight: 260 }}>
                <AnimatePresence initial={false}>
                    {lines.map(line => (
                        <motion.div
                            key={line.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-start gap-2"
                        >
                            <span className="shrink-0 pt-px text-[10px] text-muted/50 tabular-nums">{line.ts}</span>
                            <span className={`shrink-0 rounded-sm px-1.5 py-px text-[9.5px] font-semibold ${BADGE_STYLES[line.badge]}`}>
                                {line.badge}
                            </span>
                            <span className="text-muted break-words">{line.msg}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {lines.length === 0 && (
                    <span className="text-muted/40 text-[11px] py-4 text-center">
                        Waiting for agent activity…
                    </span>
                )}
            </div>
        </div>
    );
}
