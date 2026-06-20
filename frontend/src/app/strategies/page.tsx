'use client';

import React from 'react';
import StrategyList from '@/components/strategies/StrategyList';
import StrategyForm from '@/components/strategies/StrategyForm';
import { StrategyResponse } from '@/lib/types';

export default function StrategiesPage() {
    const handleStrategyCreated = (strategy: StrategyResponse) => {
        // Simple reload for now to refresh list
        // In a real app we'd update the list state
        window.location.reload();
    };

    return (
        <main className="min-h-screen px-5 py-8 sm:px-8 max-w-6xl mx-auto space-y-12">

            {/* Header */}
            <div>
                <p className="eyebrow mb-3">strategy engine</p>
                <h1 className="font-display text-3xl font-semibold text-ink">
                    Strategy Engine
                </h1>
                <p className="font-mono text-xs text-muted mt-2">
                    Design, test, and deploy algorithmic trading strategies.
                </p>
            </div>

            {/* Strategy Creation Form */}
            <section className="border-t border-hairline pt-8">
                <StrategyForm onSuccess={handleStrategyCreated} />
            </section>

            {/* Strategy List */}
            <section>
                <p className="eyebrow mb-4">active strategies</p>
                <h2 className="font-display text-xl font-semibold text-ink mb-6">
                    Active Strategies
                </h2>
                <div className="border-t border-hairline pt-6">
                    <StrategyList />
                </div>
            </section>

        </main>
    );
}
