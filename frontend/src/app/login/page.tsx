'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { LogoMark } from '@/components/LogoMark';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const { login, loginWithWallet } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            login(email);
        }
    };

    const handleWalletLogin = async () => {
        setIsConnecting(true);
        setWalletError(null);
        try {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts returned from wallet.');
                }
                const address = accounts[0];
                const timestamp = Math.floor(Date.now() / 1000);
                const message = `Sign this message to log into Metis. Timestamp: ${timestamp}`;
                
                const signature = await (window as any).ethereum.request({
                    method: 'personal_sign',
                    params: [message, address]
                });
                
                await loginWithWallet(address, signature, timestamp);
            } else {
                setWalletError('No EVM wallet detected. Please install MetaMask.');
            }
        } catch (err: any) {
            console.error('Wallet login error', err);
            setWalletError(err.message || 'Failed to log in with wallet.');
        } finally {
            setIsConnecting(false);
        }
    };

    const inputClass = "w-full bg-background border border-hairline text-ink placeholder:text-muted px-4 py-3 text-sm font-mono focus:border-accent focus:outline-none transition-colors";
    const labelClass = "font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted mb-2 block";

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle accent glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-64"
                style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(215,255,62,0.05), transparent 70%)' }}
            />

            <div className="w-full max-w-md relative z-10">
                {/* Brand */}
                <Link href="/" className="flex items-baseline gap-2 mb-10 text-ink group w-fit">
                    <LogoMark />
                    <span className="font-display text-base font-medium tracking-tight group-hover:text-accent transition-colors">Metis</span>
                </Link>

                <div className="border border-hairline bg-surface p-8">
                    <p className="eyebrow mb-3">authentication</p>
                    <h1 className="font-display text-2xl font-semibold text-ink mb-1">Sign in</h1>
                    <p className="font-mono text-xs text-muted mb-8">Access your quant terminal</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
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

                        <button
                            type="submit"
                            className="w-full font-mono bg-ink text-background text-sm font-semibold py-3 transition-colors hover:bg-accent"
                        >
                            Sign In →
                        </button>

                        <div className="text-center font-mono text-xs text-muted pt-1">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-accent hover:underline underline-offset-4">
                                Create one
                            </Link>
                        </div>

                        <div className="border-t border-hairline pt-4 space-y-3">
                            <button
                                type="button"
                                onClick={handleWalletLogin}
                                disabled={isConnecting}
                                className="w-full flex items-center justify-center gap-2 border border-hairline py-2.5 px-4 font-mono text-xs text-ink hover:border-accent hover:text-accent transition-all duration-300 active:scale-[0.99]"
                            >
                                {isConnecting ? (
                                    <>
                                        <span className="size-3 border-2 border-accent border-t-transparent animate-spin rounded-full" />
                                        <span>Signing Challenge...</span>
                                    </>
                                ) : (
                                    <span>Sign In with EVM Wallet</span>
                                )}
                            </button>
                            
                            {walletError && (
                                <p className="font-mono text-[0.65rem] text-rose-400 text-center">{walletError}</p>
                            )}

                            <button
                                type="button"
                                onClick={() => login('demo@trader.com')}
                                className="w-full font-mono text-xs text-muted hover:text-ink transition-colors py-1 pt-1"
                            >
                                Demo Login (no account needed)
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
