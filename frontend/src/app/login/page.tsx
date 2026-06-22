'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/LogoMark';

export default function LoginPage() {
    const [authMethod, setAuthMethod] = useState<'email' | 'wallet'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

    return (
        <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Watermark & Diagonal Streaks */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden">
                <h1 className="font-display font-black text-[22vw] tracking-widest text-[#ffffff]/[0.015] select-none uppercase">
                    METIS
                </h1>
            </div>
            
            {/* Top Teal/Accent Glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-96 z-0"
                style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(215,255,62,0.06), transparent 70%)' }}
            />

            {/* Diagonal streak light effect */}
            <div 
                aria-hidden="true"
                className="pointer-events-none absolute -inset-[10px] opacity-10 z-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-12 scale-150"
            />

            <div className="w-full max-w-lg z-10 text-center space-y-8">
                {/* Brand Header */}
                <div className="flex flex-col items-center justify-center space-y-3">
                    <Link href="/" className="flex items-baseline gap-2 text-ink group w-fit">
                        <LogoMark width={20} height={20} />
                        <span className="font-display text-lg font-semibold tracking-tight group-hover:text-accent transition-colors">Metis</span>
                    </Link>
                    <div className="space-y-1">
                        <span className="text-accent font-mono text-[10px] sm:text-xs tracking-[0.25em] font-semibold uppercase block">
                            LET&apos;S CONNECT
                        </span>
                        <h1 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight leading-tight uppercase">
                            WITH METIS ECOSYSTEM
                        </h1>
                        <p className="font-mono text-xs text-muted max-w-sm mx-auto">
                            Seamlessly Enhance The Future Through Our Metis Technology
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="border border-hairline bg-[#111118]/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] text-left">
                    {/* Tabs */}
                    <div className="flex border border-hairline p-1 rounded-full bg-background/50 max-w-[280px] mx-auto mb-8">
                        <button
                            type="button"
                            onClick={() => setAuthMethod('email')}
                            className={`flex-1 py-2 px-5 rounded-full font-mono text-xs font-semibold transition-all duration-300 ${
                                authMethod === 'email'
                                    ? 'bg-[#1c1c28] border border-accent/20 text-accent shadow-md'
                                    : 'text-muted hover:text-ink'
                            }`}
                        >
                            Email account
                        </button>
                        <button
                            type="button"
                            onClick={() => setAuthMethod('wallet')}
                            className={`flex-1 py-2 px-5 rounded-full font-mono text-xs font-semibold transition-all duration-300 ${
                                authMethod === 'wallet'
                                    ? 'bg-[#1c1c28] border border-accent/20 text-accent shadow-md'
                                    : 'text-muted hover:text-ink'
                            }`}
                        >
                            EVM Wallet
                        </button>
                    </div>

                    {authMethod === 'email' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-2.5 block">
                                    Email
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-muted/60">
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                        </svg>
                                    </span>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#1c1c28]/60 border border-hairline text-ink placeholder:text-muted/40 pl-11 pr-4 py-3 rounded-full text-sm font-mono focus:border-accent/65 focus:outline-none transition-colors"
                                        placeholder="Enter your email here"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-2.5 block">
                                    Password
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-muted/60">
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#1c1c28]/60 border border-hairline text-ink placeholder:text-muted/40 pl-11 pr-12 py-3 rounded-full text-sm font-mono focus:border-accent/65 focus:outline-none transition-colors"
                                        placeholder="**********"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 text-muted/50 hover:text-accent transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="text-right mt-2">
                                    <Link href="#" className="font-mono text-[10px] text-accent hover:underline decoration-accent/40">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-accent/80 via-accent to-accent hover:opacity-95 text-background font-mono text-sm font-semibold rounded-full shadow-[0_8px_20px_rgba(215,255,62,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99] block text-center"
                            >
                                Sign In Now
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6 py-2">
                            <div className="text-center space-y-4">
                                <p className="font-mono text-xs text-muted leading-relaxed">
                                    Authenticate securely via cryptographic signature using your EVM / Ethereum wallet.
                                </p>
                                
                                <button
                                    type="button"
                                    onClick={handleWalletLogin}
                                    disabled={isConnecting}
                                    className="w-full flex items-center justify-center gap-2 bg-[#1c1c28] border border-hairline py-3.5 px-6 rounded-full font-mono text-sm text-ink hover:border-accent hover:text-accent transition-all duration-300 active:scale-[0.98]"
                                >
                                    {isConnecting ? (
                                        <>
                                            <span className="size-3.5 border-2 border-accent border-t-transparent animate-spin rounded-full" />
                                            <span>Signing Challenge...</span>
                                        </>
                                    ) : (
                                        <span>Connect & Sign Challenge</span>
                                    )}
                                </button>
                                
                                {walletError && (
                                    <p className="font-mono text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                                        {walletError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bottom toggle / link */}
                    <div className="text-center font-mono text-xs text-muted mt-8 pt-4 border-t border-hairline flex flex-col gap-2.5">
                        <div>
                            Don&apos;t have access yet?{' '}
                            <Link href="/signup" className="text-accent font-semibold hover:underline decoration-accent/40">
                                Sign Up
                            </Link>
                        </div>
                        
                        <button
                            type="button"
                            onClick={() => login('demo@trader.com')}
                            className="text-muted hover:text-ink text-[11px] hover:underline transition-colors block mx-auto mt-1"
                        >
                            Demo Login (no account needed)
                        </button>
                    </div>
                </div>

                {/* Footer copyright */}
                <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">
                    Copyright © 2026 Metis. All Rights Reserved.
                </p>
            </div>
        </main>
    );
}
