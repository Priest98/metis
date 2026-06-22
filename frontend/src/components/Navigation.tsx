'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/LogoMark';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Cpu, Play, History, Wallet, 
    BookOpen, Menu, X, LogOut, ShieldAlert 
} from 'lucide-react';

const APP_NAV = [
    { href: '/dashboard',   label: 'signals' },
    { href: '/strategies',  label: 'strategies' },
    { href: '/backtesting', label: 'backtest' },
    { href: '/knowledge',   label: 'knowledge' },
    { href: '/history',     label: 'history' },
    { href: '/faucet',      label: '⛽ faucet' },
];

const PUBLIC_NAV = [
    { href: '#how-it-works', label: 'how it works' },
    { href: '#signals',      label: 'signals' },
    { href: '/api-docs',     label: 'api' },
    { href: '/testimonials', label: 'testimonials' },
    { href: '/contact',      label: 'contact' },
];

export default function Navigation() {
    const pathname  = usePathname();
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [hovered,  setHovered]  = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 48);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const expanded = scrolled || hovered;
    const isActive = (path: string) => pathname === path;
    const links    = user ? APP_NAV : PUBLIC_NAV;

    return (
        <>
            {/* ── DESKTOP ONLY: FLOATING DYNAMIC ISLAND ────────────────────────── */}
            <div className="hidden md:flex fixed inset-x-0 top-4 z-50 justify-center px-4 pointer-events-none">
                <nav
                    className="pointer-events-auto flex items-center h-11 rounded-full border backdrop-blur-2xl transition-all duration-500"
                    style={{
                        background: 'var(--nav-bg)',
                        borderColor: expanded
                            ? 'rgba(var(--color-ink-rgb) / 0.13)'
                            : 'var(--color-hairline)',
                        boxShadow: expanded
                            ? `0 8px 40px var(--nav-shadow), 0 0 0 1px rgba(var(--color-accent-rgb) / 0.08)`
                            : `0 4px 20px var(--nav-shadow)`,
                        paddingLeft:  '6px',
                        paddingRight: '6px',
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    role="navigation"
                    aria-label="Main navigation"
                >
                    {/* Logo (always visible) */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 pl-2 pr-1 text-ink shrink-0"
                        aria-label="Metis — home"
                    >
                        <LogoMark width={16} height={16} />
                        <span
                            className="font-display text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden transition-all duration-500"
                            style={{
                                maxWidth:    expanded ? '130px' : '0px',
                                opacity:     expanded ? 1 : 0,
                                marginRight: expanded ? '2px' : '0px',
                            }}
                        >
                            Metis
                        </span>
                    </Link>

                    {/* Expandable middle */}
                    <div
                        className="flex items-center overflow-hidden transition-all duration-500"
                        style={{
                            maxWidth: expanded ? '640px' : '0px',
                            opacity:  expanded ? 1 : 0,
                        }}
                    >
                        {/* Left divider */}
                        <div className="h-4 w-px bg-ink/[0.08] mx-2 shrink-0" />

                        {/* Nav links */}
                        {links.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`
                                    font-mono text-xs px-3 py-1 whitespace-nowrap shrink-0
                                    transition-colors duration-200
                                    ${isActive(link.href) ? 'text-accent' : 'text-muted hover:text-ink'}
                                `}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Right divider */}
                        <div className="h-4 w-px bg-ink/[0.08] mx-2 shrink-0" />

                        {/* User / auth section */}
                        {user ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[0.6rem] text-muted px-1 hidden sm:block max-w-[88px] truncate">
                                    {user.email}
                                </span>
                                <button
                                    onClick={logout}
                                    className="font-mono text-[10px] border border-white/15 px-3 py-1 rounded-full text-muted hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
                                >
                                    logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="font-mono text-xs px-3 py-1 text-muted hover:text-ink transition-colors whitespace-nowrap shrink-0"
                            >
                                login
                            </Link>
                        )}
                    </div>

                    {/* Theme toggle (always visible) */}
                    <div className="px-1 shrink-0">
                        <ThemeToggle />
                    </div>

                    {/* CTA pill (always visible) */}
                    <Link
                        href={user ? '/dashboard' : '/login'}
                        className="
                            font-mono text-xs bg-ink text-background
                            px-4 py-1.5 rounded-full font-semibold
                            hover:bg-accent transition-colors
                            whitespace-nowrap shrink-0 ml-1
                        "
                    >
                        {user ? 'terminal →' : 'launch →'}
                    </Link>
                </nav>
            </div>


            {/* ── MOBILE ONLY: STICKY HEADER ──────────────────────────────────── */}
            <header className="flex md:hidden fixed inset-x-0 top-0 z-50 items-center justify-between h-14 px-5 border-b border-hairline bg-background/85 backdrop-blur-md select-none">
                <Link href="/" className="flex items-center gap-2 text-ink">
                    <LogoMark width={18} height={18} />
                    <span className="font-display text-base font-semibold tracking-tight">Metis</span>
                </Link>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex items-center justify-center w-11 h-11 border border-hairline text-ink rounded-full bg-white/5 active:bg-white/10 transition-colors"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>


            {/* ── MOBILE MENU DRAWER (OVERLAY) ────────────────────────────────── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-20 px-6 flex flex-col justify-between pb-8">
                        <div className="space-y-6">
                            <p className="eyebrow mb-2">Navigation Menu</p>
                            <nav className="flex flex-col gap-4">
                                {links.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`font-display text-xl font-bold py-2 border-b border-hairline ${
                                            isActive(link.href) ? 'text-accent' : 'text-ink/80 hover:text-ink'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                {user && (
                                    <Link
                                        href="/knowledge"
                                        className={`font-display text-xl font-bold py-2 border-b border-hairline ${
                                            isActive('/knowledge') ? 'text-accent' : 'text-ink/80 hover:text-ink'
                                        }`}
                                    >
                                        knowledge
                                    </Link>
                                )}
                            </nav>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-hairline">
                            {user ? (
                                <div className="space-y-3">
                                    <div className="bg-white/5 border border-hairline p-3.5 rounded-2xl flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-approve animate-pulse" />
                                        <span className="font-mono text-xs text-muted truncate max-w-[240px]">
                                            Terminal ID: {user.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 font-mono bg-block/15 text-block border border-block/30 py-3.5 rounded-full text-sm font-semibold hover:bg-block/20 transition-all active:scale-[0.98]"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Disconnect Terminal
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        href="/login"
                                        className="font-mono text-center border border-hairline py-3.5 rounded-full text-xs text-ink hover:border-accent hover:text-accent transition-colors"
                                    >
                                        login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="font-mono text-center bg-ink text-background py-3.5 rounded-full text-xs font-semibold hover:bg-accent transition-colors"
                                    >
                                        get started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>


            {/* ── MOBILE LOGGED-IN ONLY: STICKY BOTTOM NAVIGATION BAR ─────────── */}
            {user && (
                <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-background/90 backdrop-blur-md border-t border-hairline grid grid-cols-5 items-center select-none pb-safe">
                    {[
                        { href: '/dashboard',   label: 'feed',     icon: LayoutDashboard },
                        { href: '/strategies',  label: 'strategies', icon: Cpu },
                        { href: '/backtesting', label: 'backtest',   icon: Play },
                        { href: '/history',     label: 'history',    icon: History },
                        { href: '/faucet',      label: 'faucet',     icon: Wallet },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = isActive(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="flex flex-col items-center justify-center h-full w-full py-1 text-center group cursor-pointer"
                                style={{ minHeight: '48px' }}
                            >
                                <Icon 
                                    className={`w-5 h-5 transition-transform duration-200 group-active:scale-95 ${
                                        active ? 'text-accent' : 'text-muted group-hover:text-ink'
                                    }`} 
                                />
                                <span className={`font-mono text-[9px] mt-1 tracking-tight capitalize ${
                                    active ? 'text-accent font-bold' : 'text-muted/80'
                                }`}>
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            )}
        </>
    );
}
