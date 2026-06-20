import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StrategyResponse } from '@/lib/types';

const StrategyList = () => {
    const [strategies, setStrategies] = useState<StrategyResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await api.get('/strategies/');
                setStrategies(response.data);
            } catch (error) {
                console.error("Error fetching strategies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStrategies();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="h-5 w-5 animate-spin border-b-2 border-accent mx-auto mb-4" />
                <span className="font-mono text-xs text-muted">Loading strategies...</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
                <div key={strategy.id} className="border border-hairline bg-surface p-6 hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-display text-lg font-semibold text-ink">{strategy.name}</h3>
                        <span className="font-mono text-[10px] border border-accent/30 text-accent px-2 py-0.5 bg-accent/5">
                            {strategy.type}
                        </span>
                    </div>
                    <p className="font-mono text-xs text-muted mb-4 h-10 overflow-hidden text-ellipsis">
                        {strategy.description || "No description provided."}
                    </p>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between font-mono text-xs">
                            <span className="text-muted">Risk/Reward</span>
                            <span className="text-ink">
                                {strategy.rules.risk_management?.take_profit_pips} / {strategy.rules.risk_management?.stop_loss_pips} pips
                            </span>
                        </div>
                        <div className="flex justify-between font-mono text-xs">
                            <span className="text-muted">Rules</span>
                            <span className="text-ink">{strategy.rules.rules?.length || 0} conditions</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-hairline">
                        <span className="font-mono text-[0.65rem] text-muted/50">
                            ID: {strategy.id.substring(0, 8)}...
                        </span>
                        <div className="flex gap-2">
                            <button className="font-mono text-[10px] border border-approve/30 text-approve px-3 py-1 bg-approve/5 hover:bg-approve/10 transition-colors">
                                Active
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {strategies.length === 0 && (
                <div className="col-span-full py-20 text-center border border-dashed border-hairline font-mono text-xs text-muted">
                    No strategies found. Create one to get started.
                </div>
            )}
        </div>
    );
};

export default StrategyList;
