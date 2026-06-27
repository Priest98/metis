'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import ExplorerLink from './ExplorerLink';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StepStatus = 'done' | 'active' | 'pending' | 'blocked';

export interface ProofStep {
    id: string;
    label: string;
    detail?: string;
    status: StepStatus;
}

interface SignalProofProps {
    symbol: string;
    timeframe?: string;
    paymentTx?: string;
    steps: ProofStep[];
    /** e.g. "sig_1234" */
    signalId?: string;
    className?: string;
}

// ── Step icon ─────────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
    if (status === 'done')    return <CheckCircle2 size={14} className="text-approve shrink-0" />;
    if (status === 'blocked') return <XCircle      size={14} className="text-block shrink-0" />;
    if (status === 'active')  return <Zap          size={14} className="text-accent shrink-0 animate-pulse" />;
    return <Circle size={14} className="text-muted/30 shrink-0" />;
}

const STEP_LINE: Record<StepStatus, string> = {
    done:    'bg-approve',
    active:  'bg-accent animate-pulse',
    pending: 'bg-hairline',
    blocked: 'bg-block',
};

// ── Default step factory ──────────────────────────────────────────────────────

/** Build a standard 5-step proof from a raw signal object */
export function buildProofSteps(signal: any): ProofStep[] {
    const paid    = !!signal?.payment_tx || signal?.gated === false;
    const regime  = !!signal?.regime_detected || !!signal?.gemini_context;
    const backtest = !!signal?.signal_score && signal.signal_score > 0;
    const risk    = !signal?.blocked;
    const done    = signal?.status === 'active' || signal?.entry_price > 0;

    return [
        {
            id: 'pay',
            label: 'Payment verified',
            detail: paid ? '$0.001 USDC · Arc L1 confirmed' : 'Awaiting x402 payment',
            status: paid ? 'done' : 'active',
        },
        {
            id: 'regime',
            label: 'Regime detected',
            detail: signal?.regime_detected ?? (regime ? 'Gemini analysis complete' : undefined),
            status: paid && regime ? 'done' : paid ? 'active' : 'pending',
        },
        {
            id: 'backtest',
            label: 'Strategy validated',
            detail: backtest ? `Score ${signal.signal_score}/10` : undefined,
            status: regime && backtest ? 'done' : regime ? 'active' : 'pending',
        },
        {
            id: 'risk',
            label: 'Risk check',
            detail: signal?.blocked
                ? `Blocked: ${signal.block_reason ?? 'position limit exceeded'}`
                : backtest ? 'Position sizing ✓ · Stop distance ✓' : undefined,
            status: signal?.blocked ? 'blocked' : backtest && risk ? 'done' : backtest ? 'active' : 'pending',
        },
        {
            id: 'signal',
            label: 'Signal issued',
            detail: done && signal?.entry_price
                ? `${signal.direction} @ ${signal.entry_price}`
                : undefined,
            status: done && !signal?.blocked ? 'done' : risk && backtest ? 'active' : 'pending',
        },
    ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignalProof({
    symbol,
    timeframe,
    paymentTx,
    steps,
    signalId,
    className = '',
}: SignalProofProps) {
    return (
        <div className={`border border-hairline bg-surface p-4 ${className}`}>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">signal proof</p>
                    <p className="font-display text-sm font-semibold text-ink">
                        {symbol}
                        {timeframe && <span className="ml-1.5 font-mono text-[10px] text-muted font-normal">{timeframe}</span>}
                    </p>
                </div>
                {signalId && (
                    <span className="font-mono text-[9px] text-muted/50">{signalId}</span>
                )}
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-0">
                {steps.map((step, i) => (
                    <div key={step.id} className="flex gap-3">
                        {/* Connector column */}
                        <div className="flex flex-col items-center" style={{ width: 16 }}>
                            <StepIcon status={step.status} />
                            {i < steps.length - 1 && (
                                <motion.div
                                    className={`w-px flex-1 my-1 ${STEP_LINE[step.status]}`}
                                    initial={{ scaleY: 0, originY: 0 }}
                                    animate={{ scaleY: step.status !== 'pending' ? 1 : 0.25 }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className="pb-3 pt-px min-w-0">
                            <p className={`font-mono text-[11px] font-medium leading-none ${
                                step.status === 'done'    ? 'text-ink' :
                                step.status === 'active'  ? 'text-accent' :
                                step.status === 'blocked' ? 'text-block' :
                                'text-muted/40'
                            }`}>
                                {step.label}
                            </p>
                            {step.detail && (
                                <p className="mt-0.5 font-mono text-[10px] text-muted leading-snug truncate">
                                    {step.detail}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {paymentTx && (
                <div className="mt-3 font-mono text-[9px] text-muted/50 border-t border-hairline pt-3">
                    <ExplorerLink hash={paymentTx} type="tx" className="text-muted/50 hover:text-accent w-full" />
                </div>
            )}
        </div>
    );
}
