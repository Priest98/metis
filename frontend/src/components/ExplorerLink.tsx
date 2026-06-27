'use client';

import React, { useState } from 'react';
import { ExternalLink, Check, Copy, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExplorerLinkProps {
    hash: string;
    type?: 'tx' | 'address';
    className?: string;
    label?: string;
}

export default function ExplorerLink({ hash, type = 'tx', className = '', label }: ExplorerLinkProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!hash) return null;

    // Detect if transaction hash is mock / local sandbox
    const isMock = hash.startsWith('0xarc') || 
                   hash.length < 42 || 
                   hash.includes('local') || 
                   hash.includes('mock') || 
                   // Static seeded transaction hashes from dev DB
                   hash === '0x9e9f7543044abd1c5032af649137fbcad1a52bf945e9cc2509c5e5bfe0ebc7f6' ||
                   hash === '0x0786f89c275e04865f103ff2089ad27d0d9759ffa1e5d900c7c58feb8a8ffff2' ||
                   hash === '0x0a02caec4c0846f7d090559ea8dc4fe4997de5d817cef41866c0791c9eafe0e1' ||
                   hash === '0xc24ee92d827ab3921c253019f8471584bfe61b69c5e5d3c3e6a3dfac04ee545e' ||
                   hash === '0xa15fb18df373d74005b7e7aa272b8c683771ec0e5ee323aaf70e5676bfa255e6' ||
                   hash === '0xbd02d199ec38811c6f2f3bbf401d372ecb8b0a9058d029d60155b90112725ec9' ||
                   hash === '0x161d91f5c0c30df23be4267537bdc9019131f61c092863132e5a26bdb299886d' ||
                   hash === '0x67744b73346a51cb055dc786600bda36772c89de8b778641d341ac0ce327b094' ||
                   hash === '0xb5bcffb0b76ca064b06e585480b5b01bc20f1fb56fdca569757d5cec1f06455b' ||
                   hash === '0x94fb6ca82f45c0c48bab78fa8df19275a5343f60d454132c57f0b7b4654fcd42';

    const handleCopy = () => {
        navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayLabel = label || (hash.length > 18 
        ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}` 
        : hash);

    if (isMock) {
        return (
            <>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    className={`inline-flex items-center gap-1 hover:text-accent underline decoration-dotted transition-colors font-mono cursor-pointer text-left ${className}`}
                >
                    <span className="truncate">{displayLabel}</span>
                    <Info className="w-2.5 h-2.5 shrink-0 opacity-60 hover:opacity-100" />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <div 
                            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm text-ink"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md border border-hairline bg-surface p-6 rounded-[1.5rem] relative z-10 shadow-2xl font-mono text-xs"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between pb-3 mb-4 border-b border-hairline">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-accent animate-pulse" />
                                        <span className="font-display font-semibold text-sm">Simulated Sandbox Record</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="text-muted hover:text-ink border border-hairline px-2.5 py-0.5 rounded-full text-[10px] cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-muted text-[11px] leading-relaxed">
                                        This record represents a sandboxed transaction executed within the Metis local simulation environment. Simulated transactions are signed and verified locally, but not broadcast to the public Arc L1 testnet explorer.
                                    </p>

                                    <div className="bg-background/40 border border-hairline p-3 rounded-xl space-y-1">
                                        <span className="text-[9px] text-muted block uppercase">Hash / Identifier</span>
                                        <span className="text-ink break-all font-semibold block select-all">{hash}</span>
                                    </div>

                                    <div className="bg-background/40 border border-hairline p-3 rounded-xl space-y-1">
                                        <span className="text-[9px] text-muted block uppercase">Status</span>
                                        <span className="text-approve font-bold block">✓ Local Sandbox Confirmed</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="border border-hairline bg-background/5 px-3 py-1.5 rounded-full hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-approve" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? 'Copied' : 'Copy Hash'}
                                        </button>
                                        <span className="text-[10px] text-muted italic">Gas cost: 0.00 USDC</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    // Real transaction hash link
    const explorerUrl = type === 'tx'
        ? `https://testnet.arcscan.app/tx/${hash}`
        : `https://testnet.arcscan.app/address/${hash}`;

    return (
        <span className="relative group inline-block">
            <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 hover:underline text-accent font-mono transition-all ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                <span className="truncate">{displayLabel}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
            {/* Tooltip to explain propagation delay */}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-normal bg-surface border border-hairline text-ink font-mono text-[9px] p-2 opacity-0 transition-opacity group-hover:opacity-100 shadow-xl w-[200px] text-center rounded-lg leading-normal">
                🔗 View on ArcScan Explorer.<br/>
                <span className="text-muted">Note: Indexing on testnet can take up to 30 seconds.</span>
            </span>
        </span>
    );
}
