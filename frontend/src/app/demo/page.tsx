'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wallet, Shield, Zap, Check, Lock, Unlock, Eye, Sparkles } from 'lucide-react';
import { LogoMark } from '@/components/LogoMark';

export default function JudgeDemoPage() {
    const [balance, setBalance] = useState(10.000000);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [txHash, setTxHash] = useState('');

    const handleUnlock = () => {
        setIsUnlocking(true);
        setTimeout(() => {
            const hash = '0xarc' + Math.random().toString(16).substring(2, 10) + '9f88d27a1928cf3b8f' + Math.random().toString(16).substring(2, 6);
            setTxHash(hash);
            setBalance(prev => prev - 0.001000);
            setIsUnlocking(false);
            setUnlocked(true);
        }, 1600);
    };

    return (
        <div className="min-h-screen bg-[#0b0f17] text-ink relative py-16 px-5 sm:px-8 font-mono">
            {/* Sandbox Banner */}
            <div className="fixed top-0 inset-x-0 bg-accent text-[#0b0f17] text-center py-2 px-4 text-[10px] font-black uppercase tracking-[0.15em] z-50 shadow-md">
                ⚡ Sandboxed Live Demo Mode · No Account Required · Sandbox Payments are Simulated on Arc L1 Testnet
            </div>

            {/* Back Nav */}
            <div className="max-w-2xl mx-auto mb-10 flex items-center justify-between mt-4">
                <Link href="/" className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors">
                    <ArrowLeft className="size-3.5" />
                    Back to home
                </Link>
                <div className="flex items-center gap-2">
                    <span className="bg-accent text-[#0b0f17] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Judge Mode
                    </span>
                </div>
            </div>

            <main className="max-w-2xl mx-auto space-y-8">
                {/* Hero */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <LogoMark width={40} height={40} />
                    </div>
                    <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink">
                        Experience the Agent Economy
                    </h1>
                    <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                        Metis allows agents to coordinate, validate risk, and sell quantitative trading signals autonomously via x402 micro-settlements.
                    </p>
                </div>

                {/* 10 USDC Wallet Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="border border-white/10 bg-[#182030] rounded-[1.75rem] p-6 shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-[#22c787] font-semibold bg-[#22c787]/10 rounded-bl-[1.25rem] border-l border-b border-white/10">
                        Demo Account
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                            <Wallet className="size-6" />
                        </div>
                        <div>
                            <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Available Balance</span>
                            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-ink mt-0.5 tracking-tight tabular-nums">
                                {balance.toFixed(6)} <span className="text-accent text-lg">USDC</span>
                            </h2>
                        </div>
                    </div>
                </motion.div>

                {/* Masked Signal Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="border border-white/10 bg-[#182030] rounded-[1.75rem] p-6 shadow-xl space-y-5"
                >
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-accent" />
                            <span className="font-bold text-xs uppercase tracking-wider text-ink">Premium Signal #8429</span>
                        </div>
                        <span className="font-mono text-[10px] text-accent/80 font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                            94% Win Rate
                        </span>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 sm:p-5 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {!unlocked ? (
                                <motion.div 
                                    key="masked"
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Lock className="size-5 text-muted/60 animate-pulse" />
                                        <div className="space-y-1 w-full">
                                            <span className="text-[9px] uppercase tracking-wider text-muted font-bold block">Asset Pairing</span>
                                            <span className="font-bold text-base tracking-wide text-ink block">
                                                BTC/USDT <span className="font-mono text-muted/30 select-none">███████</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted/60 font-bold mb-0.5">Entry Target</span>
                                            <span className="font-mono text-xs text-ink/40 select-none">██████</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted/60 font-bold mb-0.5">Take Profit</span>
                                            <span className="font-mono text-xs text-ink/40 select-none">██████</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted/60 font-bold mb-0.5">Stop Loss</span>
                                            <span className="font-mono text-xs text-ink/40 select-none">██████</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleUnlock}
                                            disabled={isUnlocking}
                                            className="w-full bg-accent text-[#0b0f17] font-bold text-xs uppercase py-3 rounded-lg hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            {isUnlocking ? (
                                                <>
                                                    <span className="size-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                                    Settling x402 Micropayment...
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock className="size-3.5" />
                                                    Unlock Signal · 0.001 USDC
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="unmasked"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Eye className="size-5 text-approve animate-pulse" />
                                        <div className="space-y-1 w-full">
                                            <span className="text-[9px] uppercase tracking-wider text-approve font-bold block flex items-center gap-1">
                                                <Sparkles className="size-3" /> Unlocked Successfully
                                            </span>
                                            <span className="font-bold text-base tracking-wide text-ink block flex items-center gap-2">
                                                BTC/USDT <span className="text-xs bg-approve/10 border border-approve/25 text-approve px-2 py-0.5 rounded font-black">BUY</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted font-bold mb-0.5">Entry Target</span>
                                            <span className="font-mono text-xs font-bold text-ink">$67,420.00</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted font-bold mb-0.5">Take Profit</span>
                                            <span className="font-mono text-xs font-bold text-approve">$71,200.00</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] uppercase text-muted font-bold mb-0.5">Stop Loss</span>
                                            <span className="font-mono text-xs font-bold text-block">$65,800.00</span>
                                        </div>
                                    </div>

                                    {txHash && (
                                        <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-1.5 font-mono text-[9px] text-muted">
                                            <div className="flex justify-between items-center">
                                                <span>TRANSACTION STATUS</span>
                                                <span className="text-approve font-bold flex items-center gap-1">
                                                    <Check className="size-3" /> CONFIRMED ON ARC L1
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span>TX HASH</span>
                                                <a 
                                                    href={`https://explorer.testnet.arc.network/tx/${txHash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-accent hover:underline truncate max-w-[200px] select-all cursor-pointer"
                                                >
                                                    {txHash}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Pipeline Breakdown Card */}
                {unlocked && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.5 }}
                        className="border border-white/10 bg-[#182030] rounded-[1.75rem] p-6 shadow-xl space-y-4"
                    >
                        <h3 className="font-bold text-xs uppercase tracking-wider text-ink border-b border-white/5 pb-3">
                            Agent Fee Distribution Pipeline
                        </h3>
                        <div className="space-y-3 font-mono text-[10px] text-muted">
                            <div className="flex items-center justify-between p-2.5 rounded bg-black/20 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-3.5 text-[#D7FF3E]" />
                                    <span className="font-semibold text-ink">Signal Agent Unlock Fee</span>
                                </div>
                                <span className="font-bold text-[#D7FF3E]">+0.0010 USDC</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded bg-black/20 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Shield className="size-3.5 text-[#22c787]" />
                                    <span className="font-semibold text-ink">Risk Agent Validation Fee</span>
                                </div>
                                <span className="font-bold text-[#22c787]">+0.0005 USDC</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded bg-black/20 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="size-3.5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#6ba3ff] font-bold text-[8px]">Se</span>
                                    <span className="font-semibold text-ink">Sentiment Check Fee</span>
                                </div>
                                <span className="font-bold text-[#6ba3ff]">+0.0003 USDC</span>
                            </div>
                        </div>

                        <div className="pt-2 text-center text-[10px] text-muted/60">
                            Payments settled in parallel via multi-hop x402 routing in 340ms.
                        </div>
                    </motion.div>
                )}

                {/* Final CTA */}
                {unlocked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-center pt-4"
                    >
                        <Link 
                            href="/signup" 
                            className="inline-block bg-accent hover:bg-white text-[#0b0f17] font-bold text-xs uppercase px-8 py-3.5 rounded-xl shadow-lg transition-all"
                        >
                            Ready to go live? Create your account →
                        </Link>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
