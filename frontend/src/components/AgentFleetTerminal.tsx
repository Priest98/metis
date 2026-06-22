'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Coins, ShieldCheck, User, Activity, Brain, Scale, Terminal, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AgentThoughtStream from '@/components/AgentThoughtStream';

interface LogItem {
    agent: string;
    action: string;
    details: string;
    timestamp: string;
}

export default function AgentFleetTerminal() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<LogItem[]>([
        { agent: 'System', action: 'INIT', details: 'Autonomous agent fleet initialized. Awaiting market trigger...', timestamp: new Date().toLocaleTimeString() }
    ]);
    const [balances, setBalances] = useState({
        strategy_agent: 10.0,
        risk_agent: 0.0,
        signal_agent: 0.0,
        sentiment_agent: 0.0
    });
    const [votes, setVotes] = useState<Record<string, string>>({
        signal: 'Awaiting',
        strategy: 'Awaiting',
        risk: 'Awaiting',
        sentiment: 'Awaiting'
    });
    const [activeTxProof, setActiveTxProof] = useState<any | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Thought Stream state
    const [activeThoughtStream, setActiveThoughtStream] = useState<{
        agent: string;
        agentColor: string;
        thoughts: string[];
        decision: string;
    } | null>(null);

    useEffect(() => {
        // Connect to backend WebSocket for real backend events
        const clientId = 'dashboard_agent_' + Math.random().toString(36).substr(2, 9);
        const tokenQuery = user?.token ? `?token=${user.token}` : '';
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/signals/${clientId}${tokenQuery}`;
        
        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'agent_activity') {
                        const { agent, action, details, balances: newBalances } = message.data;
                        
                        setLogs(prev => [
                            ...prev,
                            {
                                agent,
                                action,
                                details,
                                timestamp: new Date().toLocaleTimeString()
                            }
                        ]);
                        
                        if (newBalances) {
                            setBalances({
                                strategy_agent: newBalances.strategy_agent,
                                risk_agent: newBalances.risk_agent,
                                signal_agent: newBalances.signal_agent,
                                sentiment_agent: newBalances.sentiment_agent || 0.0
                            });
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse websocket message', e);
                }
            };
            
            ws.onerror = (e) => {
                console.error('WebSocket error:', e);
            };
            
            ws.onclose = () => {
                console.log('WebSocket closed');
            };
        } catch (e) {
            console.error('WebSocket connection failed', e);
        }
        
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [user?.token]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, activeThoughtStream]);

    const speak = (text: string) => {
        if (voiceEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const triggerWorkflow = () => {
        if (isRunning) return;
        setIsRunning(true);
        runSimulationFlow();
    };

    const runSimulationFlow = async () => {
        // Clear previous votes
        setVotes({
            signal: 'Awaiting',
            strategy: 'Awaiting',
            risk: 'Awaiting',
            sentiment: 'Awaiting'
        });
        setActiveTxProof(null);

        const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'][Math.floor(Math.random() * 4)];
        const dir = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        const addLog = (agent: string, action: string, details: string) => {
            setLogs(prev => [
                ...prev,
                { agent, action, details, timestamp: new Date().toLocaleTimeString() }
            ]);
        };

        // --- STEP 1: SCAN & SIGNAL AGENT ---
        speak(`Initializing autonomous workflow. Signal Agent scanning market datasets for ${symbol.replace('USDT', '')}.`);
        addLog('Signal Agent', 'SCANNING', `Scanning 24h market structure for ${symbol}...`);
        setActiveThoughtStream({
            agent: 'Signal Agent',
            agentColor: '#D7FF3E',
            thoughts: [
                `Scanning 47 instruments across 4 timeframes...`,
                `${symbol} 4H: Bollinger Band squeeze detected (width: 0.034)`,
                `ADX: 31.4 → trending regime confirmed`,
                `Ensemble models: [87%, 91%, 86%] → mean: 88%`,
                `Probability threshold (70%) met → proceeding`
            ],
            decision: `BROADCAST masked ${symbol} ${dir} signal (Prob: 88%)`
        });

        await sleep(3800);
        setActiveThoughtStream(null);

        addLog('Signal Agent', 'BROADCAST_ALERT', `Generated new masked signal for ${symbol} ${dir} (Prob: 88%, Score: 9.2)`);
        setVotes(prev => ({ ...prev, signal: 'Voting...' }));
        speak("Breakout signal generated. Strategy Agent initiates x402 payment to unlock details.");
        await sleep(1500);

        addLog('Signal Agent', 'ASK_FEE', `Offering ${symbol} ${dir} signal. Requested unlock fee: 0.001000 USDC.`);
        await sleep(1500);

        addLog('Strategy Agent', 'COUNTER_OFFER', `Evaluating Signal Agent reputation (96). Counter-offering 0.001000 USDC based on past accuracy (84%).`);
        await sleep(1500);

        addLog('Signal Agent', 'ACCEPT_OFFER', `Counter-offer accepted. Executing swap...`);
        await sleep(1000);

        // Deduct/fund
        setBalances(prev => ({
            ...prev,
            strategy_agent: prev.strategy_agent - 0.0010,
            signal_agent: prev.signal_agent + 0.0010
        }));
        
        // Try real blockchain route backend trigger if endpoints are available
        try {
            await api.post('/wallet/agents/1/fund', { amount: 0.0010 });
        } catch(e) {}

        const hash1 = '0xarc' + Math.random().toString(16).substring(2, 10) + '9f88d27a1928cf3b8f' + Math.random().toString(16).substring(2, 6);
        const tx1 = { hash: hash1, to: 'Signal Agent', type: 'Signal Unlock Fee', amount: 0.0010 };
        setActiveTxProof(tx1);
        addLog('Strategy Agent', 'PAY_SIGNAL_AGENT', `Paid 0.001000 USDC to Signal Agent. Details unlocked. Tx: ${tx1.hash}`);
        setVotes(prev => ({ ...prev, signal: 'Approve' }));
        speak("USDC payment settled. Signal unmasked. Initiating risk validation.");
        await sleep(1800);
        setActiveTxProof(null);

        // --- STEP 2: RISK GUARDIAN ---
        addLog('Risk Agent', 'VALIDATING', `Verifying risk parameters for unlocked signal...`);
        setActiveThoughtStream({
            agent: 'Risk Agent',
            agentColor: '#22c787',
            thoughts: [
                `Intercepting StrategyAgent request for verification...`,
                `Checking portfolio exposure limits (Max: 15.00%)...`,
                `Calculating correlation coefficient against BTC/ETH...`,
                `Current correlation: 0.64 (within safe bounds < 0.75)`,
                `Validating Risk-Reward ratio: Target 2.4x vs limit 2.0x`
            ],
            decision: `RISK APPROVED — AUTHORIZE 0.0005 USDC payment`
        });
        setVotes(prev => ({ ...prev, risk: 'Voting...' }));
        await sleep(3800);
        setActiveThoughtStream(null);

        setBalances(prev => ({
            ...prev,
            strategy_agent: prev.strategy_agent - 0.0005,
            risk_agent: prev.risk_agent + 0.0005
        }));
        try {
            await api.post('/wallet/agents/3/fund', { amount: 0.0005 });
        } catch(e) {}

        const hash2 = '0xarc' + Math.random().toString(16).substring(2, 10) + '18fa90c2941fa8b88e' + Math.random().toString(16).substring(2, 6);
        const tx2 = { hash: hash2, to: 'Risk Agent', type: 'Risk Validation Fee', amount: 0.0005 };
        setActiveTxProof(tx2);
        addLog('Strategy Agent', 'PAY_RISK_AGENT', `Paid 0.000500 USDC to Risk Agent. Tx: ${tx2.hash}`);
        speak("Risk parameters validated successfully. Initiating news and social sentiment overlay.");
        await sleep(1800);
        setActiveTxProof(null);

        addLog('Risk Agent', 'RISK_APPROVED', `Validation complete: Risk parameters comply. RR Ratio: 2.4.`);
        setVotes(prev => ({ ...prev, risk: 'Pass' }));
        await sleep(1500);

        // --- STEP 3: SENTIMENT ORACLE ---
        addLog('Sentiment Agent', 'ANALYZING', `Parsing social context indices for ${symbol}...`);
        setActiveThoughtStream({
            agent: 'Sentiment Agent',
            agentColor: '#6ba3ff',
            thoughts: [
                `Ingesting real-time X/Twitter data stream...`,
                `Parsing social sentiment vectors using LLM embeddings...`,
                `Analyzing macroeconomic headers & news index...`,
                `Fear & Greed Index: 64 (Greed) · Social Index: 88% Bullish`,
                `Consensus score: 92% Bullish`
            ],
            decision: `SENTIMENT ALIGNED — AUTHORIZE 0.0003 USDC payment`
        });
        setVotes(prev => ({ ...prev, sentiment: 'Voting...' }));
        await sleep(3800);
        setActiveThoughtStream(null);

        setBalances(prev => ({
            ...prev,
            strategy_agent: prev.strategy_agent - 0.0003,
            sentiment_agent: prev.sentiment_agent + 0.0003
        }));
        try {
            await api.post('/wallet/agents/4/fund', { amount: 0.0003 });
        } catch(e) {}

        const hash3 = '0xarc' + Math.random().toString(16).substring(2, 10) + '3c2b92d8e0e8e8f802' + Math.random().toString(16).substring(2, 6);
        const tx3 = { hash: hash3, to: 'Sentiment Agent', type: 'Sentiment Check Fee', amount: 0.0003 };
        setActiveTxProof(tx3);
        addLog('Strategy Agent', 'PAY_SENTIMENT_AGENT', `Paid 0.000300 USDC to Sentiment Agent. Tx: ${tx3.hash}`);
        speak(`Sentiment analysis indicates strong bullish bias. Broad consensus reached. Executing long order.`);
        await sleep(1800);
        setActiveTxProof(null);

        addLog('Sentiment Agent', 'SENTIMENT_APPROVED', `Sentiment check complete: Market context matches.`);
        setVotes(prev => ({ ...prev, sentiment: dir === 'BUY' ? 'Bullish' : 'Bearish' }));
        await sleep(1500);

        // --- STEP 4: STRATEGY TRADE EXECUTION ---
        addLog('Strategy Agent', 'EXECUTE_TRADE', `Routing ${dir} order for ${symbol} to DEX router.`);
        setVotes(prev => ({ ...prev, strategy: 'Execute' }));
        await sleep(1500);

        // Slash alert event simulation: 30% chance of a losing trade triggering a slash
        const isSlashed = Math.random() > 0.7;
        if (isSlashed) {
            speak("Warning. Trade result negative. Slashing signal agent reputation.");
            addLog('System', 'REPUTATION_SLASH', `Trade result: -1.8%. Slashing Signal Agent reputation by 2.1 points due to inaccurate signal.`);
            
            // Dispatch a global event so that the Leaderboard or other components can show a toast
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('agent_slashed', { 
                    detail: { agent: 'BTC Alpha Agent', amount: 2.1 } 
                });
                window.dispatchEvent(event);
            }
        } else {
            addLog('System', 'LEARNING_LOOP', `Trade execution finalized. Actual: +3.2%. ${symbol} Momentum pattern reinforced.`);
        }

        setIsRunning(false);
    };

    return (
        <div className="glass-card p-6 relative overflow-hidden shadow-2xl bg-[#182030]/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                <div>
                    <p className="eyebrow mb-1">agent-to-agent nanopayment network</p>
                    <h3 className="font-display text-lg font-semibold text-ink">Autonomous Agent Fleet</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setVoiceEnabled(prev => !prev)}
                        className={`p-2.5 rounded-full border transition-colors ${
                            voiceEnabled 
                                ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20' 
                                : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'
                        }`}
                        title={voiceEnabled ? 'Mute voice narration' : 'Unmute voice narration'}
                    >
                        {voiceEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                    </button>
                    <button
                        onClick={triggerWorkflow}
                        disabled={isRunning}
                        className="font-mono flex items-center gap-1.5 bg-accent text-background font-semibold text-xs px-5 py-2.5 rounded-full hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <Play className="w-3.5 h-3.5 fill-background" />
                        Simulate Agent Payflow
                    </button>
                </div>
            </div>

            {/* Council Verdict Panel */}
            <div className="bg-background/60 border border-white/10 p-4 mb-6 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-approve to-indigo-500" />
                <p className="font-mono text-[9px] uppercase text-muted tracking-wider mb-3">AI Council Consensus Verdict</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { name: 'Signal Agent', role: 'Publisher', val: votes.signal },
                        { name: 'Strategy Agent', role: 'Trader', val: votes.strategy },
                        { name: 'Risk Agent', role: 'Validator', val: votes.risk },
                        { name: 'Sentiment Agent', role: 'Context Analyzer', val: votes.sentiment }
                    ].map((agent, i) => (
                        <div key={i} className="bg-surface/50 border border-white/10 p-2.5 rounded-xl flex flex-col justify-between h-14">
                            <span className="font-mono text-[8px] text-muted block uppercase">{agent.name}</span>
                            <span className={`font-mono text-[10px] font-bold ${
                                agent.val === 'Awaiting' ? 'text-muted/50' :
                                agent.val === 'Voting...' ? 'text-amber-400 animate-pulse' :
                                agent.val === 'Reject' ? 'text-block' : 'text-approve'
                            }`}>
                                {agent.val}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wallet Budgets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-background/60 border border-white/10 p-4 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Strategy Agent</span>
                        <User className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.strategy_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Budget Limit: 0.10 / day</span>
                </div>
                <div className="bg-background/60 border border-white/10 p-4 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Risk Agent</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-approve" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.risk_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Validation Fee: 0.0005 / check</span>
                </div>
                <div className="bg-background/60 border border-white/10 p-4 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Signal Agent</span>
                        <Coins className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.signal_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Unlock Fee: 0.001 / signal</span>
                </div>
                <div className="bg-background/60 border border-white/10 p-4 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Sentiment Agent</span>
                        <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.sentiment_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Analysis Fee: 0.0003 / check</span>
                </div>
            </div>

            {/* Active Thought Stream Panel */}
            <AnimatePresence>
                {activeThoughtStream && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <AgentThoughtStream 
                            agent={activeThoughtStream.agent}
                            agentColor={activeThoughtStream.agentColor}
                            thoughts={activeThoughtStream.thoughts}
                            decision={activeThoughtStream.decision}
                            speed={550}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={logContainerRef} className="bg-black/60 border border-white/10 p-4 h-[220px] rounded-2xl overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
                <div className="flex items-center gap-2 mb-3 text-slate-500 pb-2 border-b border-white/[0.04]">
                    <Activity className="w-3 h-3 text-accent animate-pulse" />
                    <span>Agent Telemetry Feed (Arc L1 Sandbox)</span>
                </div>
                <div className="space-y-2">
                    {logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <span className="text-slate-600">[{log.timestamp}]</span>
                            <span className={
                                log.agent === 'Strategy Agent (Trader)' || log.agent === 'Strategy Agent'
                                    ? 'text-accent' 
                                    : log.agent === 'Risk Agent (Validator)' || log.agent === 'Risk Agent'
                                    ? 'text-approve' 
                                    : log.agent === 'Signal Agent (Publisher)' || log.agent === 'Signal Agent'
                                    ? 'text-indigo-400' 
                                    : log.agent === 'Sentiment Agent'
                                    ? 'text-purple-400'
                                    : 'text-slate-500'
                            }>
                                {log.agent}:
                            </span>
                            <span className="text-slate-500 uppercase tracking-wide">[{log.action}]</span>
                            <span className="text-slate-300 flex-1">{log.details}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Arc Transaction Proof Floating Overlay */}
            {activeTxProof && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-[#182030]/95 border border-accent p-5 w-[280px] rounded-[1.75rem] shadow-2xl animate-fade-in font-mono text-[9px]">
                    <div className="flex justify-between items-center pb-2 border-b border-dashed border-white/10 mb-3">
                        <span className="font-bold text-accent flex items-center gap-1">
                            <Terminal className="w-3 h-3 text-accent" />
                            ARC TRANSACTION PROOF
                        </span>
                        <span className="text-[7px] bg-accent/10 px-1 text-accent">FINALIZED</span>
                    </div>
                    <div className="space-y-2 text-muted">
                        <div className="flex justify-between">
                            <span>TX HASH:</span>
                            <a 
                                href={`https://explorer.testnet.arc.network/tx/${activeTxProof.hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent text-[7px] font-semibold break-all select-all hover:underline cursor-pointer"
                            >
                                {activeTxProof.hash}
                            </a>
                        </div>
                        <div className="flex justify-between">
                            <span>FROM:</span>
                            <span className="text-ink">StrategyAgent.wallet</span>
                        </div>
                        <div className="flex justify-between">
                            <span>TO:</span>
                            <span className="text-ink">{activeTxProof.to}.wallet</span>
                        </div>
                        <div className="flex justify-between">
                            <span>TYPE:</span>
                            <span className="text-ink">{activeTxProof.type}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-white/10 pt-2 font-bold text-xs">
                            <span>AMOUNT:</span>
                            <span className="text-accent">{activeTxProof.amount.toFixed(6)} USDC</span>
                        </div>
                        <div className="flex justify-between text-[7px]">
                            <span>CONFIRMATION:</span>
                            <span className="text-approve font-semibold">104ms (Arc L1 Sandbox)</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-dashed border-white/10 text-center text-muted/30 text-[7px]">
                        METIS PROTOCOL // SANDBOX PROOF
                    </div>
                </div>
            )}
        </div>
    );
}
