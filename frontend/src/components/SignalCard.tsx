'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { motion, useReducedMotion, AnimatePresence, Variants } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, Target, Zap, Lock, Unlock, Loader2, Check, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'

interface Signal {
    id: string
    symbol: string
    direction: 'BUY' | 'SELL'
    entry_price: number
    stop_loss: number
    take_profit: number
    probability_score: number
    signal_score: number
    confidence_level: string
    risk_rating: string
    trade_explanation: string
    position_sizing: number
    created_at: string
    expires_at: string
    gated?: boolean
    price_usdc?: number
    debate_transcript?: string
}

export default function SignalCard({ signal: initialSignal }: { signal: Signal }) {
    const [signal, setSignal] = useState<Signal>(initialSignal)
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [showDebate, setShowDebate] = useState(false)
    const shouldReduceMotion = useReducedMotion()

    const isBuy = signal.direction === 'BUY'
    
    // Fallback calculation in case of division by zero
    const denominator = Math.abs(signal.entry_price - signal.stop_loss);
    const riskReward = denominator !== 0 
        ? Math.abs((signal.take_profit - signal.entry_price) / denominator) 
        : 2.0;

    const handleUnlock = async () => {
        setPaymentStatus('processing')
        setError(null)
        try {
            // 1. Execute the nanopayment via user's embedded wallet in the backend
            const price = signal.price_usdc || 0.001000
            const destination_wallet = "0x71C7656EC7ab88b098defB751B7401B5f6d1476B"
            
            const payResponse = await api.post('/wallet/pay', {
                signal_id: signal.id,
                destination: destination_wallet,
                amount: price
            })
            
            const realTxHash = payResponse.data.tx_hash
            
            // Wait 1.2 seconds to simulate block finality on Arc L1
            await new Promise(resolve => setTimeout(resolve, 1200))

            // 2. Query the backend details endpoint with the payment transaction hash header
            const response = await api.get(`/signals/${signal.id}/details`, {
                headers: {
                    'X-Payment-Tx': realTxHash
                }
            })
            
            setPaymentStatus('success')
            
            // Wait a short time for the checkmark animation to complete before revealing details
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 3. Update state with full signal details
            setSignal(response.data)
            
            // Dispatch event to update the dashboard wallet balance
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('wallet_balance_updated'))
            }
        } catch (err: any) {
            console.error('Failed to unlock signal via API:', err)
            setPaymentStatus('failed')
            setError(err.response?.data?.detail || 'Nanopayment failed. Check your wallet balance.')
            
            // Reset to idle after 1.5 seconds so they can attempt again
            setTimeout(() => {
                setPaymentStatus('idle')
            }, 1500)
        }
    }

    const shakeVariants: Variants = {
        failed: {
            x: [0, -6, 6, -6, 6, -3, 3, 0],
            transition: { duration: 0.4, ease: 'easeInOut' }
        }
    }

    return (
        <motion.div
            variants={shakeVariants}
            animate={paymentStatus === 'failed' ? 'failed' : ''}
            whileHover={shouldReduceMotion ? {} : { 
                y: -4, 
                borderColor: isBuy ? 'rgba(34,199,135,0.35)' : 'rgba(255,93,93,0.35)', 
                boxShadow: isBuy ? '0 12px 35px rgba(34,199,135,0.15)' : '0 12px 35px rgba(255,93,93,0.15)' 
            }}
            className="group relative bg-surface/85 backdrop-blur-md rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-6 border border-hairline shadow-xl transition-all duration-300 overflow-hidden"
        >
            
            {/* Visual gradient overlay matching BUY/SELL direction */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none ${
                isBuy ? 'bg-gradient-to-br from-emerald-500 to-transparent' : 'bg-gradient-to-br from-rose-500 to-transparent'
            }`}></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">{signal.symbol}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-0.5 rounded-full ${
                                isBuy 
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            }`}>
                                {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {signal.direction}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted bg-surface/50 border border-hairline px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                            </span>
                        </div>
                    </div>

                    {/* Signal Score Circular Badge */}
                    <div className="relative shrink-0">
                        <svg className="w-14 h-14 transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="var(--color-hairline)" strokeWidth="3" fill="none" />
                            <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 24}`}
                                strokeDashoffset={`${2 * Math.PI * 24 * (1 - signal.signal_score / 10)}`}
                                className={signal.signal_score >= 8.5 ? 'text-approve' : signal.signal_score >= 7.0 ? 'text-review' : 'text-accent'}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-ink leading-none">{signal.signal_score.toFixed(1)}</span>
                            <span className="text-[7px] text-muted font-bold mt-0.5 uppercase tracking-wider">Score</span>
                        </div>
                    </div>
                </div>

                {/* Blurable Pricing Targets Box */}
                <div className="relative mb-5 bg-background/25 rounded-2xl p-3 border border-hairline">
                    <div className={`grid grid-cols-3 gap-3 transition-all duration-300 ${signal.gated ? 'blur-[5px] select-none pointer-events-none' : ''}`}>
                        <PriceElement label="Entry Price" value={signal.entry_price} color="text-accent" gated={signal.gated} />
                        <PriceElement label="Stop Loss" value={signal.stop_loss} color="text-block" gated={signal.gated} />
                        <PriceElement label="Take Profit" value={signal.take_profit} color="text-approve" gated={signal.gated} />
                    </div>

                    {/* Overlay Padlock Gating with exit transition */}
                    <AnimatePresence>
                        {signal.gated && (
                            <motion.div
                                key="gate"
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-2xl backdrop-blur-[2px]"
                            >
                                <div className="w-8 h-8 rounded-full bg-surface border border-hairline flex items-center justify-center shadow-lg">
                                    <Lock className="w-3.5 h-3.5 text-review" />
                                </div>
                                <span className="text-[9px] font-bold tracking-widest text-muted uppercase mt-1">Gated Signals</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2.5 bg-surface/40 border border-hairline rounded-2xl p-3">
                        <Zap className="w-4 h-4 text-accent" />
                        <div>
                            <span className="block text-[9px] font-bold text-muted uppercase tracking-wide">Win Prob</span>
                            <span className="text-xs font-bold text-ink">{signal.probability_score.toFixed(0)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-surface/40 border border-hairline rounded-2xl p-3">
                        <Target className="w-4 h-4 text-review" />
                        <div>
                            <span className="block text-[9px] font-bold text-muted uppercase tracking-wide">Risk/Reward</span>
                            <span className="text-xs font-bold text-ink">{signal.gated ? 'Locked' : `1:${riskReward.toFixed(1)}`}</span>
                        </div>
                    </div>
                </div>

                {/* Technical Meta Tag badges */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        signal.confidence_level === 'High' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        signal.confidence_level === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                        {signal.confidence_level} Confidence
                    </span>
                    <span className="text-[10px] font-bold text-muted bg-surface/50 border border-hairline px-2.5 py-0.5 rounded-full">
                        {signal.risk_rating} Risk
                    </span>
                    <span className="text-[10px] font-bold text-muted bg-surface/50 border border-hairline px-2.5 py-0.5 rounded-full">
                        {signal.gated ? 'Nano Gated' : `${signal.position_sizing.toFixed(1)}% Allocation`}
                    </span>
                </div>

                {/* Trade Setup Explanation Box */}
                <div className="bg-background/20 rounded-2xl p-3 border border-hairline mb-5">
                    <p className={`text-xs leading-relaxed transition-all duration-300 ${
                        signal.gated ? 'text-muted italic' : 'text-ink/80'
                    }`}>
                        {signal.trade_explanation}
                    </p>
                </div>

                {/* x402 Nanopayment Trigger Button */}
                {signal.gated && (
                    <div className="relative">
                        <button
                            onClick={handleUnlock}
                            disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
                            className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 px-6 rounded-full transition-all duration-300 shadow-lg text-sm select-none relative overflow-hidden active:scale-[0.98] ${
                                paymentStatus === 'processing'
                                    ? 'bg-[#4f46e5]/40 text-indigo-200 border border-indigo-500/20 cursor-wait'
                                    : paymentStatus === 'success'
                                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                                    : paymentStatus === 'failed'
                                    ? 'bg-rose-600 text-white shadow-rose-500/20'
                                    : 'bg-ink text-background hover:bg-accent hover:text-background border border-hairline shadow-md hover:shadow-lg'
                            }`}
                        >
                            {/* Glass shimmer overlay during processing */}
                            {paymentStatus === 'processing' && (
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                                />
                            )}

                            <AnimatePresence mode="wait">
                                {paymentStatus === 'processing' ? (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                        <span>Settling on Arc L1...</span>
                                    </motion.div>
                                ) : paymentStatus === 'success' ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            <Check className="w-4 h-4 text-white" />
                                        </motion.div>
                                        <span>Payment Verified</span>
                                    </motion.div>
                                ) : paymentStatus === 'failed' ? (
                                    <motion.div
                                        key="failed"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 text-white" />
                                        <span>Verification Failed</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span>Unlock Signal for {(signal.price_usdc || 0.001000).toFixed(4)} USDC</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                        {error && (
                            <p className="text-[11px] text-rose-400 text-center mt-2 font-medium">{error}</p>
                        )}
                    </div>
                )}

                {/* AI Consensus Committee Debate */}
                {(() => {
                    if (signal.gated || !signal.debate_transcript) return null;
                    try {
                        const debateData = JSON.parse(signal.debate_transcript);
                        return (
                            <div className="mt-5 border-t border-hairline pt-4">
                                <button
                                    onClick={() => setShowDebate(!showDebate)}
                                    className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-wider text-accent hover:opacity-85 transition-colors"
                                >
                                    <span>💬 AI Committee Consensus</span>
                                    <span>{showDebate ? 'Hide Debate' : 'Show Debate'}</span>
                                </button>
                                
                                {showDebate && (
                                    <div className="mt-3 space-y-3 bg-background/50 rounded-xl p-3 border border-hairline">
                                        <div className="flex gap-2 justify-between text-[9px] font-bold text-muted border-b border-hairline pb-2">
                                            <span className={debateData.technical_vote === 'APPROVE' ? 'text-emerald-500' : 'text-rose-500'}>
                                                Tech: {debateData.technical_vote}
                                            </span>
                                            <span className={debateData.macro_vote === 'APPROVE' ? 'text-emerald-500' : 'text-rose-500'}>
                                                Macro: {debateData.macro_vote}
                                            </span>
                                            <span className={debateData.risk_vote === 'APPROVE' ? 'text-emerald-500' : 'text-rose-500'}>
                                                Risk: {debateData.risk_vote}
                                            </span>
                                        </div>
                                        
                                        <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1 text-[11px]">
                                            {debateData.debate_rounds?.map((round: any, i: number) => (
                                                <div key={i} className="space-y-0.5">
                                                    <span className={`block font-bold ${
                                                        round.speaker === 'Technical Analyst' ? 'text-accent' :
                                                        round.speaker === 'Macro/Sentiment Analyst' ? 'text-review' :
                                                        'text-block'
                                                    }`}>
                                                        {round.speaker}:
                                                    </span>
                                                    <p className="text-ink/90 italic">&ldquo;{round.message}&rdquo;</p>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="border-t border-hairline pt-2 text-[10px] text-muted leading-normal">
                                            <strong className="text-ink font-bold block mb-0.5">Consensus Resolution:</strong>
                                            {debateData.consensus_explanation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    } catch (e) {
                        console.error("Error parsing debate transcript", e);
                        return null;
                    }
                })()}
            </div>
        </motion.div>
    )
}

function PriceElement({ label, value, color, gated }: { label: string; value: number; color: string; gated?: boolean }) {
    return (
        <div className="text-center">
            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
            <span className={`text-[10px] sm:text-xs font-bold leading-none ${color}`}>
                {gated ? '• • • • •' : value.toFixed(5)}
            </span>
        </div>
    )
}
