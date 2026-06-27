'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Terminal, Code, Cpu, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { LogoMark } from '@/components/LogoMark';

export default function ApiDocsPage() {
    return (
        <div className="min-h-screen bg-background text-ink relative py-16 px-5 sm:px-8 font-mono">
            {/* Nav */}
            <div className="max-w-4xl mx-auto mb-10 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors">
                    <ArrowLeft className="size-3.5" />
                    Back to home
                </Link>
                <div className="flex items-center gap-2">
                    <span className="bg-background/10 border border-hairline text-muted text-[10px] font-bold px-2.5 py-1 rounded uppercase">
                        v1.0.0-beta
                    </span>
                </div>
            </div>

            <main className="max-w-4xl mx-auto space-y-12 text-left">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                            <Terminal className="size-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink">
                                Metis Agent API
                            </h1>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                Build on the agent economy. Pay-per-signal, pay-per-call, and unlock predictions programmatically using x402 payments.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Base URL Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-hairline bg-surface rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
                >
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                        <Key className="size-4 text-accent" /> Connection Details
                    </h3>
                    <div className="bg-background/20 border border-hairline rounded-xl p-4 font-mono text-xs text-muted space-y-2 select-all">
                        <div><span className="text-accent font-semibold">BASE URL:</span> https://api.metis.trade/v1</div>
                        <div><span className="text-accent font-semibold">AUTH:</span> Bearer {'{your_jwt_token}'}</div>
                        <div><span className="text-accent font-semibold">FORMAT:</span> application/json</div>
                    </div>
                </motion.div>

                {/* Endpoints Table */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink">
                        API Endpoints
                    </h3>
                    <div className="border border-hairline bg-surface rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-mono text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-hairline bg-background/20 text-muted uppercase text-[9px] tracking-wider">
                                        <th className="p-4 font-bold">Method</th>
                                        <th className="p-4 font-bold">Endpoint</th>
                                        <th className="p-4 font-bold">Description</th>
                                        <th className="p-4 font-bold">Auth</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {[
                                        { method: 'GET', path: '/signals/', desc: 'List all available quantitative signals', auth: 'Required', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
                                        { method: 'POST', path: '/signals/{id}/unlock', desc: 'Pay 0.001 USDC via x402 to unlock full entry details', auth: 'Required', color: 'text-[#22c787] bg-[#22c787]/10 border-[#22c787]/20' },
                                        { method: 'GET', path: '/wallet/me', desc: 'Get your embedded wallet balance on Arc L1', auth: 'Required', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
                                        { method: 'POST', path: '/wallet/agents/', desc: 'Deploy a new autonomous agent with customizable rules', auth: 'Required', color: 'text-[#22c787] bg-[#22c787]/10 border-[#22c787]/20' },
                                        { method: 'GET', path: '/backtests/', desc: 'List backtest results and trade logs', auth: 'Required', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
                                        { method: 'POST', path: '/strategies/', desc: 'Create a new trading strategy', auth: 'Required', color: 'text-[#22c787] bg-[#22c787]/10 border-[#22c787]/20' }
                                    ].map((route, i) => (
                                        <tr key={i} className="hover:bg-surface/30 transition-colors">
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${route.color}`}>
                                                    {route.method}
                                                </span>
                                            </td>
                                            <td className="p-4 text-ink font-semibold">{route.path}</td>
                                            <td className="p-4 text-muted max-w-xs sm:max-w-md">{route.desc}</td>
                                            <td className="p-4 text-muted/80">{route.auth}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* x402 Payment Flow Diagram */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink">
                        x402 Micropayment Flow
                    </h3>
                    <div className="border border-hairline bg-surface rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-around gap-6 text-center">
                        <div className="p-4 rounded-xl bg-background/20 border border-hairline w-full max-w-[200px] space-y-2">
                            <Cpu className="size-5 text-accent mx-auto" />
                            <div className="font-bold text-xs text-ink uppercase">Your Agent</div>
                            <div className="text-[10px] text-muted">Triggers code lookup or API client action.</div>
                        </div>

                        <div className="text-accent flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold">POST Request</span>
                            <div className="h-0.5 w-16 bg-accent/30 hidden md:block" />
                            <span className="font-semibold text-xs border border-accent/20 bg-accent/5 px-2.5 py-0.5 rounded">
                                x402 Payment (0.001 USDC)
                            </span>
                            <div className="h-0.5 w-16 bg-accent/30 hidden md:block" />
                        </div>

                        <div className="p-4 rounded-xl bg-background/20 border border-hairline w-full max-w-[200px] space-y-2">
                            <ShieldCheck className="size-5 text-[#22c787] mx-auto" />
                            <div className="font-bold text-xs text-ink uppercase">Signal Unlocked</div>
                            <div className="text-[10px] text-muted">Confirmed on Arc L1 in &lt;400ms.</div>
                        </div>
                    </div>
                </div>

                {/* Code Example */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                        <Code className="size-4 text-accent" /> Code Example
                    </h3>
                    <div className="border border-hairline bg-background/20 rounded-2xl p-5 shadow-xl space-y-4 overflow-hidden relative">
                        <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-background/10 border border-hairline rounded font-mono text-[9px] text-muted uppercase">
                            bash / curl
                        </div>
                        <pre className="text-xs text-muted/90 leading-relaxed overflow-x-auto select-all max-h-[300px]">
{`# 1. Request to unlock signal with x402 micro-payment
curl -X POST https://api.metis.trade/v1/signals/sig_abc123/unlock \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"destination": "0xSignalAgentWallet", "amount": 0.001}'

# 2. Response containing decrypted signal detail & tx confirmation
{
  "status": "success",
  "tx_hash": "0xarc9f88d27a1928cf3b8f2a1b94e773ad820491a3",
  "block_number": 8429104,
  "signal": {
    "symbol": "BTCUSDT",
    "direction": "BUY",
    "entry_price": 67420.00,
    "take_profit": 71200.00,
    "stop_loss": 65800.00,
    "probability": 0.88
  }
}`}
                        </pre>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="text-center pt-6">
                    <Link 
                        href="/signup" 
                        className="inline-block bg-accent hover:bg-ink text-background hover:text-background font-bold text-xs uppercase px-8 py-3.5 rounded-xl shadow-lg transition-all duration-200"
                    >
                        Get your API key →
                    </Link>
                </div>
            </main>
        </div>
    );
}
