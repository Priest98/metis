'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import SignalCard from '@/components/SignalCard';
import AgentFleetTerminal from '@/components/AgentFleetTerminal';
import AgentLog from '@/components/AgentLog';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import DemoSimulator from '@/components/DemoSimulator';
import AgentLeaderboard from '@/components/AgentLeaderboard';
import LivePaymentFeed from '@/components/LivePaymentFeed';
import AgentNetworkGraph from '@/components/AgentNetworkGraph';
import api from '@/lib/api';
import {
    Activity, RefreshCw, Wallet, BrainCircuit, Globe2, Copy, Check, Plus, Play, Pause, ExternalLink, CircleDollarSign, LogOut, Cpu, Shield, Zap, Search, Bell, Sun, Moon, MoreHorizontal, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function Dashboard() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const shouldReduceMotion = useReducedMotion();
    const router = useRouter();

    const [signals, setSignals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
    const [livePriceInfo, setLivePriceInfo] = useState<{ price: string; pct: string; up: boolean } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Mockup navigation tab state
    const [activeNavTab, setActiveNavTab] = useState<'dashboard' | 'trade' | 'market' | 'analytics' | 'portfolio' | 'otc'>('dashboard');

    // Wallet & Agent Data
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

    // Agent Marketplace Catalog State
    const [marketplaceAgents, setMarketplaceAgents] = useState<any[]>([
        { id: '1', name: 'BTC Alpha Agent', type: 'Signal', accuracy: 84, price: 0.001, reputation: 96, revenue: 14.50, creator: 'System', status: 'Active', address: '0x8f93a9b1c720481dad32', signals: 1240, failed: 210, desc: 'Scans high-probability BTC breakout patterns using custom Bollinger Band squeezing logic.' },
        { id: '2', name: 'ETH Momentum Agent', type: 'Signal', accuracy: 78, price: 0.0008, reputation: 92, revenue: 8.90, creator: 'System', status: 'Active', address: '0x3c2b9a71f0921a83efd2', signals: 980, failed: 215, desc: 'Identifies strong short-term ETH trends using RSI divergence checks and volume spread analysis.' },
        { id: '3', name: 'Risk Guardian', type: 'Risk', accuracy: 98, price: 0.0005, reputation: 98, revenue: 4.85, creator: 'System', status: 'Active', address: '0xfa72910c830e294b61ef', signals: 2220, failed: 45, desc: 'Computes multi-timeframe correlation matrices and validates risk-to-reward ratios before allowing execution.' },
        { id: '4', name: 'Sentiment Oracle', type: 'Sentiment', accuracy: 74, price: 0.0003, reputation: 90, revenue: 2.10, creator: 'System', status: 'Active', address: '0x291a82d0194bc82d0b81', signals: 1540, failed: 400, desc: 'Processes real-time Twitter/X sentiment and macroeconomic news context via specialized LLM embeddings.' },
        { id: '5', name: 'Arbitrage Strategy Agent', type: 'Strategy', accuracy: 88, price: 0.0015, reputation: 95, revenue: 22.40, creator: 'System', status: 'Active', address: '0x991b2c40381f9a2b8e0c', signals: 540, failed: 65, desc: 'Coordinates execution across multiple DeFi pools, balancing yield rates and gas friction.' }
    ]);
    const [selectedMarketplaceAgent, setSelectedMarketplaceAgent] = useState<any | null>(null);

    // Agent Creation Form State
    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentType, setNewAgentType] = useState('Signal');
    const [newAgentStrategy, setNewAgentStrategy] = useState('Momentum Squeeze');
    const [newAgentBudget, setNewAgentBudget] = useState('0.001000');

    // Funding Modal State
    const [fundAgentModalOpen, setFundAgentModalOpen] = useState(false);
    const [selectedAgentForFunding, setSelectedAgentForFunding] = useState<any>(null);
    const [fundingAmountInput, setFundingAmountInput] = useState<number>(5.0);
    const [fundingLoading, setFundingLoading] = useState(false);
    const [fundingError, setFundingError] = useState<string | null>(null);
    const [fundingSuccess, setFundingSuccess] = useState<string | null>(null);
    const [togglingYield, setTogglingYield] = useState<string | null>(null);

    const [agentNameInput, setAgentNameInput] = useState('');
    const [agentBudgetInput, setAgentBudgetInput] = useState(1.0);
    const [agentBalanceInput, setAgentBalanceInput] = useState(5.0);
    const [createAgentLoading, setCreateAgentLoading] = useState(false);

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
        const fetchLivePrices = async () => {
            try {
                let binanceSymbol = selectedSymbol.toUpperCase().replace('/', '');
                if (!binanceSymbol.endsWith('USDT') && ['BTC', 'ETH', 'SOL', 'BNB'].includes(binanceSymbol)) {
                    binanceSymbol = `${binanceSymbol}USDT`;
                }
                const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
                if (tickerRes.ok) {
                    const tickerData = await tickerRes.json();
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
                }
            } catch (err) {
                console.error('Failed to fetch live symbol price:', err);
            }
        };

        fetchLivePrices();
        const interval = setInterval(fetchLivePrices, 10000);
        return () => clearInterval(interval);
    }, [selectedSymbol]);

    // Listen to global balance updates
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

    const handleCreateNewAgent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgentName) return;
        const newId = String(marketplaceAgents.length + 1);
        const randomAddress = '0x' + Array.from({length: 20}, () => Math.floor(Math.random()*16).toString(16)).join('');
        const newAgent = {
            id: newId,
            name: newAgentName,
            type: newAgentType,
            accuracy: 80,
            price: parseFloat(newAgentBudget) || 0.001,
            reputation: 80,
            revenue: 0.0,
            creator: 'User',
            status: 'Active',
            address: randomAddress,
            signals: 0,
            failed: 0,
            desc: `Custom user-instantiated agent executing ${newAgentStrategy} rules.`
        };
        setMarketplaceAgents(prev => [...prev, newAgent]);
        setNewAgentName('');
        alert(`Agent "${newAgentName}" successfully provisioned at address ${randomAddress}!`);
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
                    setExternalWalletLoading(true);
                    try {
                        await api.post('/wallet/me/external', { external_wallet: connectedAddress });
                        setWalletInfo((prev: any) => ({ ...prev, external_wallet: connectedAddress }));
                        setWalletSuccess('EVM Wallet connected and linked successfully!');
                    } catch (linkErr: any) {
                        console.error('Failed to link wallet', linkErr);
                        setWalletError(linkErr.response?.data?.detail || linkErr.message || 'Failed to link wallet.');
                    } finally {
                        setExternalWalletLoading(false);
                    }
                }
            } else {
                setWalletError('No EVM wallet detected. Please install MetaMask.');
            }
        } catch (err: any) {
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
        try {
            await api.post('/wallet/me/external', { external_wallet: trimmedAddress });
            setWalletInfo((prev: any) => ({ ...prev, external_wallet: trimmedAddress }));
            setWalletSuccess('External wallet linked successfully!');
        } catch (err: any) {
            setWalletError(err.response?.data?.detail || err.message || 'Failed to link wallet.');
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
            <main className="min-h-screen bg-[#06060c] flex items-center justify-center">
                <div className="h-6 w-6 animate-spin border-b-2 border-purple-500" />
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-[#06060c] text-[#ECEEF4] font-sans selection:bg-[#7c3aed] selection:text-white pb-12">
            
            {/* ─── STYLED COINIX NAVBAR ─── */}
            <header className="border-b border-white/[0.04] bg-[#06060c]/50 backdrop-blur-md sticky top-0 z-40">
                <div className="mx-auto max-w-7xl px-6 h-18 flex items-center justify-between">
                    
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center border border-white/10">
                            <svg className="size-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />
                            </svg>
                        </div>
                        <span className="font-display text-base font-bold tracking-tight text-white uppercase">Coinix</span>
                    </div>

                    {/* Navigation tabs */}
                    <nav className="hidden lg:flex items-center bg-[#11111d] border border-white/[0.04] p-1 rounded-full">
                        {[
                            { id: 'dashboard', label: 'Dashboard' },
                            { id: 'trade', label: 'Trade' },
                            { id: 'market', label: 'Market' },
                            { id: 'analytics', label: 'Analytics' },
                            { id: 'portfolio', label: 'Portfolio' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveNavTab(t.id as any)}
                                className={`font-mono text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-300 ${
                                    activeNavTab === t.id
                                        ? 'bg-white text-black font-bold shadow-md'
                                        : 'text-[#8b93a5] hover:text-white'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>

                    {/* Right Tools row */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-[#8b93a5] hover:text-white transition-colors" aria-label="Search">
                            <Search className="size-4.5" />
                        </button>
                        <button className="p-2 text-[#8b93a5] hover:text-white transition-colors relative" aria-label="Notifications">
                            <Bell className="size-4.5" />
                            <span className="absolute top-1.5 right-1.5 size-1.5 bg-[#8b5cf6] rounded-full" />
                        </button>
                        <div className="hidden sm:flex border border-white/[0.04] bg-[#12121e]/30 rounded-full p-0.5">
                            <button className="p-1.5 text-white bg-white/5 rounded-full" aria-label="Light mode">
                                <Sun className="size-3.5" />
                            </button>
                            <button className="p-1.5 text-[#8b93a5] hover:text-white" aria-label="Dark mode">
                                <Moon className="size-3.5" />
                            </button>
                        </div>
                        
                        {/* Profile display & logout */}
                        <div className="flex items-center gap-2.5 border-l border-white/[0.06] pl-4">
                            <div className="size-8 rounded-full bg-[#1b1b2f] border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-400">
                                {user?.email ? user.email.slice(0, 2).toUpperCase() : 'DS'}
                            </div>
                            <span className="hidden md:inline font-mono text-xs text-[#8b93a5]">
                                {user?.email ? user.email.split('@')[0] : 'Dylan Stone'}
                            </span>
                            <button 
                                onClick={logout} 
                                className="p-2 text-[#8b93a5] hover:text-[#ff5d5d] transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Tab Selectors */}
            <div className="lg:hidden mx-auto max-w-7xl px-6 mt-4">
                <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar border-b border-white/[0.04]">
                    {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'trade', label: 'Trade' },
                        { id: 'market', label: 'Market' },
                        { id: 'analytics', label: 'Analytics' },
                        { id: 'portfolio', label: 'Portfolio' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveNavTab(t.id as any)}
                            className={`shrink-0 font-mono text-xs font-semibold px-4.5 py-2 rounded-full border ${
                                activeNavTab === t.id
                                    ? 'bg-white border-white text-black'
                                    : 'border-white/[0.06] bg-[#12121e]/30 text-[#8b93a5]'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── MAIN CONTENT CONTAINER ─── */}
            <main className="mx-auto max-w-7xl px-6 mt-8">
                
                <AnimatePresence mode="wait">
                    
                    {/* TAB 1: COINIX GRAPHIC DASHBOARD VIEW */}
                    {activeNavTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Welcome Hero header Row */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="text-left">
                                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                                        Welcome, {user?.email ? user.email.split('@')[0] : 'Dylan Stone'}
                                    </h1>
                                    <p className="text-xs text-[#8b93a5] mt-1.5">
                                        Track user activity, trading trends, and crypto revenue with real time analytics.
                                    </p>
                                </div>

                                {/* Four mini metrics right-hand stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 shrink-0">
                                    {[
                                        { label: 'Expenses', value: '$3,120', change: '-5.6%', isUp: false },
                                        { label: 'Savings', value: '$4,200', change: '+9.1%', isUp: true },
                                        { label: 'Investing', value: '$8,540', change: '+15.4%', isUp: true },
                                        { label: 'Trading', value: '$12,368', change: '+32.7%', isUp: true }
                                    ].map((m, idx) => (
                                        <div key={idx} className="border border-white/[0.04] bg-[#12121e]/40 p-4 rounded-2xl text-left">
                                            <span className="font-mono text-[9px] text-[#8b93a5] uppercase block mb-1">{m.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-display text-sm font-bold text-white">{m.value}</span>
                                                <span className={`font-mono text-[8px] font-semibold px-1.5 py-0.5 rounded ${
                                                    m.isUp ? 'text-[#22c787] bg-[#22c787]/10' : 'text-[#ff5d5d] bg-[#ff5d5d]/10'
                                                }`}>
                                                    {m.change}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dashboard Core Grid (Total Balance, Your Assets, Leaders) */}
                            <div className="grid lg:grid-cols-12 gap-8 items-start">
                                
                                {/* Col 1: Balance & Top Assets Table */}
                                <div className="lg:col-span-4 space-y-8">
                                    
                                    {/* Total Balance Card */}
                                    <div className="border border-white/[0.06] bg-[#12121e]/30 p-6 rounded-[2rem] text-left relative overflow-hidden shadow-xl">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                                        
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-[#1b1b2f] border border-white/[0.04] rounded-lg text-[#8b93a5]">
                                                    <Wallet className="size-3.5" />
                                                </div>
                                                <span className="font-mono text-[10px] text-[#8b93a5] uppercase tracking-wider">Total Balance</span>
                                            </div>
                                            <span className="font-mono text-[9px] text-purple-400 font-bold border border-purple-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider bg-purple-500/5">
                                                USD
                                            </span>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <div className="font-display text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                                                    <span>$</span>
                                                    <span>{(403540.26 + walletInfo.wallet_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <span className="font-mono text-[8px] text-[#8b93a5] uppercase block mt-1.5">
                                                    Includes {(walletInfo.wallet_balance).toFixed(2)} USDC Embedded Wallet Balance
                                                </span>
                                            </div>

                                            {/* Quick Actions Row */}
                                            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/[0.04]">
                                                <button
                                                    onClick={() => setActiveNavTab('portfolio')}
                                                    className="font-mono text-[10px] font-semibold bg-white text-black hover:bg-purple-400 hover:text-white py-2.5 rounded-full transition-colors flex items-center justify-center gap-1"
                                                >
                                                    Deposit
                                                </button>
                                                <button
                                                    onClick={() => setActiveNavTab('portfolio')}
                                                    className="font-mono text-[10px] font-semibold bg-[#1c1c2b] text-white hover:bg-white/10 py-2.5 rounded-full transition-colors flex items-center justify-center gap-1"
                                                >
                                                    Withdraw
                                                </button>
                                                <button
                                                    onClick={() => setActiveNavTab('portfolio')}
                                                    className="font-mono text-[10px] font-semibold bg-[#1c1c2b] text-white hover:bg-white/10 py-2.5 rounded-full transition-colors flex items-center justify-center gap-1"
                                                >
                                                    Transfer
                                                </button>
                                                <button
                                                    onClick={() => setActiveNavTab('portfolio')}
                                                    className="font-mono text-[10px] font-semibold bg-[#1c1c2b] text-white hover:bg-white/10 py-2.5 rounded-full transition-colors flex items-center justify-center gap-1"
                                                >
                                                    Swap
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Assets Card */}
                                    <div className="border border-white/[0.04] bg-[#12121e]/30 p-6 rounded-[2rem] text-left">
                                        <div className="mb-4">
                                            <h3 className="font-display font-bold text-sm text-white">Top Assets</h3>
                                            <span className="font-mono text-[9px] text-[#8b93a5] block mt-0.5">Asset allocations by value</span>
                                        </div>

                                        <div className="space-y-3 font-mono text-xs">
                                            {[
                                                { name: 'Solana', sym: 'SOL', price: '$0.2724', pct: '+2.85%', isUp: true },
                                                { name: 'Avalanche', sym: 'AVAX', price: '$17.89', pct: '-0.85%', isUp: false },
                                                { name: 'Polkadot', sym: 'DOT', price: '$6.23', pct: '+3.40%', isUp: true },
                                                { name: 'Ethereum', sym: 'ETH', price: '$1,850.75', pct: '-1.15%', isUp: false },
                                                { name: 'Cardano', sym: 'ADA', price: '$0.4352', pct: '+0.75%', isUp: true }
                                            ].map((a) => (
                                                <div key={a.sym} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-6 rounded-lg bg-[#1b1b2f] flex items-center justify-center text-[10px] font-bold text-white">
                                                            {a.sym.slice(0,2)}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-white block text-[11px] leading-tight">{a.name}</span>
                                                            <span className="text-[8px] text-[#8b93a5] block leading-tight">{a.sym}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-white block text-[11px] font-semibold">{a.price}</span>
                                                        <span className={`text-[8px] font-bold block ${a.isUp ? 'text-[#22c787]' : 'text-[#ff5d5d]'}`}>
                                                            {a.pct}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Your Assets Grid & Leaders */}
                                <div className="lg:col-span-8 space-y-8">
                                    
                                    <div className="grid md:grid-cols-12 gap-8 items-start">
                                        
                                        {/* Your Assets Grid (8 cols) */}
                                        <div className="md:col-span-7 space-y-6 text-left">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-display font-bold text-sm text-white">Your assets</h3>
                                                    <span className="font-mono text-[9px] text-[#8b93a5] block mt-0.5">Live tracking your assets</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-mono text-[8px] text-[#8b93a5]">
                                                    <span>Updated 10 sec</span>
                                                    <RefreshCw className="size-2.5 animate-spin" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { name: 'Cardano', pair: 'ADA/USDT', balance: '$3,420', pct: '+5.1%', isUp: true },
                                                    { name: 'Solana', pair: 'SOL/USDT', balance: '$168.75', pct: '+3.2%', isUp: true },
                                                    { name: 'Avalanche', pair: 'AVAX/USDT', balance: '$35.40', pct: '+6.0%', isUp: true },
                                                    { name: 'Polkadot', pair: 'DOT/USDT', balance: '$24.89', pct: '+2.8%', isUp: true }
                                                ].map((a, idx) => (
                                                    <div key={idx} className="border border-white/[0.04] bg-[#12121e]/30 p-5 rounded-2xl hover:border-purple-500/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="size-5 rounded bg-[#1b1b2f] flex items-center justify-center font-bold text-[9px] text-white">
                                                                    {a.name.slice(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <span className="font-display font-bold text-[10px] text-white block leading-tight">{a.name}</span>
                                                                    <span className="font-mono text-[7px] text-[#8b93a5] block leading-tight">{a.pair}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline justify-between font-mono mt-4">
                                                            <span className="text-sm font-bold text-white">{a.balance}</span>
                                                            <span className={`text-[8px] font-bold ${a.isUp ? 'text-[#22c787]' : 'text-[#ff5d5d]'}`}>
                                                                {a.pct}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Market Leaders (5 cols) */}
                                        <div className="md:col-span-5 border border-white/[0.04] bg-[#12121e]/30 p-6 rounded-[2rem] text-left">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-display font-bold text-sm text-white">Market Leaders</h3>
                                                <div className="flex bg-[#11111d] p-0.5 border border-white/[0.04] rounded-lg font-mono text-[8px] font-bold">
                                                    <span className="px-2 py-1 text-[#8b93a5]">Week</span>
                                                    <span className="px-2 py-1 bg-white text-black rounded-md">Month</span>
                                                </div>
                                            </div>

                                            {/* Colored Capsule Progress row */}
                                            <div className="flex gap-2.5 mb-6">
                                                <div className="flex-1 space-y-1.5 text-center">
                                                    <span className="font-mono text-[8px] text-[#22c787] font-semibold block">+3.1%</span>
                                                    <div className="h-6 w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />
                                                </div>
                                                <div className="flex-1 space-y-1.5 text-center">
                                                    <span className="font-mono text-[8px] text-purple-400 font-semibold block">+2.4%</span>
                                                    <div className="h-6 w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-80" />
                                                </div>
                                                <div className="flex-1 space-y-1.5 text-center">
                                                    <span className="font-mono text-[8px] text-pink-400 font-semibold block">+1.3%</span>
                                                    <div className="h-6 w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 opacity-80" />
                                                </div>
                                            </div>

                                            <div className="space-y-3.5 font-mono text-xs pt-4 border-t border-white/[0.04]">
                                                {[
                                                    { name: 'Bitcoin', sym: 'BTC', price: '$2,384.00', color: 'bg-blue-400' },
                                                    { name: 'Ethereum', sym: 'ETH', price: '$1,834.50', color: 'bg-purple-400' },
                                                    { name: 'Cardano', sym: 'ADA', price: '$834.50', color: 'bg-pink-400' }
                                                ].map((coin) => (
                                                    <div key={coin.sym} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`size-1.5 rounded-full ${coin.color}`} />
                                                            <span className="text-white font-semibold">{coin.name}</span>
                                                            <span className="text-[#8b93a5] text-[9px]">({coin.sym})</span>
                                                        </div>
                                                        <span className="text-[#8b93a5] font-semibold">{coin.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    {/* Transactions History Card */}
                                    <div className="border border-white/[0.04] bg-[#12121e]/30 p-6 rounded-[2rem] text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h3 className="font-display font-bold text-sm text-white">Transactions History</h3>
                                                <span className="font-mono text-[9px] text-[#8b93a5] block mt-0.5">Asset validation logs</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search"
                                                        className="bg-transparent border border-white/[0.04] text-white placeholder:text-[#8b93a5]/35 pl-7 pr-3 py-1.5 rounded-lg text-[9px] font-mono focus:outline-none"
                                                    />
                                                    <Search className="absolute left-2.5 top-2.5 size-3 text-[#8b93a5]/40" />
                                                </div>
                                                <div className="flex bg-[#11111d] p-0.5 border border-white/[0.04] rounded-lg font-mono text-[7px] font-bold">
                                                    {['1D', '7D', '1M', '1Y'].map(t => (
                                                        <span key={t} className={`px-1.5 py-1 ${t === '1Y' ? 'bg-white text-black rounded' : 'text-[#8b93a5]'}`}>{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left font-mono text-[10px] text-[#8b93a5] border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/[0.04] text-[8px] uppercase tracking-wider text-[#8b93a5]/60">
                                                        <th className="py-2.5 w-6"><input type="checkbox" className="rounded" /></th>
                                                        <th>Assets</th>
                                                        <th>Price</th>
                                                        <th>Market Cap</th>
                                                        <th>Volume 24h</th>
                                                        <th>Price Graph</th>
                                                        <th className="text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { name: 'Chainlink', sym: 'LINK', price: '$24.89', cap: '$12B', vol: '$850M', up: true, sparkline: [10, 15, 8, 14, 19, 13, 21, 24] },
                                                        { name: 'Polkadot', sym: 'DOT', price: '$35.67', cap: '$36B', vol: '$2.9B', up: true, sparkline: [8, 12, 16, 11, 15, 23, 29, 35] },
                                                        { name: 'Polygon', sym: 'MATIC', price: '$1.23', cap: '$9.5B', vol: '$1.1B', up: false, sparkline: [25, 22, 19, 21, 14, 16, 9, 7] },
                                                        { name: 'Solana', sym: 'SOL', price: '$45.32', cap: '$14B', vol: '$2.3B', up: true, sparkline: [12, 18, 15, 22, 28, 25, 38, 45] },
                                                        { name: 'Avalanche', sym: 'AVAX', price: '$520.48', cap: '$377B', vol: '$18B', up: false, sparkline: [45, 41, 46, 38, 32, 34, 28, 24] }
                                                    ].map((row, idx) => (
                                                        <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                                                            <td className="py-3"><input type="checkbox" className="rounded" /></td>
                                                            <td className="font-semibold text-white">
                                                                <span className="block text-[11px] leading-tight">{row.name}</span>
                                                                <span className="text-[8px] text-[#8b93a5] block leading-tight">{row.sym}</span>
                                                            </td>
                                                            <td className="text-white font-semibold">{row.price}</td>
                                                            <td>{row.cap}</td>
                                                            <td>{row.vol}</td>
                                                            <td>
                                                                {/* Custom SVG Sparkline */}
                                                                <svg className="w-16 h-6" viewBox="0 0 80 30" fill="none">
                                                                    <path
                                                                        d={`M ${row.sparkline.map((val, i) => `${(i * 80) / 7} ${30 - val}`).join(' L ')}`}
                                                                        stroke={row.up ? '#22c787' : '#ff5d5d'}
                                                                        strokeWidth="1.5"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                </svg>
                                                            </td>
                                                            <td className="text-right">
                                                                <button className="p-1 hover:text-white transition-colors" aria-label="Action">
                                                                    <MoreHorizontal className="size-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: TRADE ROUTE (ACTIVE SIGNALS FEED) */}
                    {activeNavTab === 'trade' && (
                        <motion.div
                            key="trade"
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8 text-left"
                        >
                            <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
                                <div>
                                    <h2 className="font-display text-xl font-bold text-white">Active Quant Signals</h2>
                                    <p className="font-mono text-xs text-[#8b93a5] mt-1">Live trading coordinator feed initialized via Arc L1 micropayments.</p>
                                </div>
                                <button
                                    onClick={fetchSignals}
                                    disabled={isRefreshing}
                                    className="font-mono flex items-center gap-1.5 border border-white/[0.06] bg-[#12121e]/40 px-4 py-2 rounded-full text-xs text-white transition-colors hover:border-purple-500 disabled:opacity-40"
                                >
                                    <RefreshCw className={`size-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    Sync
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loading ? (
                                    <div className="col-span-full flex items-center justify-center py-20">
                                        <div className="h-6 w-6 animate-spin border-b-2 border-purple-500" />
                                    </div>
                                ) : (
                                    signals.map((sig) => (
                                        <div key={sig.id} onClick={() => setSelectedSymbol(sig.symbol)} className="cursor-pointer">
                                            <SignalCard signal={sig} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: MARKET ROUTE (AGENT MARKETPLACE CATALOG & CREATOR) */}
                    {activeNavTab === 'market' && (
                        <motion.div
                            key="market"
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8 text-left"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                
                                {/* Left 2 Columns: Directory */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="border border-white/[0.04] bg-[#12121e]/30 p-6 rounded-[1.75rem]">
                                        <div className="mb-6">
                                            <h3 className="font-display text-lg font-bold text-white">Active Agent Catalog</h3>
                                            <p className="font-mono text-xs text-[#8b93a5] mt-1">Hire autonomous agents dynamically. Micropayments verified via Arc L1 ledger.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {marketplaceAgents.map((agent) => (
                                                <div 
                                                    key={agent.id}
                                                    onClick={() => setSelectedMarketplaceAgent(agent)}
                                                    className="border border-white/[0.04] bg-white/[0.01] p-5 hover:border-purple-500 cursor-pointer transition-all hover:scale-[1.01] relative overflow-hidden rounded-2xl shadow-md"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-display font-bold text-sm text-white">{agent.name}</h4>
                                                            <span className="font-mono text-[9px] text-[#8b93a5]">ID: {agent.id}</span>
                                                        </div>
                                                        <span className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 border border-purple-500/20 text-purple-400 bg-purple-500/5 rounded-full">
                                                            {agent.type}
                                                        </span>
                                                    </div>
                                                    <p className="font-mono text-[10px] text-[#8b93a5] line-clamp-2 mb-4 leading-relaxed h-8">
                                                        {agent.desc}
                                                    </p>
                                                    <div className="flex items-center justify-between font-mono text-[10px] border-t border-white/[0.04] pt-3">
                                                        <div>
                                                            <span className="text-[#8b93a5] block text-[8px] uppercase">reputation</span>
                                                            <span className="text-white font-semibold">{agent.reputation}/100</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[#8b93a5] block text-[8px] uppercase">fee</span>
                                                            <span className="text-purple-400 font-bold">{agent.price.toFixed(4)} USDC</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right 1 Column: Agent Factory */}
                                <div className="border border-white/[0.04] bg-[#12121e]/30 p-6 rounded-[1.75rem] space-y-6">
                                    <div className="pb-2 border-b border-white/[0.04] flex items-center justify-between">
                                        <div>
                                            <h3 className="font-display text-base font-bold text-white">Agent Factory</h3>
                                            <span className="font-mono text-[9px] text-[#8b93a5] block mt-0.5">Provision custom security logic</span>
                                        </div>
                                        <Cpu className="size-5 text-purple-400 animate-pulse" />
                                    </div>

                                    <form onSubmit={handleCreateNewAgent} className="space-y-4 font-mono text-xs">
                                        <div>
                                            <label className="text-[10px] text-[#8b93a5] uppercase block mb-1.5">Agent Name</label>
                                            <input 
                                                type="text"
                                                value={newAgentName}
                                                onChange={(e) => setNewAgentName(e.target.value)}
                                                placeholder="e.g. BTC Trend Hunter"
                                                className="w-full bg-[#06060c] border border-white/[0.06] text-white placeholder:text-[#8b93a5]/40 px-4 py-2.5 rounded-full focus:border-purple-500 focus:outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-[#8b93a5] uppercase block mb-1.5">Role Type</label>
                                                <select
                                                    value={newAgentType}
                                                    onChange={(e) => setNewAgentType(e.target.value)}
                                                    className="w-full bg-[#06060c] border border-white/[0.06] text-white px-4 py-2.5 rounded-full focus:border-purple-500 focus:outline-none"
                                                >
                                                    <option value="Signal">Signal</option>
                                                    <option value="Risk">Risk</option>
                                                    <option value="Sentiment">Sentiment</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#8b93a5] uppercase block mb-1.5">Strategy</label>
                                                <select
                                                    value={newAgentStrategy}
                                                    onChange={(e) => setNewAgentStrategy(e.target.value)}
                                                    className="w-full bg-[#06060c] border border-white/[0.06] text-white px-4 py-2.5 rounded-full focus:border-purple-500 focus:outline-none"
                                                >
                                                    <option value="Momentum Squeeze">Momentum</option>
                                                    <option value="Mean Reversion">Mean Rev</option>
                                                    <option value="Sentiment Analysis">Sentiment</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-[#8b93a5] uppercase block mb-1.5">Operating Fee (USDC)</label>
                                            <input 
                                                type="number"
                                                step="0.0001"
                                                value={newAgentBudget}
                                                onChange={(e) => setNewAgentBudget(e.target.value)}
                                                className="w-full bg-[#06060c] border border-white/[0.06] text-white px-4 py-2.5 rounded-full focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-white text-black hover:bg-[#7c3aed] hover:text-white font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Plus className="size-3.5" />
                                            Provision Agent
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 4: ANALYTICS (AGENT TERMINAL & LOGS & GRAPH) */}
                    {activeNavTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8 text-left"
                        >
                            <div className="grid lg:grid-cols-12 gap-8 items-start">
                                
                                {/* Left Column: Agent Fleet Terminal & Logs */}
                                <div className="lg:col-span-8 space-y-8">
                                    <AgentFleetTerminal />
                                    
                                    <div className="border border-white/[0.04] bg-[#12121e]/30 p-6 rounded-[1.75rem] space-y-4">
                                        <div>
                                            <h3 className="font-display font-bold text-sm text-white">Live Execution Logs</h3>
                                            <p className="font-mono text-xs text-[#8b93a5] mt-1">Live trace of each agent execution cycle settled on the Arc Sandbox L1.</p>
                                        </div>
                                        <AgentLog autoDemo={true} maxLines={40} />
                                    </div>
                                </div>

                                {/* Right Column: Network Graph & Payment Feed */}
                                <div className="lg:col-span-4 space-y-8">
                                    <AgentNetworkGraph />
                                    <LivePaymentFeed />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 5: PORTFOLIO (EMBEDDED WALLET & FAUCET MANAGER) */}
                    {activeNavTab === 'portfolio' && (
                        <motion.div
                            key="portfolio"
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8 text-left"
                        >
                            
                            {/* Embedded Wallet Manager Card */}
                            <div className="border border-white/[0.06] bg-[#12121e]/30 p-8 rounded-[2rem] space-y-6">
                                <div className="pb-4 border-b border-white/[0.04]">
                                    <h2 className="font-display text-lg font-bold text-white">USDC Embedded Wallet</h2>
                                    <p className="font-mono text-xs text-[#8b93a5] mt-1">Direct wallet configurations supporting gas-free transactions.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    
                                    {/* Left Side: Wallet address & balance */}
                                    <div className="space-y-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-[9px] text-[#8b93a5] uppercase">Wallet Address</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-white bg-[#06060c] px-3.5 py-2 border border-white/[0.04] rounded-full select-all truncate max-w-xs">
                                                    {walletInfo?.wallet_address || '0x000...'}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(walletInfo?.wallet_address || '')}
                                                    className="p-2 border border-white/[0.06] bg-[#12121e]/40 rounded-full hover:border-purple-500 hover:text-purple-400 transition-colors"
                                                >
                                                    {copiedAddress ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 pt-2">
                                            <span className="font-mono text-[9px] text-[#8b93a5] uppercase">Total Balance</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-mono text-3xl font-bold text-white leading-none">
                                                    <AnimatedNumber value={walletInfo?.wallet_balance ?? 0.0} precision={6} />
                                                </span>
                                                <span className="font-mono text-xs text-purple-400 font-bold">USDC</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => router.push('/faucet')}
                                            className="font-mono bg-white text-black hover:bg-purple-400 hover:text-white px-6 py-3 rounded-full text-xs font-bold transition-colors"
                                        >
                                            ⛽ Go to Faucet
                                        </button>
                                    </div>

                                    {/* Right Side: External connection linking */}
                                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/[0.04] pt-6 md:pt-0 md:pl-8">
                                        <span className="font-mono text-[10px] text-white uppercase block font-semibold">Optional External Link</span>
                                        
                                        <div className="space-y-3">
                                            <button
                                                onClick={connectWallet}
                                                disabled={isConnectingWallet}
                                                className="font-mono border border-white/[0.06] bg-[#12121e]/30 px-4 py-2.5 rounded-full text-[10px] uppercase text-white hover:border-purple-500 hover:text-purple-400 transition-all"
                                            >
                                                {isConnectingWallet ? 'Connecting...' : 'Connect MetaMask'}
                                            </button>

                                            <form onSubmit={handleUpdateExternalWallet} className="flex gap-2 font-mono text-xs">
                                                <input
                                                    type="text"
                                                    value={externalWalletInput}
                                                    onChange={(e) => setExternalWalletInput(e.target.value)}
                                                    placeholder="0x..."
                                                    className="flex-1 bg-[#06060c] border border-white/[0.06] text-white placeholder:text-[#8b93a5]/40 px-4 py-2.5 rounded-full focus:border-purple-500 focus:outline-none"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={externalWalletLoading}
                                                    className="border border-white/[0.06] bg-[#12121e]/40 px-4 py-2.5 rounded-full hover:border-purple-500 hover:text-purple-400"
                                                >
                                                    Link
                                                </button>
                                            </form>

                                            {walletSuccess && <p className="font-mono text-[9px] text-[#22c787]">{walletSuccess}</p>}
                                            {walletError && <p className="font-mono text-[9px] text-[#ff5d5d]">{walletError}</p>}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* provisioned Agents Manager list */}
                            <div className="border border-white/[0.04] bg-[#12121e]/30 p-8 rounded-[2rem] space-y-6">
                                <div className="pb-4 border-b border-white/[0.04]">
                                    <h3 className="font-display text-lg font-bold text-white">Autonomous Agent Wallets</h3>
                                    <p className="font-mono text-xs text-[#8b93a5] mt-1">Manage funded balances and yields loops.</p>
                                </div>

                                <div className="space-y-4">
                                    {agents.map((agent) => (
                                        <div key={agent.id} className="border border-white/[0.04] p-5 bg-white/[0.01] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="text-left">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="font-display font-bold text-sm text-white">{agent.name}</span>
                                                    <span className={`font-mono text-[8px] px-2 py-0.5 border rounded-full ${
                                                        agent.is_active ? 'text-[#22c787] border-[#22c787]/20 bg-[#22c787]/5' : 'text-[#ff5d5d] border-[#ff5d5d]/20 bg-[#ff5d5d]/5'
                                                    }`}>
                                                        {agent.is_active ? 'ACTIVE' : 'PAUSED'}
                                                    </span>
                                                    {agent.yield_loop_active && (
                                                        <span className="font-mono text-[8px] px-2 py-0.5 border border-purple-500/25 text-purple-400 bg-purple-500/5 rounded-full">
                                                            YIELD (5.5% APY)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-mono text-[9px] text-[#8b93a5] mb-2 bg-[#06060c] px-3 py-1.5 border border-white/[0.04] rounded-full inline-block truncate max-w-xs sm:max-w-md">
                                                    Address: {agent.wallet_address}
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[9px] text-[#8b93a5] max-w-sm">
                                                    <span>Balance:</span>
                                                    <span className="text-white font-semibold">{agent.wallet_balance.toFixed(4)} USDC</span>
                                                    <span>Yield Balance:</span>
                                                    <span className="text-white font-semibold">{(agent.yield_loop_balance || 0.0).toFixed(4)} USDC</span>
                                                    <span>Daily Budget:</span>
                                                    <span className="text-white font-semibold">{agent.daily_budget.toFixed(2)} USDC</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2.5 font-mono text-[10px]">
                                                <button
                                                    onClick={() => openFundModal(agent)}
                                                    className="border border-purple-500/30 text-purple-300 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-full transition-colors flex items-center gap-1"
                                                >
                                                    <CircleDollarSign className="size-3.5" />
                                                    Fund
                                                </button>
                                                <button
                                                    onClick={() => handleToggleAgentActive(agent.id, agent.is_active)}
                                                    className={`border px-4 py-2 rounded-full transition-colors ${
                                                        agent.is_active ? 'border-[#ff5d5d]/20 text-[#ff5d5d]' : 'border-[#22c787]/20 text-[#22c787]'
                                                    }`}
                                                >
                                                    {agent.is_active ? 'Pause' : 'Resume'}
                                                </button>
                                                <button
                                                    onClick={() => handleToggleYieldLoop(agent.id, agent.yield_loop_active)}
                                                    disabled={togglingYield === agent.id}
                                                    className="border border-white/[0.06] text-[#8b93a5] hover:text-white px-4 py-2 rounded-full"
                                                >
                                                    {agent.yield_loop_active ? 'Disable Yield' : 'Enable Yield'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>

            </main>

            {/* Fund Agent Modal */}
            <AnimatePresence>
                {fundAgentModalOpen && selectedAgentForFunding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="border border-white/[0.06] bg-[#12121e] p-6 max-w-sm w-full rounded-2xl text-left font-mono text-xs"
                        >
                            <h3 className="font-display font-bold text-sm text-white mb-2">Fund Agent: {selectedAgentForFunding.name}</h3>
                            <p className="text-[#8b93a5] text-[10px] mb-4 leading-relaxed">Top up the agent&apos;s active on-chain balance to execute transactions.</p>
                            
                            <form onSubmit={handleFundAgent} className="space-y-4">
                                <div>
                                    <label className="text-[9px] text-[#8b93a5] uppercase block mb-1.5">Amount (USDC)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={fundingAmountInput}
                                        onChange={(e) => setFundingAmountInput(parseFloat(e.target.value))}
                                        className="w-full bg-[#06060c] border border-white/[0.06] text-white px-4 py-2.5 rounded-full"
                                        required
                                    />
                                </div>

                                {fundingSuccess && <p className="text-[#22c787] text-[10px]">{fundingSuccess}</p>}
                                {fundingError && <p className="text-[#ff5d5d] text-[10px]">{fundingError}</p>}

                                <div className="flex gap-3 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFundAgentModalOpen(false)}
                                        className="border border-white/[0.06] px-4 py-2 rounded-full"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={fundingLoading}
                                        className="bg-[#7c3aed] text-white px-5 py-2 rounded-full"
                                    >
                                        {fundingLoading ? 'Funding...' : 'Confirm'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Agent Detail Modal overlay */}
            <AnimatePresence>
                {selectedMarketplaceAgent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="border border-white/[0.06] bg-[#12121e] max-w-md w-full p-6 sm:p-8 rounded-[2rem] text-left relative max-h-[90vh] overflow-y-auto"
                        >
                            <button 
                                onClick={() => setSelectedMarketplaceAgent(null)}
                                className="absolute top-5 right-5 font-mono text-[#8b93a5] hover:text-white text-xs"
                            >
                                [esc]
                            </button>
                            <div className="mb-4">
                                <span className="font-mono text-[8px] text-purple-400 uppercase block mb-1">Agent Profile</span>
                                <h3 className="font-display text-lg font-bold text-white">{selectedMarketplaceAgent.name}</h3>
                                <span className="font-mono text-[9px] text-[#8b93a5] break-all bg-black/30 px-3.5 py-1.5 border border-white/[0.04] mt-2 block rounded-full">
                                    Address: {selectedMarketplaceAgent.address}
                                </span>
                            </div>
                            <div className="space-y-4 font-mono text-xs mt-4">
                                <p className="text-[#8b93a5] leading-relaxed text-[11px]">
                                    {selectedMarketplaceAgent.desc}
                                </p>
                                <div className="grid grid-cols-2 gap-3 bg-black/30 border border-white/[0.04] p-4 rounded-xl">
                                    <div>
                                        <span className="text-[#8b93a5] block text-[8px] uppercase">Category</span>
                                        <span className="text-white font-semibold">{selectedMarketplaceAgent.type}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#8b93a5] block text-[8px] uppercase">Creator</span>
                                        <span className="text-white font-semibold">{selectedMarketplaceAgent.creator}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#8b93a5] block text-[8px] uppercase">Accuracy</span>
                                        <span className="text-[#22c787] font-bold">{selectedMarketplaceAgent.accuracy}%</span>
                                    </div>
                                    <div>
                                        <span className="text-[#8b93a5] block text-[8px] uppercase">Reputation</span>
                                        <span className="text-purple-400 font-bold">{selectedMarketplaceAgent.reputation}/100</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMarketplaceAgent(null)}
                                    className="w-full bg-white text-black font-semibold py-3 rounded-full hover:bg-purple-500 hover:text-white transition-colors mt-2"
                                >
                                    Dismiss Profile
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Faucet Demo Simulator Drawer */}
            <DemoSimulator />
        </div>
    );
}
