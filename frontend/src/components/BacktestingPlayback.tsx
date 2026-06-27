'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, TrendingUp, Sparkles, CheckCircle2, TrendingDown, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceDot } from 'recharts';

interface ChartPoint {
    time: string;
    price: number;
}

interface SimulatedTrade {
    index: number;
    type: 'BUY' | 'SELL';
    price: number;
    label: string;
}

const HISTORICAL_DATA: ChartPoint[] = [
    { time: '09:00', price: 66200 },
    { time: '09:30', price: 66400 },
    { time: '10:00', price: 66300 },
    { time: '10:30', price: 66150 },
    { time: '11:00', price: 66500 }, // BUY point (idx 4)
    { time: '11:30', price: 66800 },
    { time: '12:00', price: 67100 },
    { time: '12:30', price: 66950 },
    { time: '13:00', price: 67300 },
    { time: '13:30', price: 67800 }, // SELL point (idx 9)
    { time: '14:00', price: 67550 },
    { time: '14:30', price: 67900 },
    { time: '15:00', price: 68400 }, // SELL point (idx 12)
    { time: '15:30', price: 68200 },
    { time: '16:00', price: 68900 }
];

const TRADES: SimulatedTrade[] = [
    { index: 4, type: 'BUY', price: 66500, label: 'Bollinger Breakout LONG' },
    { index: 9, type: 'SELL', price: 67800, label: 'Take Profit Triggered' },
    { index: 12, type: 'SELL', price: 68400, label: 'Trend Exhaustion Close' }
];

export default function BacktestingPlayback() {
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [activeTrades, setActiveTrades] = useState<SimulatedTrade[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pnl, setPnl] = useState(0.00);
    const [statusText, setStatusText] = useState('Ready to execute backtest');

    useEffect(() => {
        resetPlayback();
    }, []);

    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            if (currentIndex < HISTORICAL_DATA.length) {
                const nextPoint = HISTORICAL_DATA[currentIndex];
                setChartData(prev => [...prev, nextPoint]);

                // Check if trade executes at this index
                const trade = TRADES.find(t => t.index === currentIndex);
                if (trade) {
                    setActiveTrades(prev => [...prev, trade]);
                    if (trade.type === 'BUY') {
                        setStatusText(`LONG position opened @ $${trade.price.toLocaleString()}`);
                    } else {
                        setPnl(prev => prev + 1.95);
                        setStatusText(`Position closed @ $${trade.price.toLocaleString()} (+1.95%)`);
                    }
                }

                setCurrentIndex(prev => prev + 1);
            } else {
                setIsPlaying(false);
                setStatusText('Backtest simulation completed. Win Rate: 100%.');
            }
        }, 600);

        return () => clearInterval(interval);
    }, [isPlaying, currentIndex]);

    const startPlayback = () => {
        if (currentIndex >= HISTORICAL_DATA.length) {
            resetPlayback();
        }
        setIsPlaying(true);
        setStatusText('Running simulation...');
    };

    const pausePlayback = () => {
        setIsPlaying(false);
    };

    const resetPlayback = () => {
        setChartData([HISTORICAL_DATA[0]]);
        setActiveTrades([]);
        setCurrentIndex(1);
        setIsPlaying(false);
        setPnl(0.00);
        setStatusText('Ready to execute backtest');
    };

    return (
        <div className="border border-hairline bg-surface rounded-[1.75rem] p-6 shadow-2xl space-y-6 select-none relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
                <div>
                    <span className="bg-accent/15 border border-accent/25 text-accent text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                        Interactive Sandbox
                    </span>
                    <h3 className="font-display text-base font-semibold text-ink mt-1">
                        Visual Backtesting Playback
                    </h3>
                </div>

                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={isPlaying ? pausePlayback : startPlayback}
                        className="font-mono flex items-center gap-1.5 bg-accent text-background font-semibold text-[10px] uppercase px-4 py-2 rounded-full hover:opacity-90 transition-all active:scale-[0.98]"
                    >
                        <Play className="w-3 h-3 fill-background" />
                        {isPlaying ? 'Pause' : 'Run Playback'}
                    </button>
                    <button
                        onClick={resetPlayback}
                        className="font-mono flex items-center gap-1.5 border border-hairline bg-background/10 px-4 py-2 rounded-full text-xs text-muted hover:text-ink transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-background/40 p-3 rounded-xl border border-hairline">
                    <p className="font-mono text-[9px] text-muted uppercase">Cumulative return</p>
                    <p className={`font-mono text-base font-bold mt-0.5 ${pnl > 0 ? 'text-approve' : 'text-ink'}`}>
                        {pnl > 0 ? `+${pnl.toFixed(2)}%` : '0.00%'}
                    </p>
                </div>
                <div className="bg-background/40 p-3 rounded-xl border border-hairline">
                    <p className="font-mono text-[9px] text-muted uppercase">Trades Executed</p>
                    <p className="font-mono text-base font-bold text-ink mt-0.5">
                        {activeTrades.length}
                    </p>
                </div>
                <div className="bg-background/40 p-3 rounded-xl border border-hairline">
                    <p className="font-mono text-[9px] text-muted uppercase">Win Rate</p>
                    <p className="font-mono text-base font-bold mt-0.5 text-approve">
                        {activeTrades.length > 1 ? '100%' : '---'}
                    </p>
                </div>
            </div>

            {/* Dynamic Graph Area */}
            <div className="h-[200px] w-full bg-background/20 rounded-2xl p-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="playbackGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                        <XAxis dataKey="time" stroke="var(--color-muted)" fontSize={9} fontFamily="var(--font-jetbrains)" />
                        <YAxis domain={[65800, 69200]} stroke="var(--color-muted)" fontSize={9} fontFamily="var(--font-jetbrains)" />
                        <Area type="monotone" dataKey="price" stroke="var(--color-accent)" strokeWidth={1.5} fill="url(#playbackGradient)" />

                        {/* Trade Dot Markers */}
                        {activeTrades.map((t, idx) => (
                            <ReferenceDot
                                key={idx}
                                x={HISTORICAL_DATA[t.index].time}
                                y={t.price}
                                r={6}
                                fill={t.type === 'BUY' ? 'var(--color-approve)' : 'var(--color-block)'}
                                stroke="#FFF"
                                strokeWidth={1.5}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>

                {/* Overlaid flags */}
                <div className="absolute top-2 left-2 flex gap-1.5 flex-col font-mono text-[9px] pointer-events-none">
                    {activeTrades.slice(-2).map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`px-2 py-1 rounded border flex items-center gap-1.5 shadow ${
                                t.type === 'BUY' 
                                    ? 'bg-approve/10 border-approve/30 text-approve' 
                                    : 'bg-block/10 border-block/30 text-block'
                            }`}
                        >
                            <span className="font-bold">{t.type}</span>
                            <span>@{t.price.toLocaleString()}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Status bar */}
            <div className="bg-background/30 border border-hairline p-3 rounded-xl flex items-center justify-between text-[10px] font-mono text-muted">
                <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-accent animate-pulse" />
                    <span className="text-ink font-semibold">{statusText}</span>
                </div>
                <span>playback index: {currentIndex}/{HISTORICAL_DATA.length}</span>
            </div>
        </div>
    );
}
