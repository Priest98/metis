'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Coins, ShieldCheck, User, Activity } from 'lucide-react';
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
        signal_agent: 0.0
    });
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
                                signal_agent: newBalances.signal_agent
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

    const triggerWorkflow = async () => {
        setIsRunning(true);
        try {
            await api.post('/signals/demo-trigger');
        } catch (e) {
            console.error('Failed to trigger demo signal', e);
            setLogs(prev => [
                ...prev,
                { agent: 'System', action: 'ERROR', details: 'Backend offline. Using simulated fallback flow...', timestamp: new Date().toLocaleTimeString() }
            ]);
            simulateFallback();
        } finally {
            setIsRunning(false);
        }
    };

    const simulateFallback = () => {
        // Simulated local fallback for UX robustness
        const symbol = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSD'][Math.floor(Math.random() * 4)];
        const dir = Math.random() > 0.5 ? 'BUY' : 'SELL';
        
        const steps = [
            { agent: 'Signal Agent', action: 'BROADCAST_ALERT', details: `Generated new masked signal for {sym} {dir} (Prob: 88%, Score: 9.2)` },
            { agent: 'Strategy Agent', action: 'EVALUATE_ALERT', details: `Evaluating signal criteria... Required Prob: >=70%, Score: >=7.5` },
            { agent: 'Strategy Agent', action: 'PAY_SIGNAL_AGENT', details: `Criteria met. Paid 0.001000 USDC to Signal Agent via x402. Gated signal details unlocked.` },
            { agent: 'Risk Agent', action: 'EVALUATE_RISK', details: `Validating risk profile for unlocked {sym} signal... Processing fee: 0.000500 USDC` },
            { agent: 'Risk Agent', action: 'RISK_APPROVED', details: `Validation complete: Risk profiles clear. Risk Reward Ratio >= 2.0.` },
            { agent: 'Strategy Agent', action: 'EXECUTE_TRADE', details: `Executing simulated trade: {dir} {sym}` }
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < steps.length) {
                const step = steps[index];
                const cleanDetails = step.details.replace(/{sym}/g, symbol).replace(/{dir}/g, dir);
                
                // update mock balances
                setBalances(prev => {
                    let strategy_agent = prev.strategy_agent;
                    let risk_agent = prev.risk_agent;
                    let signal_agent = prev.signal_agent;
                    
                    if (step.action === 'PAY_SIGNAL_AGENT') {
                        strategy_agent -= 0.001;
                        signal_agent += 0.001;
                    }
                    if (step.action === 'EVALUATE_RISK') {
                        strategy_agent -= 0.0005;
                        risk_agent += 0.0005;
                    }
                    
                    return { strategy_agent, risk_agent, signal_agent };
                });

                setLogs(prev => [
                    ...prev,
                    {
                        agent: step.agent,
                        action: step.action,
                        details: cleanDetails,
                        timestamp: new Date().toLocaleTimeString()
                    }
                ]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 1500);
    };

    return (
        <div className="border border-hairline bg-surface p-6">
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

            {/* Wallet Budgets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-background border border-hairline p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Strategy Agent</span>
                        <User className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="font-mono text-base font-semibold text-ink">{balances.strategy_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted">Budget Limit: 0.10 / day</span>
                </div>
                <div className="bg-background border border-hairline p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Risk Agent</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-approve" />
                    </div>
                    <div className="font-mono text-base font-semibold text-ink">{balances.risk_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted">Validation Fee: 0.0005 / check</span>
                </div>
                <div className="bg-background border border-hairline p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Signal Agent</span>
                        <Coins className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="font-mono text-base font-semibold text-ink">{balances.signal_agent.toFixed(6)} USDC</div>
                    <span className="font-mono text-[8px] text-muted">Unlock Fee: 0.001 / signal</span>
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
        </div>
    );
}
