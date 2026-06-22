'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Coins, ShieldCheck, User, Activity, Brain, Scale, Terminal } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Connect to backend WebSocket
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
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const triggerWorkflow = () => {
        if (isRunning) return;
        setIsRunning(true);
        simulateLocalFlow();
    };

    const simulateLocalFlow = () => {
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
        
        const steps = [
            { agent: 'Signal Agent', action: 'BROADCAST_ALERT', details: `Generated new masked signal for ${symbol} ${dir} (Prob: 88%, Score: 9.2)`, voteKey: 'signal', voteVal: 'Voting...' },
            { agent: 'Signal Agent', action: 'ASK_FEE', details: `Offering ${symbol} ${dir} signal. Requested unlock fee: 0.002000 USDC.` },
            { agent: 'Strategy Agent', action: 'COUNTER_OFFER', details: `Evaluating Signal Agent reputation (96). Counter-offering 0.001200 USDC based on past accuracy (84%).` },
            { agent: 'Signal Agent', action: 'ACCEPT_OFFER', details: `Counter-offer accepted. Executing swap...` },
            { 
                agent: 'Strategy Agent', 
                action: 'PAY_SIGNAL_AGENT', 
                details: `Paid 0.001200 USDC to Signal Agent. Gated signal details unlocked. Tx: 0xarc9f88d27a...`, 
                voteKey: 'signal', 
                voteVal: 'Approve', 
                tx: { hash: '0xarc9f88d27a1928cf3b8f', to: 'Signal Agent', type: 'Signal Unlock Fee', amount: 0.0012 } 
            },
            { agent: 'Risk Agent', action: 'EVALUATE_RISK', details: `Validating risk profile for unlocked ${symbol} signal. Processing fee: 0.000500 USDC.`, voteKey: 'risk', voteVal: 'Voting...' },
            { 
                agent: 'Strategy Agent', 
                action: 'PAY_RISK_AGENT', 
                details: `Paid 0.000500 USDC to Risk Agent. Tx: 0xarc18fa90c2...`, 
                tx: { hash: '0xarc18fa90c2941fa8b88e', to: 'Risk Agent', type: 'Risk Validation Fee', amount: 0.0005 } 
            },
            { agent: 'Risk Agent', action: 'RISK_APPROVED', details: `Validation complete: Risk profiles clear. Risk Reward Ratio = 2.4 (>= 2.0 limit).`, voteKey: 'risk', voteVal: 'Pass' },
            { agent: 'Sentiment Agent', action: 'EVALUATE_SENTIMENT', details: `Scanning social metrics & news headers for ${symbol}. Sentiment score: 92% BULLISH.`, voteKey: 'sentiment', voteVal: 'Voting...' },
            { 
                agent: 'Strategy Agent', 
                action: 'PAY_SENTIMENT_AGENT', 
                details: `Paid 0.000300 USDC to Sentiment Agent. Tx: 0xarc3c2b92d8...`, 
                tx: { hash: '0xarc3c2b92d8e0e8e8f802', to: 'Sentiment Agent', type: 'Sentiment Check Fee', amount: 0.0003 } 
            },
            { agent: 'Sentiment Agent', action: 'SENTIMENT_APPROVED', details: `Sentiment check complete: Market regime aligns.`, voteKey: 'sentiment', voteVal: 'Bullish' },
            { agent: 'Strategy Agent', action: 'EXECUTE_TRADE', details: `Executing trade: ${dir} ${symbol} on liquidity pool.`, voteKey: 'strategy', voteVal: 'Execute' },
            { agent: 'System', action: 'LEARNING_LOOP', details: `Trade execution finalized. Actual: +3.2%. ${symbol} Momentum pattern reinforced: Confidence metric scaled 84% -> 86% based on feedback.` }
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < steps.length) {
                const step = steps[index];
                
                // update mock balances
                setBalances(prev => {
                    let strategy_agent = prev.strategy_agent;
                    let risk_agent = prev.risk_agent;
                    let signal_agent = prev.signal_agent;
                    let sentiment_agent = prev.sentiment_agent;
                    
                    if (step.action === 'PAY_SIGNAL_AGENT') {
                        strategy_agent -= 0.0012;
                        signal_agent += 0.0012;
                    }
                    if (step.action === 'PAY_RISK_AGENT') {
                        strategy_agent -= 0.0005;
                        risk_agent += 0.0005;
                    }
                    if (step.action === 'PAY_SENTIMENT_AGENT') {
                        strategy_agent -= 0.0003;
                        sentiment_agent += 0.0003;
                    }
                    
                    return { strategy_agent, risk_agent, signal_agent, sentiment_agent };
                });

                // update logs
                setLogs(prev => [
                    ...prev,
                    {
                        agent: step.agent,
                        action: step.action,
                        details: step.details,
                        timestamp: new Date().toLocaleTimeString()
                    }
                ]);

                // update votes
                if (step.voteKey) {
                    setVotes(prev => ({
                        ...prev,
                        [step.voteKey]: step.voteVal
                    }));
                }

                // trigger Tx proof popup
                if (step.tx) {
                    setActiveTxProof(step.tx);
                    // Dismiss proof after 1200ms
                    setTimeout(() => {
                        setActiveTxProof(null);
                    }, 1200);
                }

                index++;
            } else {
                clearInterval(interval);
                setIsRunning(false);
            }
        }, 1500);
    };

    return (
        <div className="border border-hairline bg-surface p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline">
                <div>
                    <p className="eyebrow mb-1">agent-to-agent nanopayment network</p>
                    <h3 className="font-display text-lg font-semibold text-ink">Autonomous Agent Fleet</h3>
                </div>
                <button
                    onClick={triggerWorkflow}
                    disabled={isRunning}
                    className="font-mono flex items-center gap-1.5 bg-accent text-background font-semibold text-xs px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <Play className="w-3.5 h-3.5 fill-background" />
                    Simulate Agent Payflow
                </button>
            </div>

            {/* Council Verdict Panel */}
            <div className="bg-background border border-hairline p-4 mb-6 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-approve to-indigo-500" />
                <p className="font-mono text-[9px] uppercase text-muted tracking-wider mb-3">AI Council Consensus Verdict</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { name: 'Signal Agent', role: 'Publisher', val: votes.signal },
                        { name: 'Strategy Agent', role: 'Trader', val: votes.strategy },
                        { name: 'Risk Agent', role: 'Validator', val: votes.risk },
                        { name: 'Sentiment Agent', role: 'Context Analyzer', val: votes.sentiment }
                    ].map((agent, i) => (
                        <div key={i} className="bg-surface/50 border border-hairline/80 p-2.5 flex flex-col justify-between h-14">
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
                <div className="bg-background border border-hairline p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Strategy Agent</span>
                        <User className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.strategy_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Budget Limit: 0.10 / day</span>
                </div>
                <div className="bg-background border border-hairline p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Risk Agent</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-approve" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.risk_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Validation Fee: 0.0005 / check</span>
                </div>
                <div className="bg-background border border-hairline p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Signal Agent</span>
                        <Coins className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.signal_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Unlock Fee: 0.001 / signal</span>
                </div>
                <div className="bg-background border border-hairline p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Sentiment Agent</span>
                        <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-ink break-all">{balances.sentiment_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted block mt-1">Analysis Fee: 0.0003 / check</span>
                </div>
            </div>

            {/* Terminal Log */}
            <div className="bg-black border border-hairline p-4 h-[220px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
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
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* Arc Transaction Proof Floating Overlay */}
            {activeTxProof && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-[#111118] border border-accent p-5 w-[280px] shadow-[0_0_50px_rgba(215,255,62,0.2)] animate-fade-in font-mono text-[9px]">
                    <div className="flex justify-between items-center pb-2 border-b border-dashed border-hairline/80 mb-3">
                        <span className="font-bold text-accent flex items-center gap-1">
                            <Terminal className="w-3 h-3 text-accent" />
                            ARC TRANSACTION PROOF
                        </span>
                        <span className="text-[7px] bg-accent/10 px-1 text-accent">FINALIZED</span>
                    </div>
                    <div className="space-y-2 text-muted">
                        <div className="flex justify-between">
                            <span>TX HASH:</span>
                            <span className="text-ink text-[7px] font-semibold break-all">{activeTxProof.hash}</span>
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
                        <div className="flex justify-between border-t border-dashed border-hairline/50 pt-2 font-bold text-xs">
                            <span>AMOUNT:</span>
                            <span className="text-accent">{activeTxProof.amount.toFixed(6)} USDC</span>
                        </div>
                        <div className="flex justify-between text-[7px]">
                            <span>CONFIRMATION:</span>
                            <span className="text-approve font-semibold">104ms (Arc L1 Mainnet)</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-dashed border-hairline/50 text-center text-muted/30 text-[7px]">
                        METIS PROTOCOL // SANDBOX PROOF
                    </div>
                </div>
            )}
        </div>
    );
}
