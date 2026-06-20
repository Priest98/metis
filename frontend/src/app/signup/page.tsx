'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { LogoMark } from '@/components/LogoMark';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const { login } = useAuth();

    const connectWallet = async () => {
        setIsConnecting(true);
        setWalletError(null);
        try {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                } else {
                    setWalletError('No accounts found.');
                }
            } else {
                setWalletError('No EVM wallet detected. Please install MetaMask.');
            }
        } catch (err: any) {
            console.error('Wallet connection error', err);
            setWalletError(err.message || 'Failed to connect wallet.');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setWalletAddress(null);
        setWalletError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            login(email, walletAddress || undefined);
        }
    };

    const inputClass = "w-full bg-background border border-hairline text-ink placeholder:text-muted px-4 py-3 text-sm font-mono focus:border-accent focus:outline-none transition-colors";
    const labelClass = "font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted mb-2 block";

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-64"
                style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(215,255,62,0.05), transparent 70%)' }}
            />

            <div className="w-full max-w-md relative z-10">
                <Link href="/" className="flex items-baseline gap-2 mb-10 text-ink group w-fit">
                    <LogoMark />
                    <span className="font-display text-base font-medium tracking-tight group-hover:text-accent transition-colors">Metis</span>
                </Link>

                <div className="border border-hairline bg-surface p-8">
                    <p className="eyebrow mb-3">create account</p>
                    <h1 className="font-display text-2xl font-semibold text-ink mb-1">Start trading</h1>
                    <p className="font-mono text-xs text-muted mb-8">Join the on-demand quant platform</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>First Name</label>
                                <input type="text" className={inputClass} placeholder="John" />
                            </div>
                            <div>
                                <label className={labelClass}>Last Name</label>
                                <input type="text" className={inputClass} placeholder="Doe" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputClass}
                                placeholder="trader@quant101.com"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Password</label>
                            <input type="password" className={inputClass} placeholder="••••••••" />
                        </div>

                        {/* Wallet Integration Section */}
                        <div className="border border-hairline bg-background/50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
                                    External EVM Wallet
                                </label>
                                {walletAddress && (
                                    <button 
                                        type="button" 
                                        onClick={disconnectWallet}
                                        className="font-mono text-[0.6rem] text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider"
                                    >
                                        Disconnect
                                    </button>
                                )}
                            </div>

                            {walletAddress ? (
                                <div className="flex items-center justify-between bg-surface/50 border border-[#22c55e]/20 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#22c55e] animate-pulse" />
                                        <span className="font-mono text-xs text-[#22c55e] tracking-tight">
                                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                        </span>
                                    </div>
                                    <span className="font-mono text-[0.6rem] text-muted uppercase">Linked</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={connectWallet}
                                    disabled={isConnecting}
                                    className="w-full flex items-center justify-center gap-2 border border-hairline py-2.5 px-4 font-mono text-xs text-ink hover:border-accent hover:text-accent transition-all duration-300 active:scale-[0.99]"
                                >
                                    {isConnecting ? (
                                        <>
                                            <span className="size-3 border-2 border-accent border-t-transparent animate-spin rounded-full" />
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <span>Connect MetaMask / EVM Wallet</span>
                                    )}
                                </button>
                            )}

                            {walletError && (
                                <p className="font-mono text-[0.65rem] text-rose-400 mt-1">{walletError}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full font-mono bg-ink text-background text-sm font-semibold py-3 transition-colors hover:bg-accent"
                        >
                            Create Account →
                        </button>

                        <div className="text-center font-mono text-xs text-muted pt-1">
                            Already have an account?{' '}
                            <Link href="/login" className="text-accent hover:underline underline-offset-4">
                                Log in
                            </Link>
                        </div>
                    </form>
                </div>

                <p className="font-mono text-[0.65rem] text-muted text-center mt-6">
                    <span className="inline-block size-1.5 rounded-full bg-accent mr-1.5 align-middle" />
                    $0.001 USDC per signal · No subscription required
                </p>
            </div>
        </main>
    );
}
