'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Zap, ExternalLink } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeaderEntry {
    rank: number;
    address: string;
    signals: number;
    usdc: number;
    lastSeen: string;
    badge: string;
    isAgent: boolean;
    delta: number; // signals gained in last tick
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_LEADERBOARD: Omit<LeaderEntry, 'delta'>[] = [
    {
        rank: 1,
        address: '0x4bDC17682C62E15Cb3296a5aA1D61d456597EBdc',
        signals: 312,
        usdc: 0.3120,
        lastSeen: '2s ago',
        badge: '🤖 Metis Agent',
        isAgent: true,
    },
    {
        rank: 2,
        address: '0x8ddf06fE8985988d3e0883F945E891BD57084937',
        signals: 87,
        usdc: 0.0870,
        lastSeen: '4m ago',
        badge: '⚡ Shadow Float',
        isAgent: true,
    },
    {
        rank: 3,
        address: '0x3A9fA2bC47d19F6c5D1C7293F8Ec21bF3219a45',
        signals: 54,
        usdc: 0.0540,
        lastSeen: '12m ago',
        badge: '👤 Trader',
        isAgent: false,
    },
    {
        rank: 4,
        address: '0x7fC8d3bE9142A7e26CF2d8F9bc10A55aD4E3F12',
        signals: 31,
        usdc: 0.0310,
        lastSeen: '28m ago',
        badge: '👤 Trader',
        isAgent: false,
    },
    {
        rank: 5,
        address: '0x1A4c9E7D0bF5839A6C2D4E8F1B3a5C7E9D0bF58',
        signals: 18,
        usdc: 0.0180,
        lastSeen: '1h ago',
        badge: '🌱 New',
        isAgent: false,
    },
];

function truncAddr(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function arcScanUrl(addr: string): string {
    return `https://scan.testnet.arc.network/address/${addr}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TractionLeaderboard() {
    const [board, setBoard] = useState<LeaderEntry[]>(
        SEED_LEADERBOARD.map(e => ({ ...e, delta: 0 }))
    );
    const [pulse, setPulse] = useState<string | null>(null);
    const [totalUSDC, setTotalUSDC] = useState(
        SEED_LEADERBOARD.reduce((s, e) => s + e.usdc, 0)
    );

    // Simulate live updates: occasionally bump a random wallet's count
    useEffect(() => {
        const id = setInterval(() => {
            if (Math.random() > 0.55) return; // ~45% chance each tick
            setBoard(prev => {
                const idx = Math.floor(Math.random() * prev.length);
                const gain = Math.ceil(Math.random() * 3);
                const next = prev.map((e, i) =>
                    i === idx
                        ? { ...e, signals: e.signals + gain, usdc: e.usdc + gain * 0.001, delta: gain, lastSeen: 'just now' }
                        : { ...e, delta: 0 }
                );
                // Re-sort
                next.sort((a, b) => b.signals - a.signals);
                next.forEach((e, i) => { e.rank = i + 1; });
                setPulse(next[idx]?.address ?? null);
                setTotalUSDC(s => s + gain * 0.001);
                setTimeout(() => setPulse(null), 1500);
                return next;
            });
        }, 7000);
        return () => clearInterval(id);
    }, []);

    const rankColor = (r: number) =>
        r === 1 ? 'text-yellow-400' : r === 2 ? 'text-zinc-300' : r === 3 ? 'text-orange-400' : 'text-muted';

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-1">
                        live · arc l1 testnet
                    </p>
                    <h3 className="font-display text-xl font-black text-ink uppercase tracking-tight">
                        Traction Leaderboard
                    </h3>
                </div>
                <div className="text-right">
                    <p className="font-mono text-[9px] text-muted uppercase">total settled</p>
                    <p className="font-mono text-base font-bold text-accent tabular-nums">
                        {totalUSDC.toFixed(4)} USDC
                    </p>
                </div>
            </div>

            {/* Board */}
            <div className="space-y-2">
                <AnimatePresence>
                    {board.map(entry => (
                        <motion.div
                            key={entry.address}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`border rounded-2xl p-4 flex items-center gap-4 transition-all duration-500 ${
                                pulse === entry.address
                                    ? 'border-accent/60 bg-accent/5 shadow-[0_0_20px_rgba(215,255,62,0.08)]'
                                    : entry.isAgent
                                    ? 'border-hairline bg-surface/80'
                                    : 'border-hairline bg-surface/40'
                            }`}
                        >
                            {/* Rank */}
                            <span className={`font-mono text-sm font-black w-6 shrink-0 text-center ${rankColor(entry.rank)}`}>
                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                            </span>

                            {/* Address + badge */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <a
                                        href={arcScanUrl(entry.address)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs font-semibold text-ink hover:text-accent transition-colors flex items-center gap-1"
                                    >
                                        {truncAddr(entry.address)}
                                        <ExternalLink size={9} className="text-muted" />
                                    </a>
                                    <span className="font-mono text-[9px] text-muted">{entry.badge}</span>
                                </div>
                                <p className="font-mono text-[9px] text-muted/60">{entry.lastSeen}</p>
                            </div>

                            {/* Signals + delta */}
                            <div className="text-right shrink-0">
                                <div className="flex items-center gap-1.5 justify-end">
                                    <p className="font-mono text-sm font-bold text-ink tabular-nums">
                                        {entry.signals}
                                    </p>
                                    <AnimatePresence>
                                        {entry.delta > 0 && (
                                            <motion.span
                                                key={`delta-${entry.address}-${entry.signals}`}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="font-mono text-[9px] text-approve font-semibold"
                                            >
                                                +{entry.delta}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <p className="font-mono text-[9px] text-accent tabular-nums">
                                    {entry.usdc.toFixed(4)} USDC
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-approve animate-pulse" />
                    <span className="font-mono text-[10px] text-muted">Updates in real-time</span>
                </div>
                <a
                    href="/faucet"
                    className="font-mono text-[10px] text-accent hover:underline"
                >
                    Get USDC &amp; join →
                </a>
            </div>
        </div>
    );
}
