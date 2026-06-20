import React from 'react';

interface LogoMarkProps {
    className?: string;
    width?: number;
    height?: number;
}

export function LogoMark({ className = '', width = 20, height = 20 }: LogoMarkProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={width}
            height={height}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            {/* Outer tactical shield shape */}
            <path
                d="M12 2L2 7v10l10 5 10-5V7L12 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            {/* The 'M' shaped owl brow / strategic chart path */}
            <path
                d="M6 8.5l6 4.5 6-4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Strategic chart vertical drop and branches */}
            <path
                d="M12 13v4.5M12 15l-3 2M12 15l3 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* The owl's eyes - glowing signals using theme-aware accent colors */}
            <circle cx="9.5" cy="11.5" r="1.5" fill="currentColor" className="fill-accent text-accent" />
            <circle cx="14.5" cy="11.5" r="1.5" fill="currentColor" className="fill-accent text-accent" />
        </svg>
    );
}
