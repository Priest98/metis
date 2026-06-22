
'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function BacktestingPage() {
    const [backtests, setBacktests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBacktests();
    }, []);

    const fetchBacktests = async () => {
        try {
            const response = await api.get('/backtests/');
            setBacktests(response.data);
        } catch (error) {
            console.error('Failed to fetch backtests:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen px-5 pt-24 pb-12 sm:px-8 max-w-6xl mx-auto">
            <p className="eyebrow mb-3">backtesting results</p>
            <h1 className="font-display text-3xl font-semibold text-ink mb-8">
                Backtesting Results
            </h1>

            {loading ? (
                <div className="text-center py-20">
                    <div className="h-6 w-6 animate-spin border-b-2 border-accent mx-auto mb-4" />
                    <span className="font-mono text-xs text-muted">Loading results...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {backtests.map((bt: any) => (
                        <div
                            key={bt.id}
                            className="border border-white/10 bg-[#182030] p-6 rounded-[1.75rem] shadow-2xl hover:border-white/20 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-display text-lg font-semibold text-ink">
                                        Strategy {bt.strategy_name || 'Unknown'}
                                    </h3>
                                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted mt-0.5">
                                        {new Date(bt.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span
                                    className={`font-mono text-xs border px-3 py-1 rounded-full ${
                                        bt.metrics?.total_return > 0
                                            ? 'text-approve border-approve/30 bg-approve/5'
                                            : 'text-block border-block/30 bg-block/5'
                                    }`}
                                >
                                    {bt.metrics?.total_return > 0 ? '+' : ''}{bt.metrics?.total_return?.toFixed(2)}%
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-[#0b0f17]/60 p-3 rounded-xl">
                                    <p className="font-mono text-[0.65rem] uppercase text-muted mb-1">Sharpe</p>
                                    <p className="font-display text-xl font-semibold text-ink">
                                        {bt.metrics?.sharpe_ratio?.toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-[#0b0f17]/60 p-3 rounded-xl">
                                    <p className="font-mono text-[0.65rem] uppercase text-muted mb-1">Win Rate</p>
                                    <p className="font-display text-xl font-semibold text-ink">
                                        {bt.metrics?.win_rate?.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="bg-[#0b0f17]/60 p-3 rounded-xl">
                                    <p className="font-mono text-[0.65rem] uppercase text-muted mb-1">Drawdown</p>
                                    <p className="font-display text-xl font-semibold text-block">
                                        {bt.metrics?.max_drawdown?.toFixed(2)}%
                                    </p>
                                </div>
                            </div>

                            <p className="font-mono text-[0.65rem] text-muted/50 mt-3 pt-3 border-t border-white/10">
                                ID: {bt.id}
                            </p>
                        </div>
                    ))}

                    {backtests.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10 bg-[#182030]/40 rounded-[1.75rem] font-mono text-xs text-muted">
                            No backtests run yet. Go to Strategies to run one.
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
