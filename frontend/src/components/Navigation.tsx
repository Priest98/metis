'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoMark } from '@/components/LogoMark';

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
    { href: '/testimonials', label: 'testimonials' },
    { href: '/contact',      label: 'contact' },
];

export default function Navigation() {
    const pathname  = usePathname();
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [hovered,  setHovered]  = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 48);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const expanded = scrolled || hovered;
    const isActive = (path: string) => pathname === path;
    const links    = user ? APP_NAV : PUBLIC_NAV;

    return (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
            <nav
                className={`
                    pointer-events-auto flex items-center h-11
                    rounded-full border backdrop-blur-2xl
                    transition-all duration-500
                `}
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
                {/* ── Logo (always visible) ──────────────────── */}
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

                {/* ── Expandable middle ────────────────────────── */}
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
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="font-mono text-[0.6rem] text-muted px-1 hidden sm:block max-w-[88px] truncate">
                                {user.email}
                            </span>
                            <button
                                onClick={logout}
                                className="font-mono text-xs px-3 py-1 text-muted hover:text-ink transition-colors whitespace-nowrap"
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

                {/* ── Theme toggle (always visible) ─────────── */}
                <div className="px-1 shrink-0">
                    <ThemeToggle />
                </div>

                {/* ── CTA pill (always visible) ────────────── */}
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
    );
}
