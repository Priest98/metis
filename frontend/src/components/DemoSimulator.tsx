'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ChevronRight, ChevronLeft, Zap, Shield, TrendingUp, Brain, ArrowRight, CheckCircle2, Loader2, Lock, Unlock, BarChart2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type StepStatus = 'idle' | 'running' | 'done';

interface SimStep {
    id: number;
    title: string;
    subtitle: string;
    agent: string;
    agentColor: string;
    agentBg: string;
    Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    events: string[];
    payment?: { from: string; to: string; amount: string; label: string };
    result?: { label: string; value: string; positive?: boolean };
}

// ── Simulation Script ─────────────────────────────────────────────────────────

const STEPS: SimStep[] = [
    {
        id: 1,
        title: 'Market Scanner Triggered',
        subtitle: 'Continuous regime detector identifies a high-probability setup on BTC/USDT',
        agent: 'ScannerAgent',
        agentColor: '#6ba3ff',
        agentBg:    'rgba(75,139,255,0.12)',
        Icon: BarChart2,
        events: [
            'Scanning 47 instruments across 4 timeframes...',
            'BTC/USDT 4H: Bollinger Band squeeze detected',
            'ADX: 31.4 → trending regime confirmed',
            'Volume profile: institutional accumulation zone',
            'Trigger threshold met → broadcasting to Signal Agent',
        ],
    },
    {
        id: 2,
        title: 'Signal Agent Broadcasting',
        subtitle: 'Signal Agent generates a masked signal and lists it on the marketplace',
        agent: 'SignalAgent',
        agentColor: '#D7FF3E',
        agentBg:    'rgba(215,255,62,0.12)',
        Icon: Zap,
        events: [
            'Probability model running (ensemble of 3 models)...',
            'Confidence score: 9.2 / 10.0',
            'Signal probability: 88%',
            'Signal masked — gated behind x402 micropayment',
            'Listed on Metis agent marketplace for 0.001 USDC',
        ],
        result: { label: 'Masked Signal', value: 'BTC/USDT ██████ @ ██████' },
    },
    {
        id: 3,
        title: 'Strategy Agent Pays to Unlock',
        subtitle: 'Strategy Agent evaluates the signal stub and pays 0.001 USDC via Arc L1 to unlock full details',
        agent: 'StrategyAgent',
        agentColor: '#f5a623',
        agentBg:    'rgba(245,166,35,0.12)',
        Icon: Unlock,
        events: [
            'Signal stub received — prob: 88%, score: 9.2',
            'Criteria check: prob ≥ 70% ✓  score ≥ 7.5 ✓',
            'Initiating x402 micropayment via Arc L1...',
            'Tx: 0xarc9f88d27a...  →  0.001000 USDC',
            'Payment confirmed in 1 block (~420ms)',
            'Full signal details unlocked ✓',
        ],
        payment: { from: 'StrategyAgent', to: 'SignalAgent', amount: '0.001000', label: 'Signal Unlock Fee' },
        result: { label: 'Unlocked Signal', value: 'BTC/USDT  BUY  @ $67,420', positive: true },
    },
    {
        id: 4,
        title: 'Risk Agent Validates',
        subtitle: 'Risk Agent checks position sizing, stop distance, and regime correlation. Charges a validation fee.',
        agent: 'RiskAgent',
        agentColor: '#22c787',
        agentBg:    'rgba(34,199,135,0.12)',
        Icon: Shield,
        events: [
            'Receiving signal for risk assessment...',
            'Position sizing: 2% rule applied → 0.12 BTC',
            'Stop distance: $65,800 → 2.4% drawdown ✓',
            'Risk-to-reward ratio: 1 : 2.7 ✓  (min 2.0)',
            'Regime correlation: trending regime supports LONG',
            'Risk validation fee: 0.000500 USDC → ARC L1',
            'Risk profile APPROVED ✓',
        ],
        payment: { from: 'StrategyAgent', to: 'RiskAgent', amount: '0.000500', label: 'Risk Validation Fee' },
        result: { label: 'Risk Status', value: 'APPROVED  R:R 1:2.7', positive: true },
    },
    {
        id: 5,
        title: 'Trade Executed · P&L Tracking',
        subtitle: 'LONG order placed. Agents update their on-chain reputation scores and begin tracking P&L.',
        agent: 'ExecutionAgent',
        agentColor: '#22c787',
        agentBg:    'rgba(34,199,135,0.12)',
        Icon: TrendingUp,
        events: [
            'Submitting LONG BTC/USDT @ $67,420...',
            'TP: $71,200  |  SL: $65,800  |  Size: 0.12 BTC',
            'Order status: FILLED',
            'SignalAgent reputation: 96 → 96.1 ↑',
            'RiskAgent  reputation: 98 → 98.0 (no change)',
            'P&L tracking started · unrealised: +$0',
            'All agents compensated via Arc L1 ✓',
        ],
        result: { label: 'Position Opened', value: 'LONG  0.12 BTC  +$0  (live)', positive: true },
    },
];

// ── Typewriter ────────────────────────────────────────────────────────────────

function Typewriter({ text, speed = 22, onDone }: { text: string; speed?: number; onDone?: () => void }) {
    const [displayed, setDisplayed] = useState('');
    const idx = useRef(0);

    useEffect(() => {
        idx.current = 0;
        setDisplayed('');
        const id = setInterval(() => {
            idx.current += 1;
            setDisplayed(text.slice(0, idx.current));
            if (idx.current >= text.length) {
                clearInterval(id);
                onDone?.();
            }
        }, speed);
        return () => clearInterval(id);
    }, [text, speed, onDone]);

    return <>{displayed}</>;
}

// ── Payment Confirmation Flash ────────────────────────────────────────────────

function PaymentFlash({ payment }: { payment: NonNullable<SimStep['payment']> }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 flex items-center gap-2 p-3 rounded-xl border border-[#D7FF3E]/20 bg-[rgba(215,255,62,0.06)]"
        >
            <CheckCircle2 className="w-4 h-4 text-[#D7FF3E] shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] text-[#D7FF3E] font-semibold">{payment.label}</p>
                <p className="font-mono text-[9px] text-muted mt-0.5">
                    {payment.from} <ArrowRight className="w-2.5 h-2.5 inline" /> {payment.to}
                </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#D7FF3E] shrink-0">+{payment.amount} USDC</span>
        </motion.div>
    );
}

// ── Step Panel ────────────────────────────────────────────────────────────────

function StepPanel({ step, autoPlay }: { step: SimStep; autoPlay: boolean }) {
    const [events,  setEvents]  = useState<string[]>([]);
    const [done,    setDone]    = useState(false);
    const [showPay, setShowPay] = useState(false);
    const idx = useRef(0);

    useEffect(() => {
        idx.current = 0;
        setEvents([]);
        setDone(false);
        setShowPay(false);

        const push = () => {
            if (idx.current >= step.events.length) {
                setDone(true);
                if (step.payment) setTimeout(() => setShowPay(true), 300);
                return;
            }
            setEvents(prev => [...prev, step.events[idx.current]]);
            idx.current += 1;
            setTimeout(push, autoPlay ? 700 + Math.random() * 300 : 0);
        };

        const t = setTimeout(push, autoPlay ? 400 : 0);
        return () => clearTimeout(t);
    }, [step, autoPlay]);

    const Icon = step.Icon;

    return (
        <div className="flex flex-col gap-4">
            {/* Agent badge */}
            <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5 shrink-0" style={{ background: step.agentBg, border: `1px solid ${step.agentColor}30` }}>
                    <Icon className="w-5 h-5" style={{ color: step.agentColor }} />
                </div>
                <div>
                    <p className="font-display text-base font-semibold text-ink">{step.title}</p>
                    <p className="font-mono text-[11px] text-muted mt-0.5">{step.subtitle}</p>
                </div>
            </div>

            {/* Terminal log */}
            <div className="bg-[#060910] border border-white/[0.06] rounded-xl p-4 min-h-[140px] font-mono text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 mb-3">
                    <span className="size-2 rounded-full bg-block/50" />
                    <span className="size-2 rounded-full bg-review/50" />
                    <span className="size-2 rounded-full bg-approve/50" />
                    <span className="ml-2 text-[9px] text-muted/40 tracking-widest">{step.agent.toLowerCase()}.process</span>
                </div>
                <AnimatePresence initial={false}>
                    {events.map((ev, i) => (
                        <motion.p
                            key={i}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-muted leading-relaxed"
                        >
                            <span className="text-muted/40 mr-2">›</span>
                            {ev}
                        </motion.p>
                    ))}
                </AnimatePresence>
                {!done && (
                    <span className="inline-flex items-center gap-1.5 text-muted/40">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> processing…
                    </span>
                )}
            </div>

            {/* Payment flash */}
            {showPay && step.payment && <PaymentFlash payment={step.payment} />}

            {/* Result chip */}
            {done && step.result && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 border font-mono text-xs ${
                        step.result.positive
                            ? 'bg-approve/5 border-approve/20 text-approve'
                            : 'bg-surface border-white/10 text-muted'
                    }`}
                >
                    <span>{step.result.label}</span>
                    <span className="font-bold">{step.result.value}</span>
                </motion.div>
            )}
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

interface DemoSimulatorProps {
    /** If provided, renders as a trigger button that opens the modal */
    triggerClassName?: string;
    /** Force modal open state (controlled from outside) */
    open?: boolean;
    onClose?: () => void;
}

export default function DemoSimulator({ triggerClassName, open: controlledOpen, onClose }: DemoSimulatorProps) {
    const [isOpen,    setIsOpen]    = useState(false);
    const [stepIdx,   setStepIdx]   = useState(0);
    const [autoPlay,  setAutoPlay]  = useState(true);
    const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const open  = controlledOpen !== undefined ? controlledOpen : isOpen;
    const close = useCallback(() => {
        setIsOpen(false);
        setStepIdx(0);
        onClose?.();
    }, [onClose]);

    // Auto-advance steps
    useEffect(() => {
        if (!open || !autoPlay) return;
        autoRef.current = setInterval(() => {
            setStepIdx(prev => {
                if (prev >= STEPS.length - 1) {
                    setAutoPlay(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 5500);
        return () => { if (autoRef.current) clearInterval(autoRef.current); };
    }, [open, autoPlay, stepIdx]);

    // Voice Narration
    useEffect(() => {
        if (open) {
            const step = STEPS[stepIdx];
            const speakText = `Step ${stepIdx + 1}: ${step.title}. ${step.subtitle}`;
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(speakText);
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        } else {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        }
    }, [open, stepIdx]);

    const prev = () => { setAutoPlay(false); setStepIdx(i => Math.max(0, i - 1)); };
    const next = () => {
        setAutoPlay(false);
        setStepIdx(i => Math.min(STEPS.length - 1, i + 1));
    };
    const restart = () => {
        setStepIdx(0);
        setAutoPlay(true);
    };

    const step    = STEPS[stepIdx];
    const pct     = ((stepIdx + 1) / STEPS.length) * 100;

    return (
        <>
            {/* Trigger button */}
            {controlledOpen === undefined && (
                <button
                    onClick={() => { setIsOpen(true); setStepIdx(0); setAutoPlay(true); }}
                    className={triggerClassName ?? `
                        flex items-center gap-2 font-mono text-xs font-semibold
                        bg-[#D7FF3E] text-[#0b0f17] px-4 py-2 rounded-full
                        hover:bg-white transition-colors shadow-lg shadow-[#D7FF3E]/10
                    `}
                >
                    <Play className="w-3.5 h-3.5" />
                    Run Demo
                </button>
            )}

            {/* Modal overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        style={{ background: 'rgba(11,15,23,0.85)', backdropFilter: 'blur(12px)' }}
                        onClick={close}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1,    y: 0  }}
                            exit={   { opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full max-w-xl border border-white/10 bg-[#0f1520] rounded-[1.75rem] shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                                <div>
                                    <p className="font-mono text-[10px] text-[#D7FF3E] uppercase tracking-widest mb-0.5">
                                        metis autonomous agent demo
                                    </p>
                                    <p className="font-display text-sm font-semibold text-ink">
                                        Step {stepIdx + 1} of {STEPS.length}
                                    </p>
                                </div>
                                <button onClick={close} className="text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-white/5">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="h-0.5 bg-white/5">
                                <motion.div
                                    className="h-full bg-[#D7FF3E]"
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            </div>

                            {/* Step dots */}
                            <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                                {STEPS.map((s, i) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { setAutoPlay(false); setStepIdx(i); }}
                                        className={`h-1 rounded-full transition-all duration-300 ${
                                            i === stepIdx    ? 'bg-[#D7FF3E] w-6' :
                                            i  < stepIdx     ? 'bg-approve/60 w-3' :
                                                               'bg-white/10 w-3'
                                        }`}
                                    />
                                ))}
                                <span className="ml-auto font-mono text-[9px] text-muted">
                                    {autoPlay ? '▶ auto' : '⏸ manual'}
                                </span>
                            </div>

                            {/* Step content */}
                            <div className="px-6 pb-4 min-h-[320px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={stepIdx}
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={   { opacity: 0, x: -12 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <StepPanel step={step} autoPlay={autoPlay} />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
                                <button
                                    onClick={prev}
                                    disabled={stepIdx === 0}
                                    className="font-mono text-xs text-muted hover:text-ink disabled:opacity-30 transition-colors flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>

                                {stepIdx === STEPS.length - 1 ? (
                                    <button
                                        onClick={restart}
                                        className="font-mono text-xs font-semibold bg-[#D7FF3E] text-[#0b0f17] px-4 py-1.5 rounded-full hover:bg-white transition-colors flex items-center gap-1.5"
                                    >
                                        <Play className="w-3 h-3" /> Restart
                                    </button>
                                ) : (
                                    <button
                                        onClick={next}
                                        className="font-mono text-xs font-semibold border border-white/15 text-ink px-4 py-1.5 rounded-full hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5"
                                    >
                                        Next <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
