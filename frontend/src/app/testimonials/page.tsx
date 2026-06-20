'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
    {
        id: 1,
        name: 'Alex Thompson',
        role: 'Portfolio Manager, Apex Capital',
        content: 'The signal accuracy is unlike anything we\'ve seen. The Gemini integration adds context that pure technical models always miss.',
        rating: 5,
    },
    {
        id: 2,
        name: 'Sarah Chen',
        role: 'Quantitative Analyst',
        content: 'Finally, a platform that validates its signals with Bayesian probability. It\'s changed how I size my positions completely.',
        rating: 5,
    },
    {
        id: 3,
        name: 'Michael Ross',
        role: 'Crypto Fund Lead',
        content: 'The risk management features alone are worth the subscription. It saved us from the last major drawdown.',
        rating: 4,
    },
    {
        id: 4,
        name: 'Elena Rodriguez',
        role: 'Prop Trader',
        content: 'I use the API to feed directly into my execution bot. Latency is low and the win rate has been consistent for 3 months.',
        rating: 5,
    },
    {
        id: 5,
        name: 'David Kim',
        role: 'Institutional Investor',
        content: 'The dashboard is clean, fast, and gives me exactly what I need without the noise. Highly recommended for serious traders.',
        rating: 5,
    },
    {
        id: 6,
        name: 'Jessica Wu',
        role: 'Hedge Fund Manager',
        content: 'Metis has become an integral part of our daily workflow. The AI explanations are surprisingly insightful.',
        rating: 4,
    },
];

export default function TestimonialsPage() {
    return (
        <main className="min-h-screen bg-background text-ink px-5 py-16 sm:px-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <p className="eyebrow mb-4">what traders say</p>
                    <h1 className="font-display text-4xl font-semibold text-ink mb-5">
                        Trusted by institutional leaders.
                    </h1>
                    <p className="font-mono text-sm text-muted max-w-xl mx-auto leading-relaxed">
                        See what professional traders and quant funds are saying about our signal intelligence platform.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px border border-hairline bg-hairline">
                    {TESTIMONIALS.map((t, idx) => (
                        <div
                            key={t.id}
                            className="bg-surface p-7 flex flex-col gap-5 transition-colors hover:bg-white/[0.04]"
                        >
                            {/* Stars */}
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${i < t.rating ? 'text-accent fill-accent' : 'text-muted/30'}`}
                                    />
                                ))}
                            </div>

                            {/* Quote icon */}
                            <Quote className="w-7 h-7 text-white/[0.06]" />

                            {/* Content */}
                            <p className="text-sm text-muted leading-relaxed flex-1">
                                &ldquo;{t.content}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-4 border-t border-hairline">
                                <div className="size-9 border border-hairline bg-background flex items-center justify-center flex-shrink-0">
                                    <span className="font-mono text-xs text-accent font-semibold">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-display text-sm font-semibold text-ink">{t.name}</div>
                                    <div className="font-mono text-[0.65rem] text-muted uppercase tracking-[0.1em]">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
