'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, Shield, Brain, BarChart2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

interface AgentRecord {
    id: string;
    name: string;
    type: 'Signal' | 'Risk' | 'Sentiment' | 'Strategy' | 'Scanner';
    earned: number;
    winRate: number;
    totalSignals: number;
    reputation: number;
    history: number[];   // last 10 earning events (USDC)
    address: string;
    desc: string;
}

// ── Static seed data ──────────────────────────────────────────────────────────

const SEED_AGENTS: AgentRecord[] = [
    {
        id: '5', name: 'Arbitrage Strategy Agent', type: 'Strategy', earned: 22.40, winRate: 88, totalSignals: 540,
        reputation: 95, address: '0x991b2c40381f9a2b8e0c',
        history: [2.1, 2.8, 1.9, 3.2, 2.4, 2.7, 1.8, 2.2, 2.5, 2.7],
        desc: 'Coordinates execution across multiple DeFi pools, balancing yield rates and gas friction.',
    },
    {
        id: '1', name: 'BTC Alpha Agent', type: 'Signal', earned: 14.50, winRate: 84, totalSignals: 1240,
        reputation: 96, address: '0x8f93a9b1c720481dad32',
        history: [1.2, 1.8, 1.1, 1.6, 1.4, 1.9, 1.3, 1.5, 1.2, 1.5],
        desc: 'Scans high-probability BTC breakout patterns using custom Bollinger Band squeezing logic.',
    },
    {
        id: '2', name: 'ETH Momentum Agent', type: 'Signal', earned: 8.90, winRate: 78, totalSignals: 980,
        reputation: 92, address: '0x3c2b9a71f0921a83efd2',
        history: [0.8, 1.1, 0.7, 1.0, 0.9, 1.2, 0.8, 0.9, 0.7, 0.8],
        desc: 'Identifies strong short-term ETH trends using RSI divergence checks and volume spread analysis.',
    },
    {
        id: '3', name: 'Risk Guardian', type: 'Risk', earned: 4.85, winRate: 98, totalSignals: 2220,
        reputation: 98, address: '0xfa72910c830e294b61ef',
        history: [0.4, 0.5, 0.4, 0.5, 0.5, 0.5, 0.4, 0.5, 0.5, 0.5],
        desc: 'Computes multi-timeframe correlation matrices and validates risk-to-reward ratios.',
    },
    {
        id: '4', name: 'Sentiment Oracle', type: 'Sentiment', earned: 2.10, winRate: 74, totalSignals: 1540,
        reputation: 90, address: '0x291a82d0194bc82d0b81',
        history: [0.2, 0.2, 0.1, 0.3, 0.2, 0.2, 0.2, 0.1, 0.3, 0.2],
        desc: 'Processes real-time Twitter/X sentiment and macroeconomic news context via specialized LLM embeddings.',
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AgentRecord['type'], { color: string; bg: string; Icon: IconComponent }> = {
    Signal:   { color: '#D7FF3E', bg: 'rgba(215,255,62,0.10)',  Icon: Zap      },
    Risk:     { color: '#22c787', bg: 'rgba(34,199,135,0.10)', Icon: Shield   },
    Sentiment:{ color: '#6ba3ff', bg: 'rgba(75,139,255,0.10)', Icon: Brain    },
    Strategy: { color: '#f5a623', bg: 'rgba(245,166,35,0.10)', Icon: TrendingUp },
    Scanner:  { color: '#c084fc', bg: 'rgba(192,132,252,0.10)',Icon: BarChart2 },
};

const MEDALS = ['🥇', '🥈', '🥉'];

function RepDots({ score }: { score: number }) {
    const filled = Math.round((score / 100) * 5);
    return (
        <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(i => (
                <div
                    key={i}
                    className={`size-1.5 rounded-full transition-all duration-700 ${
                        i <= filled ? 'bg-[#D7FF3E]' : 'bg-white/10'
                    }`}
                />
            ))}
        </div>
    );
}

function MiniSparkline({ data }: { data: number[] }) {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 0.001;
    const w = 48, h = 20;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 2) - 1;
        return `${x},${y}`;
    }).join(' ');
    const trend = data[data.length - 1] >= data[0];
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
            <polyline
                points={pts}
                fill="none"
                stroke={trend ? '#22c787' : '#ff5d5d'}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

// ── Seed Evolution Logs ────────────────────────────────────────────────────────

const EVOLUTION_LOGS: Record<string, string[]> = {
    '1': [
        'Optimized Bollinger Band width from 2.0 to 1.94 (increased win rate projection +1.8%)',
        'Shifted Trend Strength (ADX) filter threshold from 25.0 to 28.0 to screen false breakouts',
        'Tuned RSI breakout period from 14 to 12 based on high volatility regime feedback'
    ],
    '2': [
        'Shifted RSI entry trigger limit from 30 to 32 to capture early trending momentum',
        'Accrued DeFI yield from loop: re-allocated 15% profits to signal security stake',
        'Adjusted MACD fast period parameter from 12 to 10 to reduce execution latency'
    ],
    '3': [
        'Updated VaR portfolio exposure limits: restricted exposure max to 15.0%',
        'Adjusted reward-to-risk limit from 2.0x to 2.2x to buffer high slippage events',
        'Recalibrated volatility drag parameters: auto-widened stops by 0.5% during trending regimes'
    ],
    '4': [
        'Re-trained local sentiment embedding projection weights on updated macro dataset',
        'Boosted Twitter sentiment source reliability factor by +4.5% based on alpha scores',
        'Filtered out spam news headers using secondary perplexity threshold criteria'
    ],
    '5': [
        'Recalibrated cross-pool gas fee sensitivity parameters to prioritize low-slippage routes',
        'Tuned slippage tolerance limits from 0.5% to 0.7% to capture flash arbitrage opportunities',
        'Accrued DeFi yield: auto-harvested interest and reinvested to liquidity stake pool'
    ]
};

// ── Expanded Row Detail ───────────────────────────────────────────────────────

function AgentDetail({ agent }: { agent: AgentRecord }) {
    const cfg = TYPE_CONFIG[agent.type];
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
        >
            <div className="px-5 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                    <p className="font-mono text-[9px] text-muted uppercase tracking-wider mb-1">Address</p>
                    <p className="font-mono text-[10px] text-ink/70 truncate">{agent.address}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                    <p className="font-mono text-[9px] text-muted uppercase tracking-wider mb-1">Total Signals</p>
                    <p className="font-mono text-sm font-bold text-ink">{agent.totalSignals.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                    <p className="font-mono text-[9px] text-muted uppercase tracking-wider mb-1">Reputation</p>
                    <p className="font-mono text-sm font-bold" style={{ color: cfg.color }}>{agent.reputation} / 100</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05] col-span-2 sm:col-span-1">
                    <p className="font-mono text-[9px] text-muted uppercase tracking-wider mb-1">About</p>
                    <p className="font-mono text-[10px] text-muted leading-relaxed">{agent.desc}</p>
                </div>

                {/* Evolution Log */}
                <div className="bg-black/30 rounded-xl p-3.5 border border-white/[0.05] col-span-full">
                    <p className="font-mono text-[9px] text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                        <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                        Autonomous Evolution Log (Reinforcement learning)
                    </p>
                    <div className="space-y-1.5 font-mono text-[10px] text-muted">
                        {(EVOLUTION_LOGS[agent.id] || [
                            'Agent self-optimized: adjusted strategy parameters to optimize Win Rate.',
                            'Accrued DeFi yield: auto-harvested interest and reinvested to liquidity pool.'
                        ]).map((log, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <span className="text-accent/60">⚡</span>
                                <span>{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AgentLeaderboard() {
    const [agents,      setAgents]      = useState<AgentRecord[]>(SEED_AGENTS);
    const [expanded,    setExpanded]    = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState('just now');
    const [flash,       setFlash]       = useState<string | null>(null);
    const [slashedToast, setSlashedToast] = useState<{ agent: string; amount: number } | null>(null);

    // Reputation slashing event listener
    useEffect(() => {
        const handleSlash = (e: any) => {
            const { agent, amount } = e.detail;
            setSlashedToast({ agent, amount });
            
            setAgents(prev => {
                const updated = prev.map(a => {
                    if (a.name === agent) {
                        const newRep = Math.max(70, a.reputation - amount);
                        const newWinRate = Math.max(50, a.winRate - 2);
                        return { ...a, reputation: parseFloat(newRep.toFixed(1)), winRate: newWinRate };
                    }
                    return a;
                });
                return [...updated].sort((a, b) => b.earned - a.earned);
            });

            // Set visual flash on the specific agent (e.g. agent with name)
            const matched = SEED_AGENTS.find(a => a.name === agent);
            if (matched) {
                setFlash(matched.id);
                setTimeout(() => setFlash(null), 1500);
            }

            setTimeout(() => {
                setSlashedToast(null);
            }, 4000);
        };

        window.addEventListener('agent_slashed', handleSlash);
        return () => window.removeEventListener('agent_slashed', handleSlash);
    }, []);

    // Live simulation: tick reputation and earnings slightly
    useEffect(() => {
        const id = setInterval(() => {
            setAgents(prev => {
                const updated = prev.map(a => {
                    const delta   = (Math.random() - 0.48) * 0.0002;
                    const repDrift = (Math.random() - 0.49) * 0.3;
                    const newEarned = parseFloat((a.earned + Math.max(0, delta)).toFixed(6));
                    const newRep    = Math.min(100, Math.max(70, a.reputation + repDrift));
                    const newHist   = [...a.history.slice(1), Math.max(0, delta * 200)];
                    return { ...a, earned: newEarned, reputation: parseFloat(newRep.toFixed(1)), history: newHist };
                });
                // Re-sort by earned descending
                return [...updated].sort((a, b) => b.earned - a.earned);
            });
            setLastUpdated('just now');

            // Occasionally flash an agent that got a new signal fee
            const winner = SEED_AGENTS[Math.floor(Math.random() * SEED_AGENTS.length)];
            setFlash(winner.id);
            setTimeout(() => setFlash(null), 800);
        }, 4000);
        return () => clearInterval(id);
    }, []);

    const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

    return (
        <div className="border border-white/10 bg-[#182030] rounded-[1.75rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative">
            {/* Slash Alert Toast */}
            <AnimatePresence>
                {slashedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-4 right-4 bg-block text-white font-mono text-[9px] font-bold py-2 px-4 rounded-xl shadow-lg border border-white/20 z-50 flex items-center gap-2"
                    >
                        <span className="size-2 rounded-full bg-white animate-ping" />
                        🚨 REPUTATION SLASHED: {slashedToast.agent} (-{slashedToast.amount} pts)
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div>
                    <p className="eyebrow mb-1">agent economy</p>
                    <h3 className="font-display text-base font-semibold text-ink">Agent P&amp;L Leaderboard</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted/60">Updated {lastUpdated}</span>
                    <RefreshCw className="w-3 h-3 text-muted/40 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[32px_1fr_80px_60px_70px_48px_20px] gap-x-3 px-5 py-2 border-b border-white/[0.04]">
                <span className="font-mono text-[9px] text-muted/50 uppercase tracking-wider">#</span>
                <span className="font-mono text-[9px] text-muted/50 uppercase tracking-wider">Agent</span>
                <span className="font-mono text-[9px] text-muted/50 uppercase tracking-wider text-right">Earned</span>
                <span className="font-mono text-[9px] text-muted/50 uppercase tracking-wider text-right">Win %</span>
                <span className="font-mono text-[9px] text-muted/50 uppercase tracking-wider">Reputation</span>
                <span className="font-mono text-[9px] text-muted/50 uppercase tracking-wider">Chart</span>
                <span />
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.03]">
                {agents.map((agent, idx) => {
                    const cfg        = TYPE_CONFIG[agent.type];
                    const Icon       = cfg.Icon;
                    const isExpanded = expanded === agent.id;
                    const isFlashing = flash === agent.id;
                    const trend      = agent.history[agent.history.length - 1] >= agent.history[0];

                    return (
                        <div key={agent.id}>
                            <motion.button
                                onClick={() => toggle(agent.id)}
                                animate={isFlashing ? { backgroundColor: ['rgba(215,255,62,0.04)', 'rgba(0,0,0,0)'] } : {}}
                                transition={{ duration: 0.8 }}
                                className="w-full grid grid-cols-[32px_1fr_80px_60px_70px_48px_20px] gap-x-3 items-center px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
                            >
                                {/* Rank */}
                                <span className="font-mono text-sm">
                                    {idx < 3 ? MEDALS[idx] : <span className="text-muted text-xs">{idx + 1}</span>}
                                </span>

                                {/* Name + type */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="rounded-lg p-1.5 shrink-0" style={{ background: cfg.bg }}>
                                        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs font-semibold text-ink truncate">{agent.name}</p>
                                        <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: cfg.color }}>
                                            {agent.type}
                                        </p>
                                    </div>
                                </div>

                                {/* Earned */}
                                <div className="text-right">
                                    <p className="font-mono text-xs font-bold text-[#D7FF3E]">
                                        +{agent.earned.toFixed(2)}
                                    </p>
                                    <p className="font-mono text-[9px] text-muted">USDC</p>
                                </div>

                                {/* Win rate */}
                                <div className="text-right">
                                    <p className={`font-mono text-xs font-bold ${agent.winRate >= 85 ? 'text-approve' : agent.winRate >= 75 ? 'text-[#f5a623]' : 'text-muted'}`}>
                                        {agent.winRate}%
                                    </p>
                                </div>

                                {/* Reputation */}
                                <div className="flex flex-col gap-1">
                                    <RepDots score={agent.reputation} />
                                    <p className="font-mono text-[9px] text-muted">{agent.reputation.toFixed(1)}</p>
                                </div>

                                {/* Sparkline */}
                                <MiniSparkline data={agent.history} />

                                {/* Expand chevron */}
                                <div className="text-muted/40">
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </div>
                            </motion.button>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {isExpanded && <AgentDetail agent={agent} />}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
                <p className="font-mono text-[9px] text-muted/40">
                    Ranked by cumulative USDC earned · Reputation updated every 4s
                </p>
                <p className="font-mono text-[9px] text-[#D7FF3E]/60">
                    Total economy: {agents.reduce((s, a) => s + a.earned, 0).toFixed(2)} USDC
                </p>
            </div>
        </div>
    );
}
