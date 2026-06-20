'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="w-7 h-7 shrink-0" aria-hidden="true" />;
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-ink transition-colors shrink-0 relative"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* Sun — visible in dark mode (click to go light) */}
            <svg
                viewBox="0 0 20 20"
                width="14"
                height="14"
                fill="currentColor"
                className={`absolute transition-all duration-300 ${isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}
                aria-hidden="true"
            >
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.415 1.414l-.707.708a1 1 0 11-1.414-1.414l.707-.708zM17 10a1 1 0 100-2h-1a1 1 0 100 2h1zM5.636 14.95a1 1 0 011.414 1.415l-.707.707a1 1 0 11-1.414-1.414l.707-.708zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.95-.636a1 1 0 10-1.414-1.415l-.707.708a1 1 0 001.414 1.414l.707-.707zM4 10a1 1 0 100-2H3a1 1 0 100 2h1zm1.636-5.364A1 1 0 004.22 6.05l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 7a3 3 0 100 6 3 3 0 000-6z" />
            </svg>

            {/* Moon — visible in light mode (click to go dark) */}
            <svg
                viewBox="0 0 20 20"
                width="13"
                height="13"
                fill="currentColor"
                className={`absolute transition-all duration-300 ${!isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`}
                aria-hidden="true"
            >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
        </button>
    );
}
