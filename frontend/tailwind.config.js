/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    // Theme toggled via .dark / .light class on <html> (next-themes)
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // All design tokens use CSS variables with opacity modifier support
                background: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-background-rgb) / ${opacityValue})`
                        : 'var(--color-background)',

                surface: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-surface-rgb) / ${opacityValue})`
                        : 'var(--color-surface)',

                ink: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-ink-rgb) / ${opacityValue})`
                        : 'var(--color-ink)',

                muted: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-muted-rgb) / ${opacityValue})`
                        : 'var(--color-muted)',

                accent: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-accent-rgb) / ${opacityValue})`
                        : 'var(--color-accent)',

                approve: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-approve-rgb) / ${opacityValue})`
                        : 'var(--color-approve)',

                review: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-review-rgb) / ${opacityValue})`
                        : 'var(--color-review)',

                block: ({ opacityValue }: { opacityValue?: string }) =>
                    opacityValue !== undefined
                        ? `rgb(var(--color-block-rgb) / ${opacityValue})`
                        : 'var(--color-block)',

                // hairline has rgba built-in — use the var directly
                hairline: 'var(--color-hairline)',
            },
            fontFamily: {
                display: ['var(--font-inter)',         'sans-serif'],
                sans:    ['var(--font-roboto)',        'sans-serif'],
                mono:    ['var(--font-jetbrains)',     'monospace'],
                body:    ['var(--font-roboto)',        'sans-serif'],
                heading: ['var(--font-inter)',         'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            keyframes: {
                ticker: {
                    from: { transform: 'translateX(0)' },
                    to:   { transform: 'translateX(-50%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%':      { transform: 'translateY(-8px)' },
                },
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                ticker:    'ticker 40s linear infinite',
                float:     'float 6s ease-in-out infinite',
                'fade-in': 'fade-in 0.6s ease both',
            },
        },
    },
    plugins: [],
}
