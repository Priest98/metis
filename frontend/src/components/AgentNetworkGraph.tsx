'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Brain, TrendingUp, Search } from 'lucide-react';

interface AgentNode {
    id: string;
    name: string;
    label: string;
    icon: any;
    x: number;
    y: number;
    color: string;
    accent: string;
    bg: string;
    r: number;
}

interface PaymentArc {
    id: string;
    from: string;
    to: string;
    amount: string;
    accent: string;
    timestamp: number;
}

const NODES: AgentNode[] = [
    { id: 'strategy',  name: 'Strategy Agent',  label: 'St', icon: TrendingUp, x: 300, y: 150, r: 34, color: '#f5a623', accent: '#f5a623', bg: 'rgba(245,166,35,0.15)' },
    { id: 'signal',    name: 'Signal Agent',    label: 'S',  icon: Zap,        x: 120, y: 80,  r: 28, color: '#D7FF3E', accent: '#D7FF3E', bg: 'rgba(215,255,62,0.15)' },
    { id: 'risk',      name: 'Risk Agent',      label: 'R',  icon: Shield,     x: 480, y: 80,  r: 28, color: '#22c787', accent: '#22c787', bg: 'rgba(34,199,135,0.15)' },
    { id: 'sentiment', name: 'Sentiment Agent', label: 'Se', icon: Brain,      x: 120, y: 220, r: 28, color: '#6ba3ff', accent: '#6ba3ff', bg: 'rgba(75,139,255,0.15)' },
    { id: 'scanner',   name: 'Scanner Agent',   label: 'X',  icon: Search,     x: 480, y: 220, r: 28, color: '#ff5d5d', accent: '#ff5d5d', bg: 'rgba(255,93,93,0.15)' }
];

export default function AgentNetworkGraph() {
    const [arcs, setArcs] = useState<PaymentArc[]>([]);
    const [totalCount, setTotalCount] = useState(128);
    const [time, setTime] = useState(0);

    // Float nodes gently
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(prev => prev + 0.05);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Random payments triggering
    useEffect(() => {
        const interval = setInterval(() => {
            const possiblePairs = [
                { from: 'scanner', to: 'strategy', amount: '0.0001', color: '#ff5d5d' },
                { from: 'strategy', to: 'signal', amount: '0.0010', color: '#D7FF3E' },
                { from: 'strategy', to: 'risk', amount: '0.0005', color: '#22c787' },
                { from: 'strategy', to: 'sentiment', amount: '0.0003', color: '#6ba3ff' },
                { from: 'signal', to: 'sentiment', amount: '0.0002', color: '#6ba3ff' }
            ];
            
            // Pick 1 or 2 random pairs
            const count = Math.random() > 0.6 ? 2 : 1;
            const chosen: PaymentArc[] = [];
            for (let i = 0; i < count; i++) {
                const pair = possiblePairs[Math.floor(Math.random() * possiblePairs.length)];
                chosen.push({
                    id: Math.random().toString(36).substring(2, 9),
                    from: pair.from,
                    to: pair.to,
                    amount: pair.amount,
                    accent: pair.color,
                    timestamp: Date.now()
                });
            }

            setArcs(prev => [...prev, ...chosen]);
            setTotalCount(prev => prev + chosen.length);

            // Clean up arcs older than 2s
            setTimeout(() => {
                setArcs(prev => prev.filter(arc => Date.now() - arc.timestamp < 2000));
            }, 2100);

        }, 3200);

        return () => clearInterval(interval);
    }, []);

    const getNodePos = (node: AgentNode) => {
        // Apply float offset
        const offsetMultiplier = node.id === 'strategy' ? 3 : 5;
        const phase = node.id === 'strategy' ? 0 : node.id === 'signal' ? 1 : node.id === 'risk' ? 2 : node.id === 'sentiment' ? 3 : 4;
        const dy = Math.sin(time + phase) * offsetMultiplier;
        const dx = Math.cos(time * 0.7 + phase) * (offsetMultiplier / 2);
        return { x: node.x + dx, y: node.y + dy };
    };

    return (
        <div className="border border-hairline bg-[#060910] p-6 rounded-2xl flex flex-col justify-between h-[360px] relative overflow-hidden select-none">
            {/* Header */}
            <div className="flex justify-between items-center z-10">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                    Agent Economy Network
                </span>
                <span className="font-mono text-[9px] bg-accent/15 border border-accent/30 text-accent px-2 py-0.5 rounded-full flex items-center gap-1.5 font-semibold">
                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                    LIVE BLOCKCHAIN DATA
                </span>
            </div>

            {/* SVG Visualizer Canvas */}
            <div className="absolute inset-0 flex items-center justify-center pt-6">
                <svg className="w-full h-full max-w-[600px] max-h-[300px]" viewBox="0 0 600 300">
                    <defs>
                        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#D7FF3E" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#D7FF3E" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* static grid background */}
                    <g opacity="0.05">
                        <line x1="0" y1="50" x2="600" y2="50" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="100" x2="600" y2="100" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="150" x2="600" y2="150" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="200" x2="600" y2="200" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="250" x2="600" y2="250" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />

                        <line x1="100" y1="0" x2="100" y2="300" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="200" y1="0" x2="200" y2="300" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="300" y1="0" x2="300" y2="300" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="400" y1="0" x2="400" y2="300" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="500" y1="0" x2="500" y2="300" stroke="#FFF" strokeWidth="1" strokeDasharray="3,3" />
                    </g>

                    {/* static grey/muted base links */}
                    {NODES.filter(n => n.id !== 'strategy').map(node => {
                        const fromPos = getNodePos(NODES.find(n => n.id === 'strategy')!);
                        const toPos = getNodePos(node);
                        return (
                            <line
                                key={`base-link-${node.id}`}
                                x1={fromPos.x}
                                y1={fromPos.y}
                                x2={toPos.x}
                                y2={toPos.y}
                                stroke="rgba(255, 255, 255, 0.04)"
                                strokeWidth="1.5"
                            />
                        );
                    })}
                    {/* link between signal and sentiment */}
                    {(() => {
                        const fromPos = getNodePos(NODES.find(n => n.id === 'signal')!);
                        const toPos = getNodePos(NODES.find(n => n.id === 'sentiment')!);
                        return (
                            <line
                                x1={fromPos.x}
                                y1={fromPos.y}
                                x2={toPos.x}
                                y2={toPos.y}
                                stroke="rgba(255, 255, 255, 0.04)"
                                strokeWidth="1.5"
                            />
                        );
                    })()}

                    {/* animated payment arcs */}
                    <AnimatePresence>
                        {arcs.map(arc => {
                            const fromNode = NODES.find(n => n.id === arc.from)!;
                            const toNode = NODES.find(n => n.id === arc.to)!;
                            const fromPos = getNodePos(fromNode);
                            const toPos = getNodePos(toNode);

                            // Calculate bezier control point for a slight curve
                            const midX = (fromPos.x + toPos.x) / 2;
                            const midY = (fromPos.y + toPos.y) / 2;
                            const dx = toPos.x - fromPos.x;
                            const dy = toPos.y - fromPos.y;
                            // Normal vector for curve displacement
                            const len = Math.sqrt(dx * dx + dy * dy);
                            const curveDisplacement = 25;
                            const cx = midX - (dy / len) * curveDisplacement;
                            const cy = midY + (dx / len) * curveDisplacement;

                            const pathD = `M ${fromPos.x} ${fromPos.y} Q ${cx} ${cy} ${toPos.x} ${toPos.y}`;

                            return (
                                <g key={arc.id}>
                                    {/* Glowing path */}
                                    <motion.path
                                        d={pathD}
                                        fill="none"
                                        stroke={arc.accent}
                                        strokeWidth="2.5"
                                        initial={{ pathLength: 0, opacity: 0.8 }}
                                        animate={{ pathLength: 1, opacity: [0.8, 1, 0] }}
                                        transition={{ duration: 1.8, ease: 'easeOut' }}
                                    />

                                    {/* Moving dot along path */}
                                    <motion.circle
                                        r="4"
                                        fill={arc.accent}
                                        filter="url(#glow)"
                                        initial={{ offsetDistance: "0%" }}
                                        animate={{ offsetDistance: "100%" }}
                                        transition={{ duration: 1.2, ease: 'easeInOut' }}
                                    >
                                        {/* Fallback svg animateMotion if framer-motion pathOffset/offsetDistance lacks SVG spec support */}
                                        <animateMotion dur="1.2s" repeatCount="1" fill="freeze">
                                            <mpath href={`#path-${arc.id}`} />
                                        </animateMotion>
                                    </motion.circle>

                                    {/* Invisible path for reference */}
                                    <path id={`path-${arc.id}`} d={pathD} fill="none" className="hidden" />

                                    {/* Floating payment label */}
                                    <motion.g
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: [0, 1, 1, 0], y: [0, -10], scale: 1 }}
                                        transition={{ duration: 1.8, times: [0, 0.15, 0.8, 1] }}
                                        className="font-mono text-[9px] font-bold"
                                    >
                                        <rect
                                            x={cx - 32}
                                            y={cy - 8}
                                            width="64"
                                            height="16"
                                            fill="#060910"
                                            stroke={arc.accent}
                                            strokeWidth="1"
                                            rx="4"
                                        />
                                        <text
                                            x={cx}
                                            y={cy + 4}
                                            textAnchor="middle"
                                            fill={arc.accent}
                                            className="font-mono"
                                        >
                                            +{arc.amount}
                                        </text>
                                    </motion.g>
                                </g>
                            );
                        })}
                    </AnimatePresence>

                    {/* Nodes layer */}
                    {NODES.map(node => {
                        const pos = getNodePos(node);
                        const NodeIcon = node.icon;
                        return (
                            <g key={node.id}>
                                {/* Outer pulsing ring if node is active in an arc */}
                                {arcs.some(a => a.from === node.id || a.to === node.id) && (
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={node.r + 6}
                                        fill="none"
                                        stroke={node.accent}
                                        strokeWidth="1"
                                        className="animate-ping opacity-25"
                                    />
                                )}

                                {/* Base circle */}
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={node.r}
                                    fill={node.bg}
                                    stroke={node.accent}
                                    strokeWidth="1.5"
                                    style={{ filter: `drop-shadow(0 0 8px ${node.accent}20)` }}
                                />

                                {/* Icon inside */}
                                <g transform={`translate(${pos.x - 9}, ${pos.y - 9})`} style={{ color: node.color }}>
                                    <NodeIcon className="size-[18px]" strokeWidth={2.2} />
                                </g>

                                {/* Hover tooltip text in overlay */}
                                <text
                                    x={pos.x}
                                    y={pos.y + node.r + 14}
                                    textAnchor="middle"
                                    fill="#ECEEF4"
                                    opacity="0.85"
                                    className="font-mono text-[9px] uppercase tracking-wider font-semibold"
                                >
                                    {node.name.replace(' Agent', '')}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Footer Summary Stats */}
            <div className="z-10 text-center font-mono text-[10px] text-muted pt-2 flex flex-col items-center">
                <span className="flex items-center gap-1.5 text-ink">
                    <span className="size-1.5 rounded-full bg-approve animate-pulse" />
                    <span className="font-semibold text-accent">{totalCount.toLocaleString()}</span> micro-payments verified.
                </span>
                <span className="text-[9px] text-muted/50 mt-0.5">Average payment latency: ~380ms</span>
            </div>
        </div>
    );
}
