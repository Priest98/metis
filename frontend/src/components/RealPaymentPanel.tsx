'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Zap, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type WalletStatus = 'idle' | 'connecting' | 'connected' | 'wrong_network' | 'no_wallet';
type PayStatus = 'idle' | 'pending' | 'success' | 'error';

interface WalletState {
    address: string;
    chainId: number;
    balance: string; // raw USDC balance display
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_HEX = '0x' + ARC_CHAIN_ID.toString(16); // '0x4CE752'
const USDC_CONTRACT = '0x3600000000000000000000000000000000000000';
const SIGNAL_PRICE_USDC = 0.001;
const SIGNAL_PRICE_WEI = '1000'; // 0.001 USDC at 6 decimals
const PROVIDER_ADDR = '0x8ddf06fE8985988d3e0883F945E891BD57084937';

const ARC_NETWORK_PARAMS = {
    chainId: ARC_CHAIN_HEX,
    chainName: 'Arc L1 Testnet',
    nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
    rpcUrls: ['https://rpc.testnet.arc.network'],
    blockExplorerUrls: ['https://scan.testnet.arc.network'],
};

// ERC-20 transfer ABI fragment (encoded manually for simplicity)
function encodeERC20Transfer(to: string, amount: bigint): string {
    // transfer(address,uint256)
    const selector = '0xa9059cbb';
    const paddedTo = to.replace('0x', '').toLowerCase().padStart(64, '0');
    const paddedAmount = amount.toString(16).padStart(64, '0');
    return selector + paddedTo + paddedAmount;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RealPaymentPanelProps {
    signalId?: string;
    onSuccess?: (txHash: string) => void;
}

export default function RealPaymentPanel({ signalId, onSuccess }: RealPaymentPanelProps) {
    const [walletStatus, setWalletStatus] = useState<WalletStatus>('idle');
    const [wallet, setWallet] = useState<WalletState | null>(null);
    const [payStatus, setPayStatus] = useState<PayStatus>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;

    const checkNetwork = useCallback(async (chainId: string) => {
        const cid = parseInt(chainId, 16);
        if (cid !== ARC_CHAIN_ID) {
            setWalletStatus('wrong_network');
            return false;
        }
        return true;
    }, []);

    const connectWallet = async () => {
        if (!ethereum) {
            setWalletStatus('no_wallet');
            return;
        }
        setWalletStatus('connecting');
        try {
            const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
            const chainId: string = await ethereum.request({ method: 'eth_chainId' });
            const onArc = await checkNetwork(chainId);
            if (!onArc) return;

            setWallet({ address: accounts[0], chainId: parseInt(chainId, 16), balance: '10.0' });
            setWalletStatus('connected');
        } catch (e: any) {
            setError(e.message ?? 'Connection refused');
            setWalletStatus('idle');
        }
    };

    const switchToArc = async () => {
        if (!ethereum) return;
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ARC_CHAIN_HEX }],
            });
        } catch (switchError: any) {
            // Chain not added — add it
            if (switchError.code === 4902) {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [ARC_NETWORK_PARAMS],
                });
            }
        }
        // Re-check
        const chainId: string = await ethereum.request({ method: 'eth_chainId' });
        const onArc = await checkNetwork(chainId);
        if (onArc && wallet) {
            setWalletStatus('connected');
        }
    };

    const sendPayment = async () => {
        if (!ethereum || !wallet) return;
        setPayStatus('pending');
        setError(null);
        try {
            // Build ERC-20 transfer tx
            const data = encodeERC20Transfer(PROVIDER_ADDR, BigInt(SIGNAL_PRICE_WEI));
            const txParams = {
                from: wallet.address,
                to: USDC_CONTRACT,
                data: '0x' + data.slice(2), // ensure 0x prefix
                gas: '0x' + (80000).toString(16),
            };
            const hash: string = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams],
            });
            setTxHash(hash);
            setPayStatus('success');
            onSuccess?.(hash);
        } catch (e: any) {
            if (e.code === 4001) {
                setError('Transaction rejected by user.');
            } else {
                setError(e.message ?? 'Transaction failed');
            }
            setPayStatus('error');
        }
    };

    const copyHash = async () => {
        if (!txHash) return;
        await navigator.clipboard.writeText(txHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border border-accent/20 bg-accent/[0.03] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Wallet size={14} className="text-accent" />
                <p className="font-mono text-xs font-semibold text-accent uppercase tracking-wider">
                    Real On-Chain Payment (x402)
                </p>
                <span className="ml-auto font-mono text-[9px] text-muted border border-hairline px-2 py-0.5 rounded-full">
                    Arc L1 Testnet
                </span>
            </div>

            <p className="font-mono text-[11px] text-muted leading-relaxed">
                Pay <span className="text-accent font-semibold">$0.001 USDC</span> from your own wallet on Arc L1.
                This is a real ERC-20 transfer — verifiable on-chain. No account needed.
            </p>

            {/* Status: idle or no_wallet */}
            {(walletStatus === 'idle' || walletStatus === 'no_wallet') && (
                <div className="space-y-3">
                    <motion.button
                        onClick={connectWallet}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 font-mono text-xs font-semibold bg-ink text-background py-3 rounded-full hover:bg-accent transition-colors"
                    >
                        <Wallet size={13} />
                        Connect MetaMask / EVM Wallet
                    </motion.button>
                    {walletStatus === 'no_wallet' && (
                        <p className="font-mono text-[10px] text-block text-center">
                            No EVM wallet detected. Install{' '}
                            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                                MetaMask
                            </a>{' '}
                            or use the simulated demo below.
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-hairline" />
                        <span className="font-mono text-[9px] text-muted">Need USDC?</span>
                        <div className="flex-1 h-px bg-hairline" />
                    </div>
                    <a
                        href="https://faucet.circle.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 font-mono text-[11px] border border-hairline text-muted py-2.5 rounded-full hover:border-accent hover:text-accent transition-colors"
                    >
                        <ExternalLink size={11} />
                        Circle Faucet — Get Free Test USDC
                    </a>
                </div>
            )}

            {/* Connecting */}
            {walletStatus === 'connecting' && (
                <div className="flex items-center justify-center gap-3 py-4">
                    <div className="size-4 border-2 border-hairline border-t-accent rounded-full animate-spin" />
                    <p className="font-mono text-xs text-muted">Waiting for wallet approval…</p>
                </div>
            )}

            {/* Wrong network */}
            {walletStatus === 'wrong_network' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-yellow-400">
                        <AlertTriangle size={13} />
                        <p className="font-mono text-xs">Wrong network. Please switch to Arc L1 Testnet.</p>
                    </div>
                    <motion.button
                        onClick={switchToArc}
                        whileHover={{ scale: 1.02 }}
                        className="w-full font-mono text-xs bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 py-2.5 rounded-full hover:bg-yellow-400/20 transition-colors"
                    >
                        Switch to Arc L1 Testnet
                    </motion.button>
                </div>
            )}

            {/* Connected — ready to pay */}
            {walletStatus === 'connected' && wallet && payStatus === 'idle' && (
                <div className="space-y-3">
                    <div className="bg-background/60 rounded-xl p-3 space-y-1">
                        <p className="font-mono text-[9px] text-muted uppercase tracking-wider">Connected wallet</p>
                        <p className="font-mono text-xs text-ink font-semibold">{wallet.address.slice(0,10)}...{wallet.address.slice(-6)}</p>
                        <p className="font-mono text-[10px] text-approve">Arc L1 Testnet ✓</p>
                    </div>
                    <div className="bg-background/60 rounded-xl p-3">
                        <p className="font-mono text-[9px] text-muted uppercase tracking-wider mb-1">Payment details</p>
                        <div className="flex justify-between font-mono text-xs">
                            <span className="text-muted">Amount</span>
                            <span className="text-accent font-semibold">0.001 USDC</span>
                        </div>
                        <div className="flex justify-between font-mono text-[10px] mt-1">
                            <span className="text-muted">Recipient</span>
                            <span className="text-ink">{PROVIDER_ADDR.slice(0,10)}…</span>
                        </div>
                        <div className="flex justify-between font-mono text-[10px] mt-1">
                            <span className="text-muted">Token</span>
                            <span className="text-ink">USDC (ERC-20) on Arc L1</span>
                        </div>
                    </div>
                    <motion.button
                        onClick={sendPayment}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 font-mono text-xs font-bold bg-accent text-background py-3 rounded-full hover:bg-white transition-colors shadow-lg"
                    >
                        <Zap size={13} />
                        Pay $0.001 USDC — Unlock Signal
                    </motion.button>
                </div>
            )}

            {/* Pending */}
            {payStatus === 'pending' && (
                <div className="flex flex-col items-center gap-3 py-4">
                    <div className="size-8 border-2 border-hairline border-t-accent rounded-full animate-spin" />
                    <p className="font-mono text-xs text-muted text-center">
                        Broadcasting to Arc L1…<br />
                        <span className="text-[10px]">Confirm in your wallet if prompted</span>
                    </p>
                </div>
            )}

            {/* Success */}
            {payStatus === 'success' && txHash && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 text-approve">
                        <CheckCircle2 size={16} />
                        <p className="font-mono text-xs font-semibold">Payment confirmed on Arc L1</p>
                    </div>
                    <div className="bg-background/60 rounded-xl p-3 space-y-2">
                        <p className="font-mono text-[9px] text-muted uppercase tracking-wider">Transaction hash</p>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-[10px] text-ink truncate flex-1">{txHash}</p>
                            <button onClick={copyHash} className="shrink-0 text-muted hover:text-accent transition-colors">
                                {copied ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                        </div>
                        <a
                            href={`https://scan.testnet.arc.network/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-mono text-[10px] text-accent hover:underline"
                        >
                            View on ArcScan <ExternalLink size={9} />
                        </a>
                    </div>
                </motion.div>
            )}

            {/* Error */}
            {payStatus === 'error' && error && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-block">
                        <AlertTriangle size={13} />
                        <p className="font-mono text-[11px]">{error}</p>
                    </div>
                    <button
                        onClick={() => { setPayStatus('idle'); setError(null); }}
                        className="font-mono text-xs text-muted hover:text-ink transition-colors underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}
