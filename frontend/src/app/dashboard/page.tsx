'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import SignalCard from '@/components/SignalCard';
import AgentFleetTerminal from '@/components/AgentFleetTerminal';
import AgentLog from '@/components/AgentLog';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import api from '@/lib/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, RefreshCw, Radio, Wallet, BrainCircuit, Globe2, Copy, Check, Plus, Play, Pause, ExternalLink, CircleDollarSign, LogOut
} from 'lucide-react';

const generateChartData = (symbol: string) => {
    const points = 30;
    const data = [];
    let price = symbol === 'BTCUSDT' ? 62000 : symbol === 'ETHUSDT' ? 3300 : 135;
    const volatility = symbol === 'BTCUSDT' ? 400 : symbol === 'ETHUSDT' ? 25 : 1.5;

    for (let i = points; i >= 0; i--) {
        const time = new Date(Date.now() - i * 3600000);
        price = price + (Math.random() - 0.48) * volatility;
        data.push({
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: parseFloat(price.toFixed(2)),
        });
    }
    return data;
};

export default function Dashboard() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const shouldReduceMotion = useReducedMotion();
    const router = useRouter();
    const [signals, setSignals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
    const [chartData, setChartData] = useState<any[]>([]);
    const [livePriceInfo, setLivePriceInfo] = useState<{ price: string; pct: string; up: boolean } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Wallet Dashboard State
    const [activeTab, setActiveTab] = useState<'terminal' | 'wallet' | 'log'>('terminal');
    const [walletInfo, setWalletInfo] = useState<any>({ wallet_address: '', wallet_balance: 0.0, external_wallet: '' });
    const [txHistory, setTxHistory] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [externalWalletInput, setExternalWalletInput] = useState('');
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [copiedAgentAddress, setCopiedAgentAddress] = useState<string | null>(null);
    const [faucetLoading, setFaucetLoading] = useState(false);
    const [externalWalletLoading, setExternalWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);

    // Agent Creation State
    const [agentNameInput, setAgentNameInput] = useState('');
    const [agentBudgetInput, setAgentBudgetInput] = useState(1.0);
    const [agentBalanceInput, setAgentBalanceInput] = useState(5.0);
    const [createAgentLoading, setCreateAgentLoading] = useState(false);
    const [togglingYield, setTogglingYield] = useState<string | null>(null);

    // Agent Funding State
    const [fundAgentModalOpen, setFundAgentModalOpen] = useState(false);
    const [selectedAgentForFunding, setSelectedAgentForFunding] = useState<any>(null);
    const [fundingAmountInput, setFundingAmountInput] = useState<number>(5.0);
    const [fundingLoading, setFundingLoading] = useState(false);
    const [fundingError, setFundingError] = useState<string | null>(null);
    const [fundingSuccess, setFundingSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchSignals();
            fetchWalletInfo();
            fetchTxHistory();
            fetchAgents();
            setShowOnboarding(user.is_new_user === true);
        }
    }, [user]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchChartData = async () => {
            try {
                let binanceSymbol = selectedSymbol.toUpperCase();
                // Normalize symbol formatting: remove slash if any, ensure USDT suffix
                binanceSymbol = binanceSymbol.replace('/', '');
                if (!binanceSymbol.endsWith('USDT') && (binanceSymbol === 'BTC' || binanceSymbol === 'ETH' || binanceSymbol === 'SOL' || binanceSymbol === 'BNB')) {
                    binanceSymbol = `${binanceSymbol}USDT`;
                }

                // Fetch 30 hours of 1-hour klines from Binance API
                const klinesRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&limit=30`);
                if (!klinesRes.ok) {
                    throw new Error(`Failed to fetch klines for ${binanceSymbol}`);
                }
                const klinesData = await klinesRes.json();
                
                // Fetch 24hr ticker data for current price & percentage change
                const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
                if (!tickerRes.ok) {
                    throw new Error(`Failed to fetch ticker for ${binanceSymbol}`);
                }
                const tickerData = await tickerRes.json();

                if (!isMounted) return;

                const formattedKlines = klinesData.map((item: any) => {
                    const time = new Date(item[0]);
                    return {
                        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        price: parseFloat(parseFloat(item[4]).toFixed(2)),
                    };
                });

                setChartData(formattedKlines);

                const lastPrice = parseFloat(tickerData.lastPrice);
                const priceChangePercent = parseFloat(tickerData.priceChangePercent);
                
                let formattedPrice = '';
                if (lastPrice >= 1000) {
                    formattedPrice = `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                } else if (lastPrice >= 1) {
                    formattedPrice = `$${lastPrice.toFixed(2)}`;
                } else {
                    formattedPrice = `$${lastPrice.toFixed(4)}`;
                }

                setLivePriceInfo({
                    price: formattedPrice,
                    pct: (priceChangePercent >= 0 ? '+' : '') + priceChangePercent.toFixed(2) + '%',
                    up: priceChangePercent >= 0
                });
            } catch (err) {
                // If the pair is not supported on Binance (like EURUSD) or API fails, fall back to simulated data
                if (isMounted) {
                    const simulatedData = generateChartData(selectedSymbol);
                    setChartData(simulatedData);
                    if (simulatedData.length > 0) {
                        const lastPrice = simulatedData[simulatedData.length - 1].price;
                        const firstPrice = simulatedData[0].price;
                        const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
                        
                        let formattedPrice = '';
                        if (lastPrice >= 1000) {
                            formattedPrice = `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        } else if (lastPrice >= 1) {
                            formattedPrice = `$${lastPrice.toFixed(2)}`;
                        } else {
                            formattedPrice = `$${lastPrice.toFixed(4)}`;
                        }

                        setLivePriceInfo({
                            price: formattedPrice,
                            pct: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%',
                            up: changePercent >= 0
                        });
                    } else {
                        setLivePriceInfo(null);
                    }
                }
            }
        };

        fetchChartData();
        const interval = setInterval(fetchChartData, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedSymbol]);

    // Listen to global balance updates to refresh components instantly
    useEffect(() => {
        const handleBalanceUpdate = () => {
            fetchWalletInfo();
            fetchTxHistory();
            fetchAgents();
        };
        window.addEventListener('wallet_balance_updated', handleBalanceUpdate);
        return () => {
            window.removeEventListener('wallet_balance_updated', handleBalanceUpdate);
        };
    }, []);

    const fetchSignals = async () => {
        setIsRefreshing(true);
        try {
            const response = await api.get('/signals/history');
            setSignals(response.data);
            if (response.data && response.data.length > 0) {
                setSelectedSymbol(response.data[0].symbol);
            }
        } catch (error) {
            console.error('Failed to fetch signals:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchWalletInfo = async () => {
        try {
            const res = await api.get('/wallet/me');
            setWalletInfo(res.data);
            setExternalWalletInput(res.data.external_wallet || '');
        } catch (e) {
            console.error('Failed to fetch wallet info', e);
        }
    };

    const fetchTxHistory = async () => {
        try {
            const res = await api.get('/wallet/history');
            setTxHistory(res.data);
        } catch (e) {
            console.error('Failed to fetch transaction history', e);
        }
    };

    const fetchAgents = async () => {
        try {
            const res = await api.get('/wallet/agents');
            setAgents(res.data);
        } catch (e) {
            console.error('Failed to fetch agents', e);
        }
    };

    const handleFaucet = async () => {
        setFaucetLoading(true);
        try {
            const res = await api.post('/wallet/faucet');
            setWalletInfo((prev: any) => ({ ...prev, wallet_balance: res.data.wallet_balance }));
            fetchTxHistory();
        } catch (e) {
            console.error('Faucet seeding failed', e);
        } finally {
            setFaucetLoading(false);
        }
    };

    const openFundModal = (agent: any) => {
        setSelectedAgentForFunding(agent);
        setFundingAmountInput(5.0);
        setFundingError(null);
        setFundingSuccess(null);
        setFundAgentModalOpen(true);
    };

    const handleFundAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgentForFunding || fundingAmountInput <= 0) return;
        setFundingLoading(true);
        setFundingError(null);
        setFundingSuccess(null);
        try {
            await api.post(`/wallet/agents/${selectedAgentForFunding.id}/fund`, {
                amount: fundingAmountInput
            });
            setFundingSuccess(`Successfully funded agent on-chain!`);
            fetchAgents();
            fetchWalletInfo();
            fetchTxHistory();
            setTimeout(() => {
                setFundAgentModalOpen(false);
                setSelectedAgentForFunding(null);
                setFundingSuccess(null);
            }, 1500);
        } catch (err: any) {
            console.error('Failed to fund agent', err);
            const errMsg = err.response?.data?.detail || err.message || 'Funding failed';
            setFundingError(errMsg);
        } finally {
            setFundingLoading(false);
        }
    };

    const connectWallet = async () => {
        setIsConnectingWallet(true);
        setWalletError(null);
        setWalletSuccess(null);
        try {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts.length > 0) {
                    const connectedAddress = accounts[0];
                    setExternalWalletInput(connectedAddress);
                    
                    // Auto-link to save the user an extra step
                    setExternalWalletLoading(true);
                    try {
                        await api.post('/wallet/me/external', { external_wallet: connectedAddress });
                        setWalletInfo((prev: any) => ({ ...prev, external_wallet: connectedAddress }));
                        setWalletSuccess('EVM Wallet connected and linked successfully!');
                    } catch (linkErr: any) {
                        console.error('Failed to auto-link wallet after connection', linkErr);
                        let errMsg = linkErr.response?.data?.detail || linkErr.message || 'Connected, but failed to link to account.';
                        if (Array.isArray(errMsg)) {
                            errMsg = errMsg.map((d: any) => d.msg).join(', ');
                        } else if (typeof errMsg === 'object') {
                            errMsg = JSON.stringify(errMsg);
                        }
                        setWalletError(errMsg);
                    } finally {
                        setExternalWalletLoading(false);
                    }
                } else {
                    setWalletError('No accounts found.');
                }
            } else {
                setWalletError('No EVM wallet detected. Please install MetaMask.');
            }
        } catch (err: any) {
            console.error('Wallet connection error', err);
            setWalletError(err.message || 'Failed to connect wallet.');
        } finally {
            setIsConnectingWallet(false);
        }
    };

    const handleUpdateExternalWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        setExternalWalletLoading(true);
        setWalletError(null);
        setWalletSuccess(null);
        
        const trimmedAddress = externalWalletInput.trim();
        
        if (!trimmedAddress) {
            setWalletError('Wallet address cannot be empty.');
            setExternalWalletLoading(false);
            return;
        }
        
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!ethAddressRegex.test(trimmedAddress)) {
            setWalletError('Invalid Ethereum address format. Must start with 0x followed by 40 hex characters.');
            setExternalWalletLoading(false);
            return;
        }
        
        try {
            await api.post('/wallet/me/external', { external_wallet: trimmedAddress });
            setWalletInfo((prev: any) => ({ ...prev, external_wallet: trimmedAddress }));
            setExternalWalletInput(trimmedAddress);
            setWalletSuccess('External wallet linked successfully!');
        } catch (err: any) {
            console.error('Failed to update external wallet', err);
            let errMsg = err.response?.data?.detail || err.message || 'Failed to link wallet.';
            if (Array.isArray(errMsg)) {
                errMsg = errMsg.map((d: any) => d.msg).join(', ');
            } else if (typeof errMsg === 'object') {
                errMsg = JSON.stringify(errMsg);
            }
            setWalletError(errMsg);
        } finally {
            setExternalWalletLoading(false);
        }
    };

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentNameInput) return;
        setCreateAgentLoading(true);
        try {
            await api.post('/wallet/agents', {
                name: agentNameInput,
                daily_budget: agentBudgetInput,
                initial_balance: agentBalanceInput
            });
            setAgentNameInput('');
            setAgentBudgetInput(1.0);
            setAgentBalanceInput(5.0);
            fetchAgents();
            fetchWalletInfo();
            fetchTxHistory();
        } catch (e) {
            console.error('Failed to create agent', e);
        } finally {
            setCreateAgentLoading(false);
        }
    };

    const handleToggleAgentActive = async (agentId: string, currentStatus: boolean) => {
        try {
            await api.post(`/wallet/agents/${agentId}/budget`, {
                is_active: !currentStatus
            });
            fetchAgents();
        } catch (e) {
            console.error('Failed to update agent status', e);
        }
    };

    const handleToggleYieldLoop = async (agentId: string, currentStatus: boolean) => {
        setTogglingYield(agentId);
        try {
            await api.post(`/wallet/agents/${agentId}/yield/toggle`, {});
            fetchAgents();
            fetchWalletInfo();
            fetchTxHistory();
        } catch (e: any) {
            console.error('Failed to toggle agent yield loop', e);
            alert(e.response?.data?.detail || e.message || 'Toggle yield loop failed');
        } finally {
            setTogglingYield(null);
        }
    };

    const copyToClipboard = (text: string, isAgent = false, agentId: string | null = null) => {
        navigator.clipboard.writeText(text);
        if (isAgent && agentId) {
            setCopiedAgentAddress(agentId);
            setTimeout(() => setCopiedAgentAddress(null), 2000);
        } else {
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    if (authLoading || !user) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-6 w-6 animate-spin border-b-2 border-accent" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-ink pb-16 px-5 sm:px-8">
            <div className="max-w-6xl mx-auto">

                {/* ── Page Header ─────────────────────────────── */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-8 border-b border-hairline gap-4 mb-8">
                    <div>
                        <p className="eyebrow mb-2">live engine active</p>
                        <h1 className="font-display text-3xl font-semibold text-ink tracking-tight">QuantFlow Terminal</h1>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchSignals}
                            disabled={isRefreshing}
                            className="font-mono flex items-center gap-1.5 border border-hairline px-4 py-2 text-xs text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={logout}
                            className="font-mono flex items-center gap-1.5 border border-hairline px-4 py-2 text-xs text-ink transition-colors hover:border-block hover:text-block"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Onboarding Alert Banner */}
                {showOnboarding && (
                    <div className="mb-8 border border-accent bg-accent/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="eyebrow text-accent mb-1">Onboarding complete</p>
                            <p className="font-mono text-sm text-ink">
                                Your AI trading wallet is ready. You can now access and pay for signals instantly.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowOnboarding(false)}
                            className="font-mono border border-hairline px-4 py-2 text-xs text-ink hover:border-accent hover:text-accent transition-colors shrink-0"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex border-b border-hairline mb-8 gap-6">
                    <button
                        onClick={() => setActiveTab('terminal')}
                        className={`font-mono text-xs uppercase tracking-wider pb-3 border-b-2 transition-all ${
                            activeTab === 'terminal' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Quant Terminal Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={`font-mono text-xs uppercase tracking-wider pb-3 border-b-2 transition-all ${
                            activeTab === 'wallet' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Wallet &amp; Agent Manager
                    </button>
                    <button
                        onClick={() => setActiveTab('log')}
                        className={`font-mono text-xs uppercase tracking-wider pb-3 border-b-2 transition-all ${
                            activeTab === 'log' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Agent Log
                    </button>
                </div>

                {/* ── Main Layout ──────────────────────────────── */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Panel */}
                    <div className="flex-1 w-full min-w-0">
                        <AnimatePresence mode="wait">
                        {activeTab === 'log' ? (
                                <motion.div
                                    key="log"
                                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <p className="eyebrow mb-2">agent execution log</p>
                                        <p className="font-mono text-xs text-muted mb-4">Live step-by-step trace of each agent run — payment → regime → backtest → risk → signal.</p>
                                    </div>
                                    <AgentLog autoDemo={true} maxLines={60} />
                                </motion.div>
                            ) : activeTab === 'terminal' ? (
                                <motion.div
                                    key="terminal"
                                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-8"
                                >
                                    {/* Price Chart */}
                                    <div className="border border-hairline bg-surface p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <p className="eyebrow mb-1">active workspace</p>
                                                <div className="flex items-baseline gap-3">
                                                    <h3 className="font-display text-lg font-semibold text-ink">{selectedSymbol} Price Feed</h3>
                                                    {livePriceInfo && (
                                                        <span className="font-mono text-sm font-semibold flex items-center gap-1.5">
                                                            <span className="text-ink">{livePriceInfo.price}</span>
                                                            <span className={livePriceInfo.up ? 'text-approve text-xs' : 'text-block text-xs'}>
                                                                ({livePriceInfo.pct})
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].map((sym) => (
                                                    <button
                                                        key={sym}
                                                        onClick={() => setSelectedSymbol(sym)}
                                                        className={`font-mono px-3 py-1 text-xs transition-all border ${selectedSymbol === sym
                                                                ? 'border-accent text-accent bg-accent/5'
                                                                : 'border-hairline text-muted hover:text-ink hover:border-white/20'
                                                            }`}
                                                    >
                                                        {sym.replace('USDT', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-[280px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%"  stopColor="#D7FF3E" stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor="#D7FF3E" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.15)" fontSize={10} fontFamily="var(--font-jetbrains)" />
                                                    <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.15)" fontSize={10} fontFamily="var(--font-jetbrains)" />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0 }}
                                                        labelStyle={{ color: '#8b93a5', fontSize: '10px', fontFamily: 'var(--font-jetbrains)' }}
                                                        itemStyle={{ color: '#D7FF3E', fontSize: '12px', fontFamily: 'var(--font-jetbrains)' }}
                                                    />
                                                    <Area type="monotone" dataKey="price" stroke="#D7FF3E" strokeWidth={1.5} fillOpacity={1} fill="url(#priceGradient)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Autonomous Agent Fleet Terminal */}
                                    <AgentFleetTerminal />

                                    {/* Signals */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-4 border-b border-hairline">
                                            <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
                                            <p className="eyebrow">signal marketplace</p>
                                        </div>

                                        {loading ? (
                                            <div className="flex items-center justify-center py-20">
                                                <div className="h-6 w-6 animate-spin border-b-2 border-accent" />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {signals.map((signal) => (
                                                    <div key={signal.id} onClick={() => setSelectedSymbol(signal.symbol)} className="cursor-pointer">
                                                        <SignalCard signal={signal} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                /* Wallet Manager Tab View */
                                <motion.div
                                    key="wallet"
                                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-8"
                                >
                                    {/* Detailed Embedded Wallet Card */}
                                    <div className="border border-hairline bg-surface p-6">
                                        <p className="eyebrow mb-2">Embedded USDC Wallet</p>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-mono text-xs text-muted">Address:</span>
                                                    <span className="font-mono text-xs text-ink font-semibold break-all bg-background px-2.5 py-1 border border-hairline select-all">
                                                        {walletInfo?.wallet_address || '0x000...'}
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(walletInfo?.wallet_address || '')}
                                                        className="p-1 border border-hairline hover:border-accent text-muted hover:text-accent transition-colors"
                                                        title="Copy Address"
                                                    >
                                                        {copiedAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-mono text-3xl font-bold text-ink leading-none">
                                                        <AnimatedNumber value={walletInfo?.wallet_balance ?? 0.0} precision={6} />
                                                    </span>
                                                    <span className="font-mono text-sm text-accent font-semibold">USDC</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <p className="font-mono text-[10px] text-muted uppercase tracking-[0.15em]">
                                                        Arc L1 Sandbox Testnet Asset
                                                    </p>
                                                    <span className="text-muted font-mono text-[10px]">•</span>
                                                    <a
                                                        href="https://faucet.circle.com"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-[10px] text-accent hover:underline flex items-center gap-1"
                                                    >
                                                        Circle Faucet <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push('/faucet')}
                                                className="font-mono self-start md:self-center bg-accent text-background px-5 py-3 text-xs font-semibold hover:bg-white transition-colors"
                                            >
                                                ⛽ Go to Faucet
                                            </button>
                                        </div>

                                        {/* Link Secondary External Wallet */}
                                        <div className="mt-8 pt-6 border-t border-hairline">
                                            <p className="eyebrow mb-3">Optional External Wallet Connection</p>
                                            <div className="space-y-3 max-w-lg">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={connectWallet}
                                                        disabled={isConnectingWallet}
                                                        className="font-mono border border-hairline px-3 py-2 text-[10px] uppercase tracking-wider text-ink hover:border-accent hover:text-accent transition-colors disabled:opacity-40 shrink-0"
                                                    >
                                                        {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
                                                    </button>
                                                </div>
                                                
                                                <form onSubmit={handleUpdateExternalWallet} className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="0x..."
                                                        value={externalWalletInput}
                                                        onChange={(e) => setExternalWalletInput(e.target.value)}
                                                        className="flex-1 bg-background border border-hairline text-ink placeholder:text-muted px-4 py-2 text-xs font-mono focus:border-accent focus:outline-none transition-colors"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={externalWalletLoading}
                                                        className="font-mono border border-hairline px-4 py-2 text-xs text-ink hover:border-accent hover:text-accent transition-colors disabled:opacity-40 shrink-0"
                                                    >
                                                        {externalWalletLoading ? 'Saving...' : 'Link Wallet'}
                                                    </button>
                                                </form>
                                                
                                                {walletSuccess && (
                                                    <p className="font-mono text-[10px] text-[#22c55e]">{walletSuccess}</p>
                                                )}
                                                {walletError && (
                                                    <p className="font-mono text-[10px] text-rose-400">{walletError}</p>
                                                )}
                                            </div>
                                            <p className="font-mono text-[10px] text-muted mt-2">
                                                Specify a secondary external USDC wallet address for custom payouts.
                                            </p>
                                        </div>
                                    </div>

                                    {/* AI Agent Wallets & Budgets */}
                                    <div className="border border-hairline bg-surface p-6">
                                        <p className="eyebrow mb-4">Programmable AI Agent Wallets</p>

                                        {/* List Agents */}
                                        <div className="space-y-4 mb-8">
                                            {agents.map((agent) => (
                                                <div key={agent.id} className="border border-hairline p-4 bg-background flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="font-display text-sm font-semibold text-ink">{agent.name}</span>
                                                            <span className={`font-mono text-[9px] px-1.5 py-0.5 border ${
                                                                agent.is_active ? 'text-approve border-approve/30 bg-approve/5' : 'text-block border-block/30 bg-block/5'
                                                            }`}>
                                                                {agent.is_active ? 'ACTIVE' : 'PAUSED'}
                                                            </span>
                                                            {agent.yield_loop_active && (
                                                                <span className="font-mono text-[9px] px-1.5 py-0.5 border text-accent border-accent/30 bg-accent/5">
                                                                    YIELD ACTIVE (5.5% APY)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-2.5">
                                                            <span className="font-mono text-[10px] text-muted truncate max-w-xs">{agent.wallet_address}</span>
                                                            <button
                                                                onClick={() => copyToClipboard(agent.wallet_address, true, agent.id)}
                                                                className="text-muted hover:text-ink transition-colors"
                                                            >
                                                                {copiedAgentAddress === agent.id ? <Check className="w-3 h-3 text-approve" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                                            <span className="font-mono text-[10px] text-muted">Wallet Balance:</span>
                                                            <span className="font-mono text-[10px] text-ink font-semibold"><AnimatedNumber value={agent.wallet_balance} precision={6} /> USDC</span>
                                                            <span className="font-mono text-[10px] text-muted">Daily Spending Cap:</span>
                                                            <span className="font-mono text-[10px] text-ink font-semibold"><AnimatedNumber value={agent.daily_budget} precision={2} /> USDC</span>
                                                            <span className="font-mono text-[10px] text-muted">Spent Today:</span>
                                                            <span className="font-mono text-[10px] text-accent font-semibold"><AnimatedNumber value={agent.spent_today} precision={6} /> USDC</span>
                                                            <span className="font-mono text-[10px] text-muted">Yield Pool Balance:</span>
                                                            <span className="font-mono text-[10px] text-ink font-semibold"><AnimatedNumber value={agent.yield_loop_balance || 0.0} precision={6} /> USDC</span>
                                                            <span className="font-mono text-[10px] text-muted">Interest Accrued:</span>
                                                            <span className="font-mono text-[10px] text-approve font-semibold"><AnimatedNumber value={agent.yield_loop_interest_earned || 0.0} precision={8} /> USDC</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => openFundModal(agent)}
                                                            className="font-mono border border-accent/40 text-accent hover:border-accent px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <CircleDollarSign className="w-3.5 h-3.5" />
                                                            Fund Agent
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleAgentActive(agent.id, agent.is_active)}
                                                            className={`font-mono border px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                                                                agent.is_active
                                                                    ? 'border-block/40 text-block hover:border-block'
                                                                    : 'border-approve/40 text-approve hover:border-approve'
                                                            }`}
                                                        >
                                                            {agent.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                            {agent.is_active ? 'Pause Agent' : 'Resume Agent'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleYieldLoop(agent.id, agent.yield_loop_active)}
                                                            disabled={togglingYield === agent.id}
                                                            className={`font-mono border px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                                                                agent.yield_loop_active
                                                                    ? 'border-accent text-accent hover:bg-accent/5'
                                                                    : 'border-hairline text-muted hover:text-ink hover:border-white/20'
                                                            }`}
                                                        >
                                                            <RefreshCw className={`w-3.5 h-3.5 ${togglingYield === agent.id ? 'animate-spin' : ''}`} />
                                                            {agent.yield_loop_active ? 'Disable Yield' : 'Enable Yield'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Create Agent Form */}
                                        <div className="pt-6 border-t border-hairline">
                                            <h4 className="font-display text-sm font-semibold text-ink mb-4">Provision New AI Agent</h4>
                                            <form onSubmit={handleCreateAgent} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                <div className="md:col-span-2">
                                                    <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">Agent Identity</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. Risk Audit Agent"
                                                        value={agentNameInput}
                                                        onChange={(e) => setAgentNameInput(e.target.value)}
                                                        className="w-full bg-background border border-hairline text-ink placeholder:text-muted px-4 py-2.5 text-xs font-mono focus:border-accent focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">Daily Budget (USDC)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.0"
                                                        value={agentBudgetInput}
                                                        onChange={(e) => setAgentBudgetInput(parseFloat(e.target.value))}
                                                        className="w-full bg-background border border-hairline text-ink px-4 py-2.5 text-xs font-mono focus:border-accent focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">Funding (USDC)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.0"
                                                        value={agentBalanceInput}
                                                        onChange={(e) => setAgentBalanceInput(parseFloat(e.target.value))}
                                                        className="w-full bg-background border border-hairline text-ink px-4 py-2.5 text-xs font-mono focus:border-accent focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={createAgentLoading || !agentNameInput}
                                                    className="md:col-span-4 font-mono bg-ink text-background py-3 text-xs font-semibold hover:bg-accent transition-colors disabled:opacity-40"
                                                >
                                                    {createAgentLoading ? 'Provisioning Agent...' : 'Deploy Agent Wallet'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Ledger / Microtransaction history */}
                                    <div className="border border-hairline bg-surface p-6">
                                        <p className="eyebrow mb-4">Arc L1 Transaction History (Ledger)</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left font-mono text-xs text-muted border-collapse">
                                                <thead>
                                                    <tr className="border-b border-hairline text-[10px] uppercase text-muted">
                                                        <th className="py-2.5">Date</th>
                                                        <th>Transaction Hash</th>
                                                        <th>Purpose</th>
                                                        <th className="text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <AnimatePresence initial={false}>
                                                        {txHistory.length === 0 ? (
                                                            <motion.tr
                                                                key="empty"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                className="border-b border-hairline"
                                                            >
                                                                <td colSpan={4} className="py-8 text-center text-[11px] text-muted italic">
                                                                    No transactions logged. Use the faucet or unlock signals to seed the ledger.
                                                                </td>
                                                            </motion.tr>
                                                        ) : (
                                                            txHistory.map((tx) => (
                                                                <motion.tr
                                                                    key={tx.id}
                                                                    layout
                                                                    initial={{ opacity: 0, y: -8 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                                    className="border-b border-hairline hover:bg-white/[0.01]"
                                                                >
                                                                    <td className="py-3 pr-4 text-[10px]">
                                                                        {tx.created_at ? new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                                                    </td>
                                                                    <td className="font-mono text-[10px] text-accent pr-4">
                                                                        <a
                                                                            href={`https://testnet.arcscan.app/tx/${tx.tx_hash}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="hover:underline flex items-center gap-1 inline-flex"
                                                                        >
                                                                            {tx.tx_hash.substring(0, 12)}...{tx.tx_hash.substring(58)}
                                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                                        </a>
                                                                    </td>
                                                                    <td className="text-ink pr-4">{tx.purpose}</td>
                                                                    <td className="text-right font-semibold text-ink">
                                                                        {tx.sender_address === walletInfo?.wallet_address ? '-' : '+'}
                                                                        <AnimatedNumber value={tx.amount} precision={6} /> USDC
                                                                    </td>
                                                                </motion.tr>
                                                            ))
                                                        )}
                                                    </AnimatePresence>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Panel: Sidebar */}
                    <div className="w-full lg:w-[300px] shrink-0 space-y-5">

                        {/* Wallet Quick Card */}
                        <div
                            onClick={() => setActiveTab('wallet')}
                            className={`border bg-surface p-5 cursor-pointer transition-all hover:scale-[1.01] ${
                                activeTab === 'wallet' ? 'border-accent' : 'border-hairline hover:border-accent/40'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <p className="eyebrow">nanopayments wallet</p>
                                <a href="https://faucet.arc.network" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white transition-colors">
                                    <Wallet className="w-4 h-4" />
                                </a>
                            </div>
                            <span className="font-mono block text-2xl font-semibold text-ink leading-none">
                                <AnimatedNumber value={walletInfo?.wallet_balance ?? user?.wallet_balance ?? 0.0} precision={6} /> USDC
                            </span>
                            <span className="font-mono block text-[0.65rem] text-muted mt-1.5 uppercase tracking-[0.12em]">
                                Arc L1 Sandbox
                            </span>
                        </div>

                        {/* AI Copilot */}
                        <div className="border border-hairline bg-surface p-5">
                            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-hairline">
                                <BrainCircuit className="w-4 h-4 text-accent" />
                                <p className="eyebrow">ai copilot analysis</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between font-mono text-[11px] mb-1.5">
                                        <span className="text-muted uppercase tracking-[0.1em]">Market Sentiment</span>
                                        <span className="text-approve">78% BULLISH</span>
                                    </div>
                                    <div className="w-full bg-background h-1 border border-hairline overflow-hidden">
                                        <div className="bg-approve h-1" style={{ width: '78%' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between font-mono text-[11px] mb-1.5">
                                        <span className="text-muted uppercase tracking-[0.1em]">Vol Regime (Daily)</span>
                                        <span className="text-accent">HIGH VOLATILITY</span>
                                    </div>
                                    <div className="w-full bg-background h-1 border border-hairline overflow-hidden">
                                        <div className="bg-accent h-1" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Exchange Connectors */}
                        <div className="border border-hairline bg-surface p-5">
                            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-hairline">
                                <Globe2 className="w-4 h-4 text-accent" />
                                <p className="eyebrow">exchange connectors</p>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { name: 'Binance API',   status: 'CONNECTED', color: 'text-approve border-approve/30' },
                                    { name: 'Alpaca API',    status: 'SANDBOX',   color: 'text-review border-review/30' },
                                    { name: 'Polygon Feed',  status: 'ONLINE',    color: 'text-approve border-approve/30' },
                                ].map(c => (
                                    <div key={c.name} className="flex justify-between items-center p-2 border border-hairline">
                                        <span className="font-mono text-xs text-muted">{c.name}</span>
                                        <span className={`font-mono text-[0.6rem] uppercase tracking-[0.15em] border px-2 py-0.5 ${c.color}`}>{c.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Fund Agent Modal */}
            <AnimatePresence>
                {fundAgentModalOpen && selectedAgentForFunding && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md border border-hairline bg-surface p-6 relative z-10"
                        >
                            <h3 className="font-display text-lg font-semibold text-ink mb-2">
                                Fund Agent: {selectedAgentForFunding.name}
                            </h3>
                            <p className="font-mono text-[10px] text-muted mb-4 break-all">
                                Send USDC on-chain from your main wallet to: {selectedAgentForFunding.wallet_address}
                            </p>
                            
                            <form onSubmit={handleFundAgent} className="space-y-4">
                                <div>
                                    <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                                        Funding Amount (USDC)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0.0001"
                                        required
                                        value={fundingAmountInput}
                                        onChange={(e) => setFundingAmountInput(parseFloat(e.target.value))}
                                        className="w-full bg-background border border-hairline text-ink placeholder:text-muted px-4 py-2.5 text-xs font-mono focus:border-accent focus:outline-none transition-colors"
                                    />
                                </div>

                                {fundingError && (
                                    <p className="font-mono text-xs text-block">{fundingError}</p>
                                )}
                                {fundingSuccess && (
                                    <p className="font-mono text-xs text-approve">{fundingSuccess}</p>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFundAgentModalOpen(false);
                                            setSelectedAgentForFunding(null);
                                        }}
                                        className="font-mono border border-hairline px-4 py-2 text-xs text-muted hover:text-ink transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={fundingLoading}
                                        className="font-mono bg-accent text-background px-4 py-2 text-xs font-semibold hover:bg-white transition-colors disabled:opacity-40"
                                    >
                                        {fundingLoading ? 'Sending On-Chain...' : 'Confirm Funding'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
