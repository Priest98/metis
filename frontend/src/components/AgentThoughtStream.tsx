'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, ChevronRight } from 'lucide-react';

export interface AgentThoughtStreamProps {
    agent: string;
    agentColor: string;
    thoughts: string[];
    decision: string;
    speed?: number;
    onComplete?: () => void;
}

type ThoughtType = 'analyzing' | 'checking' | 'deciding' | 'warning' | 'final';

function classifyLine(index: number, total: number): ThoughtType {
    if (index === total - 1) return 'final';
    if (index === 0)         return 'analyzing';
    if (index === 1)         return 'checking';
    if (index === 2)         return 'deciding';
    if (index === 3)         return 'warning';
    return 'analyzing';
}

const TYPE_META: Record<ThoughtType, { dot: string; text: string; label: string }> = {
    analyzing: { dot: '#8b93a5', text: '#8b93a5', label: 'SCAN'  },
    checking:  { dot: '#D7FF3E', text: '#D7FF3E', label: 'CHECK' },
    deciding:  { dot: '#22c787', text: '#22c787', label: 'CALC'  },
    warning:   { dot: '#ff5d5d', text: '#ff5d5d', label: 'WARN'  },
    final:     { dot: '#ECEEF4', text: '#ECEEF4', label: 'EVAL'  },
};

export default function AgentThoughtStream({
    agent,
    agentColor,
    thoughts,
    decision,
    speed = 600,
    onComplete
}: AgentThoughtStreamProps) {
    const [visibleCount, setVisibleCount] = useState(0);
    const [isThinking, setIsThinking] = useState(true);
    const [showDecision, setShowDecision] = useState(false);

    useEffect(() => {
        setVisibleCount(0);
        setIsThinking(true);
        setShowDecision(false);
    }, [thoughts, decision]);

    useEffect(() => {
        if (visibleCount < thoughts.length) {
            const timer = setTimeout(() => {
                setVisibleCount(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        } else {
            setIsThinking(false);
            const timer = setTimeout(() => {
                setShowDecision(true);
                if (onComplete) onComplete();
            }, speed);
            return () => clearTimeout(timer);
        }
    }, [visibleCount, thoughts.length, speed, onComplete]);

    return (
        <div className="border border-hairline bg-[#0d1119] font-mono text-xs text-left rounded-xl overflow-hidden shadow-2xl transition-all duration-300">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-hairline">
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: agentColor }} />
                    <span className="font-semibold tracking-wide text-ink text-[11px] uppercase">
                        {agent} Stream
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isThinking ? (
                        <>
                            <Loader2 className="size-3.5 animate-spin text-accent" />
                            <span className="text-[10px] text-accent animate-pulse">THINKING</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="size-3.5 text-approve" />
                            <span className="text-[10px] text-approve font-bold">DECIDED</span>
                        </>
                    )}
                </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 space-y-2.5 min-h-[140px] bg-black/10">
                <AnimatePresence>
                    {thoughts.slice(0, visibleCount).map((thought, i) => {
                        const type = classifyLine(i, thoughts.length);
                        const meta = TYPE_META[type];
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-start gap-2.5"
                            >
                                <span className="text-muted shrink-0 select-none">&gt;</span>
                                <div className="flex items-baseline gap-2">
                                    <span 
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 font-bold uppercase shrink-0 border border-white/5"
                                        style={{ color: meta.dot, borderColor: `${meta.dot}20` }}
                                    >
                                        {meta.label}
                                    </span>
                                    <span className="text-ink/90 font-mono leading-relaxed">{thought}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Final Decision Box */}
                <AnimatePresence>
                    {showDecision && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="mt-4 p-3 border rounded-lg bg-black/30 flex items-start gap-3"
                            style={{ borderColor: `${agentColor}30` }}
                        >
                            <div className="size-5 rounded bg-white/5 flex items-center justify-center font-bold text-[10px] uppercase border border-white/10" style={{ color: agentColor }}>
                                FX
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-muted font-bold block">
                                    Final Decision
                                </span>
                                <span className="font-mono text-sm font-semibold text-ink leading-tight">
                                    {decision}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Terminal Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-hairline bg-black/20 text-[9px] text-muted">
                <span>execution pipeline v1.0.2</span>
                <div className="flex items-center gap-1.5">
                    {thoughts.map((_, i) => (
                        <div
                            key={i}
                            className="size-1.5 rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: i < visibleCount ? agentColor : 'rgba(255,255,255,0.06)',
                                transform: i === visibleCount - 1 && isThinking ? 'scale(1.3)' : 'scale(1)'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
