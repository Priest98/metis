'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, ShieldAlert, Trash2, ArrowRight, Settings2, Sliders } from 'lucide-react';

interface Node {
    id: string;
    type: 'asset' | 'indicator' | 'risk' | 'execution';
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    data: any;
}

interface StrategyBuilderCanvasProps {
    onChange: (rules: any[], riskManagement: any) => void;
    initialRules?: any[];
    initialRisk?: any;
}

export default function StrategyBuilderCanvas({ onChange, initialRules, initialRisk }: StrategyBuilderCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node[]>([
        {
            id: 'asset-1',
            type: 'asset',
            name: 'Asset Trigger',
            x: 50,
            y: 100,
            width: 200,
            height: 180,
            data: { symbol: 'BTCUSDT', timeframe: '1h' }
        },
        {
            id: 'indicator-1',
            type: 'indicator',
            name: 'Indicator Condition',
            x: 300,
            y: 80,
            width: 210,
            height: 220,
            data: { indicator: 'RSI', condition: 'rsi_oversold', threshold: 30, period: 14 }
        },
        {
            id: 'risk-1',
            type: 'risk',
            name: 'Risk Manager',
            x: 560,
            y: 100,
            width: 200,
            height: 180,
            data: { stop_loss_pips: 20, take_profit_pips: 40 }
        },
        {
            id: 'execution-1',
            type: 'execution',
            name: 'Execution Guard',
            x: 810,
            y: 120,
            width: 190,
            height: 160,
            data: { action: 'BUY', allocation: 100 }
        }
    ]);

    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Handle initial value sync if provided
    useEffect(() => {
        if (initialRules && initialRules.length > 0) {
            const rule = initialRules[0];
            setNodes(prev => prev.map(n => {
                if (n.type === 'indicator') {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            condition: rule.condition || 'rsi_oversold',
                            threshold: rule.parameters?.threshold || 30,
                            period: rule.parameters?.period || 14
                        }
                    };
                }
                return n;
            }));
        }
        if (initialRisk) {
            setNodes(prev => prev.map(n => {
                if (n.type === 'risk') {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            stop_loss_pips: initialRisk.stop_loss_pips || 20,
                            take_profit_pips: initialRisk.take_profit_pips || 40
                        }
                    };
                }
                return n;
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper to compile state into JSON and bubble it up
    const compileAndBubble = (currentNodes: Node[]) => {
        const assetNode = currentNodes.find(n => n.type === 'asset');
        const indicatorNode = currentNodes.find(n => n.type === 'indicator');
        const riskNode = currentNodes.find(n => n.type === 'risk');
        const execNode = currentNodes.find(n => n.type === 'execution');

        // Compile rule JSON
        const rules = [
            {
                type: 'technical',
                condition: indicatorNode?.data.condition || 'rsi_oversold',
                symbol: assetNode?.data.symbol || 'BTCUSDT',
                timeframe: assetNode?.data.timeframe || '1h',
                parameters: {
                    threshold: Number(indicatorNode?.data.threshold),
                    period: Number(indicatorNode?.data.period || 14)
                }
            }
        ];

        // Compile risk JSON
        const riskManagement = {
            stop_loss_pips: Number(riskNode?.data.stop_loss_pips),
            take_profit_pips: Number(riskNode?.data.take_profit_pips),
            allocation_pct: Number(execNode?.data.allocation || 100),
            action: execNode?.data.action || 'BUY'
        };

        onChange(rules, riskManagement);
    };

    // Handle Node dragging
    const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Only drag from headers
        const target = e.target as HTMLElement;
        if (!target.closest('.node-header')) return;

        e.preventDefault();
        setDraggingNodeId(nodeId);
        
        // Calculate offset between mouse position and node top-left corner
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            setDragOffset({
                x: mouseX - node.x,
                y: mouseY - node.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingNodeId || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = Math.max(0, Math.min(1100, mouseX - dragOffset.x));
        const newY = Math.max(0, Math.min(600, mouseY - dragOffset.y));

        const updatedNodes = nodes.map(node => {
            if (node.id === draggingNodeId) {
                return { ...node, x: newX, y: newY };
            }
            return node;
        });

        setNodes(updatedNodes);
        compileAndBubble(updatedNodes);
    };

    const handleMouseUp = () => {
        setDraggingNodeId(null);
    };

    const updateNodeData = (nodeId: string, field: string, value: any) => {
        const updatedNodes = nodes.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    data: { ...node.data, [field]: value }
                };
            }
            return node;
        });
        setNodes(updatedNodes);
        compileAndBubble(updatedNodes);
    };

    // Calculate bezier curves between adjacent sequential nodes
    const getBezierPath = (nodeA: Node, nodeB: Node) => {
        const startX = nodeA.x + nodeA.width;
        const startY = nodeA.y + 35; // Align to connection port
        const endX = nodeB.x;
        const endY = nodeB.y + 35;
        
        const controlPointX = startX + (endX - startX) / 2;
        return `M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent" />
                    <span className="font-mono text-xs text-muted uppercase tracking-wider">QuantFlow Visual Workspace</span>
                </div>
                <div className="font-mono text-[10px] text-muted">
                    ℹ️ Drag node headers to re-arrange. Parameter edits compile instantly to JSON.
                </div>
            </div>

            {/* Canvas Area */}
            <div
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-[450px] bg-[#0c0c12] border border-hairline relative overflow-hidden select-none cursor-default"
                style={{
                    backgroundImage: 'radial-gradient(rgba(215, 255, 62, 0.03) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            >
                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                        <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#d7ff3e" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.4" />
                        </linearGradient>
                    </defs>

                    {/* Node A -> Node B (Asset -> Indicator) */}
                    <path
                        d={getBezierPath(nodes[0], nodes[1])}
                        stroke="url(#gradient-line)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="6, 6"
                        className="animate-[dash_20s_linear_infinite]"
                        style={{ strokeDashoffset: 100 }}
                    />

                    {/* Node B -> Node C (Indicator -> Risk) */}
                    <path
                        d={getBezierPath(nodes[1], nodes[2])}
                        stroke="url(#gradient-line)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="6, 6"
                        className="animate-[dash_20s_linear_infinite]"
                    />

                    {/* Node C -> Node D (Risk -> Execution) */}
                    <path
                        d={getBezierPath(nodes[2], nodes[3])}
                        stroke="url(#gradient-line)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="6, 6"
                        className="animate-[dash_20s_linear_infinite]"
                    />
                </svg>

                {/* Nodes rendering */}
                {nodes.map((node) => (
                    <div
                        key={node.id}
                        onMouseDown={(e) => handleMouseDown(node.id, e)}
                        style={{
                            left: node.x,
                            top: node.y,
                            width: node.width,
                            height: node.height,
                            position: 'absolute'
                        }}
                        className={`border bg-surface text-ink z-10 select-none flex flex-col transition-shadow ${
                            draggingNodeId === node.id ? 'border-accent shadow-[0_0_15px_rgba(215,255,62,0.15)]' : 'border-hairline hover:border-white/20'
                        }`}
                    >
                        {/* Node Header */}
                        <div className="node-header flex items-center justify-between border-b border-hairline px-3 py-2 bg-background/50 cursor-grab active:cursor-grabbing">
                            <span className="font-display text-xs font-semibold text-ink uppercase tracking-wider">
                                {node.name}
                            </span>
                            <div className="size-1.5 bg-accent rounded-full animate-pulse" />
                        </div>

                        {/* Input/Output Connection Ports */}
                        {node.type !== 'asset' && (
                            <div
                                style={{ top: '35px', left: '-4px' }}
                                className="absolute size-2 bg-approve border border-surface rounded-none"
                                title="Inlet Port"
                            />
                        )}
                        {node.type !== 'execution' && (
                            <div
                                style={{ top: '35px', right: '-4px' }}
                                className="absolute size-2 bg-accent border border-surface rounded-none"
                                title="Outlet Port"
                            />
                        )}

                        {/* Node Content */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-3 font-mono text-[10px] text-muted">
                            {node.type === 'asset' && (
                                <>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Symbol Selection</label>
                                        <select
                                            value={node.data.symbol}
                                            onChange={(e) => updateNodeData(node.id, 'symbol', e.target.value)}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        >
                                            <option value="BTCUSDT">BTC/USDT</option>
                                            <option value="ETHUSDT">ETH/USDT</option>
                                            <option value="SOLUSDT">SOL/USDT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Timeframe</label>
                                        <select
                                            value={node.data.timeframe}
                                            onChange={(e) => updateNodeData(node.id, 'timeframe', e.target.value)}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        >
                                            <option value="1m">1 minute</option>
                                            <option value="5m">5 minutes</option>
                                            <option value="15m">15 minutes</option>
                                            <option value="1h">1 hour</option>
                                            <option value="4h">4 hours</option>
                                            <option value="1d">1 day</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {node.type === 'indicator' && (
                                <>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Indicator Type</label>
                                        <select
                                            value={node.data.indicator}
                                            onChange={(e) => updateNodeData(node.id, 'indicator', e.target.value)}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        >
                                            <option value="RSI">Relative Strength Index (RSI)</option>
                                            <option value="EMA">Exponential Moving Avg (EMA)</option>
                                            <option value="SMA">Simple Moving Avg (SMA)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Trigger Condition</label>
                                        <select
                                            value={node.data.condition}
                                            onChange={(e) => updateNodeData(node.id, 'condition', e.target.value)}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        >
                                            <option value="rsi_oversold">Oversold (Buy Setup)</option>
                                            <option value="rsi_overbought">Overbought (Sell Setup)</option>
                                            <option value="price_cross_above">Price Crosses Above Indicator</option>
                                            <option value="price_cross_below">Price Crosses Below Indicator</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block mb-1 text-[8px] uppercase">Period</label>
                                            <input
                                                type="number"
                                                value={node.data.period}
                                                onChange={(e) => updateNodeData(node.id, 'period', Number(e.target.value))}
                                                className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-[8px] uppercase">Threshold</label>
                                            <input
                                                type="number"
                                                value={node.data.threshold}
                                                onChange={(e) => updateNodeData(node.id, 'threshold', Number(e.target.value))}
                                                className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {node.type === 'risk' && (
                                <>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Stop Loss (Pips)</label>
                                        <input
                                            type="number"
                                            value={node.data.stop_loss_pips}
                                            onChange={(e) => updateNodeData(node.id, 'stop_loss_pips', Number(e.target.value))}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Take Profit (Pips)</label>
                                        <input
                                            type="number"
                                            value={node.data.take_profit_pips}
                                            onChange={(e) => updateNodeData(node.id, 'take_profit_pips', Number(e.target.value))}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {node.type === 'execution' && (
                                <>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Trigger Action</label>
                                        <select
                                            value={node.data.action}
                                            onChange={(e) => updateNodeData(node.id, 'action', e.target.value)}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        >
                                            <option value="BUY">BUY Long</option>
                                            <option value="SELL">SELL Short</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-[9px] uppercase tracking-wider">Size Allocation (%)</label>
                                        <input
                                            type="number"
                                            max="100"
                                            min="10"
                                            value={node.data.allocation}
                                            onChange={(e) => updateNodeData(node.id, 'allocation', Number(e.target.value))}
                                            className="w-full bg-background border border-hairline text-ink px-2 py-1 focus:border-accent focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -1000;
                    }
                }
            `}</style>
        </div>
    );
}
