import type { Metadata } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-space-grotesk',
    display: 'swap',
    weight: ['400', '500', '600', '700'],
})

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
    weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
    title: 'Metis — AI Trading Signals on Arc L1 · $0.001 USDC per insight',
    description:
        'AI-powered quantitative trading signals on demand. Gemini-driven regime detection, vectorized backtesting, and precise entry/SL/TP coordinates — pay $0.001 USDC per request via x402 on Arc L1. No subscription. No wasted capital.',
    keywords: [
        'AI trading signals', 'quantitative trading', 'Arc L1', 'USDC micropayments',
        'x402 payments', 'crypto signals', 'backtesting', 'regime detection',
        'Gemini AI trading', 'algorithmic trading', 'BTC signals', 'ETH signals',
        'on-chain trading', 'pay per signal', 'agentic trading'
    ],
    authors: [{ name: 'Metis' }],
    openGraph: {
        title: 'Metis — AI Trading Signals · Pay $0.001 per insight',
        description:
            'Gemini-powered regime detection, backtesting, and entry coordinates. Pay per insight via x402 on Arc L1. No monthly subscription.',
        url: 'https://metis.trade',
        siteName: 'Metis',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Metis — AI Trading Signals on Arc L1',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Metis — AI Trading Signals · $0.001 USDC per insight',
        description:
            'Gemini agents detect regimes, backtest strategies, and generate entry/SL/TP coordinates — pay per insight via x402 on Arc L1.',
        images: ['/og-image.png'],
    },
    alternates: {
        canonical: 'https://metis.trade',
    },
    robots: {
        index: true,
        follow: true,
    },
}


import AppShell from '@/components/AppShell';
import { ClientProviders } from '@/context/ClientProviders';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
            <body className="min-h-full flex flex-col bg-background text-ink">
                <ClientProviders>
                    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                        <AppShell>
                            {children}
                        </AppShell>
                    </ThemeProvider>
                </ClientProviders>
            </body>
        </html>
    )
}
