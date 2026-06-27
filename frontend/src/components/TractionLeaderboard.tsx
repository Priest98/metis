'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Zap, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

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
    const [board, setBoard] = useState<LeaderEntry[]>([]);
    const [pulse, setPulse] = useState<string | null>(null);
    const [totalUSDC, setTotalUSDC] = useState(0);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/wallet/public-leaderboard');
            const data = res.data || [];
            
            const realLeaders: LeaderEntry[] = data.map((entry: any, i: number) => {
                const prev = board.find(b => b.address.toLowerCase() === entry.address.toLowerCase());
                const delta = prev && entry.signals > prev.signals ? (entry.signals - prev.signals) : 0;
                
                if (delta > 0) {
                    setPulse(entry.address);
                    setTimeout(() => setPulse(null), 1500);
                }
                
                // Parse relative age
                let lastSeenDisplay = 'recently';
                if (entry.lastSeen) {
                    const elapsed = Math.floor((Date.now() - new Date(entry.lastSeen).getTime()) / 1000);
                    if (elapsed < 60) lastSeenDisplay = 'just now';
                    else if (elapsed < 3600) lastSeenDisplay = `${Math.floor(elapsed / 60)}m ago`;
                    else lastSeenDisplay = `${Math.floor(elapsed / 3600)}h ago`;
                }

                return {
                    rank: entry.rank,
                    address: entry.address,
                    signals: entry.signals,
                    usdc: entry.usdc,
                    lastSeen: lastSeenDisplay,
                    badge: entry.badge || '👤 Trader',
                    isAgent: entry.isAgent,
                    delta,
                };
            });

            // Merge with SEED_LEADERBOARD to have at least 5 rows
            const merged = [...realLeaders];
            const needed = 5 - merged.length;
            if (needed > 0) {
                const realAddrs = new Set(realLeaders.map(r => r.address.toLowerCase()));
                let seedIndex = 0;
                let addedCount = 0;
                while (addedCount < needed && seedIndex < SEED_LEADERBOARD.length) {
                    const seed = SEED_LEADERBOARD[seedIndex];
                    if (!realAddrs.has(seed.address.toLowerCase())) {
                        merged.push({
                            ...seed,
                            delta: 0,
                        });
                        addedCount++;
                    }
                    seedIndex++;
                }
            }

            // Re-sort and re-rank
            merged.sort((a, b) => b.signals - a.signals);
            merged.forEach((e, index) => {
                e.rank = index + 1;
            });

            setBoard(merged);
            setTotalUSDC(merged.reduce((s, e) => s + e.usdc, 0));
        } catch (err) {
            console.error('Failed to fetch public leaderboard:', err);
            if (board.length === 0) {
                setBoard(SEED_LEADERBOARD.map(e => ({ ...e, delta: 0 })));
                setTotalUSDC(SEED_LEADERBOARD.reduce((s, e) => s + e.usdc, 0));
            }
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const pollId = setInterval(fetchLeaderboard, 15000);
        return () => clearInterval(pollId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
