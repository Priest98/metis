import React, { useState } from 'react';
import api from '@/lib/api';
import { StrategyResponse } from '@/lib/types';
import StrategyBuilderCanvas from './StrategyBuilderCanvas';

interface StrategyFormProps {
    onSuccess?: (strategy: StrategyResponse) => void;
}

const StrategyForm: React.FC<StrategyFormProps> = ({ onSuccess }) => {
    const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        rules: JSON.stringify([
            {
                "type": "technical",
                "condition": "rsi_oversold",
                "parameters": { "threshold": 30 }
            }
        ], null, 2),
        risk_management: JSON.stringify({
            "stop_loss_pips": 20,
            "take_profit_pips": 40
        }, null, 2)
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCanvasChange = (newRules: any[], newRisk: any) => {
        setFormData(prev => ({
            ...prev,
            rules: JSON.stringify(newRules, null, 2),
            risk_management: JSON.stringify(newRisk, null, 2)
        }));
    };

    const getParsedJSON = (str: string, fallback: any) => {
        try {
            return JSON.parse(str);
        } catch {
            return fallback;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Parse JSON fields
            const rules = JSON.parse(formData.rules);
            const risk_management = JSON.parse(formData.risk_management);

            const payload = {
                name: formData.name,
                description: formData.description,
                strategy_type: 'json',
                config: {
                    rules,
                    risk_management
                },
                executable_code: ""
            };

            const response = await api.post('/strategies/', payload);
            if (response.status === 201) {
                // Reset form
                setFormData({
                    name: '',
                    description: '',
                    rules: JSON.stringify([
                        { "type": "technical", "condition": "rsi_oversold", "parameters": { "threshold": 30 } }
                    ], null, 2),
                    risk_management: JSON.stringify({
                        "stop_loss_pips": 20,
                        "take_profit_pips": 40
                    }, null, 2)
                });
                if (onSuccess) onSuccess(response.data);
            }
        } catch (err: any) {
            console.error("Error creating strategy:", err);
            setError(err.response?.data?.detail || err.message || "Failed to create strategy");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 border border-hairline bg-surface p-6 sm:p-8 rounded-[1.75rem] shadow-xl">
            <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4">
                <h3 className="font-display text-lg font-semibold text-ink">Create New Strategy</h3>
                <div className="flex border border-hairline p-0.5 rounded-full bg-black/10">
                    <button
                        type="button"
                        onClick={() => setEditorMode('visual')}
                        className={`font-mono text-[10px] uppercase tracking-wider px-4.5 py-1.5 transition-all rounded-full ${
                            editorMode === 'visual' ? 'bg-ink text-background font-semibold' : 'text-muted hover:text-ink'
                        }`}
                    >
                        Visual Flow
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditorMode('json')}
                        className={`font-mono text-[10px] uppercase tracking-wider px-4.5 py-1.5 transition-all rounded-full ${
                            editorMode === 'json' ? 'bg-ink text-background font-semibold' : 'text-muted hover:text-ink'
                        }`}
                    >
                        Raw JSON
                    </button>
                </div>
            </div>

            {error && (
                <div className="border border-block/30 bg-block/5 text-block p-4 font-mono text-xs rounded-xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="font-mono text-xs text-muted mb-2 block">Strategy Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-background border border-hairline text-ink placeholder:text-muted px-5 py-3 text-sm font-mono focus:border-accent focus:outline-none transition-colors rounded-full"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. RSI Momentum Scalper"
                    />
                </div>

                <div>
                    <label className="font-mono text-xs text-muted mb-2 block">Description</label>
                    <textarea
                        className="w-full bg-background border border-hairline text-ink placeholder:text-muted px-5 py-3 text-sm font-mono focus:border-accent focus:outline-none transition-colors h-20 resize-none rounded-2xl"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your strategy logic..."
                    />
                </div>

                {editorMode === 'visual' ? (
                    <div className="border-t border-hairline pt-4">
                        <StrategyBuilderCanvas
                            onChange={handleCanvasChange}
                            initialRules={getParsedJSON(formData.rules, [])}
                            initialRisk={getParsedJSON(formData.risk_management, {})}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-mono text-xs text-muted mb-2 block">Rules (JSON)</label>
                            <textarea
                                className="w-full bg-background border border-hairline text-approve font-mono text-xs focus:border-accent focus:outline-none transition-colors h-40 rounded-2xl p-4"
                                value={formData.rules}
                                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                            />
                            <p className="font-mono text-[10px] text-muted/60 mt-1">Define entry conditions like price action or indicators.</p>
                        </div>
                        <div>
                            <label className="font-mono text-xs text-muted mb-2 block">Risk Management (JSON)</label>
                            <textarea
                                className="w-full bg-background border border-hairline text-approve font-mono text-xs focus:border-accent focus:outline-none transition-colors h-40 rounded-2xl p-4"
                                value={formData.risk_management}
                                onChange={(e) => setFormData({ ...formData, risk_management: e.target.value })}
                            />
                            <p className="font-mono text-[10px] text-muted/60 mt-1">Set SL/TP and position sizing parameters.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={submitting}
                    className="font-mono bg-ink text-background py-3.5 px-8 text-xs font-bold hover:bg-accent transition-all rounded-full active:scale-[0.98] disabled:opacity-40 shadow-md"
                >
                    {submitting ? 'Creating...' : 'Create Strategy'}
                </button>
            </div>
        </form>
    );
};

export default StrategyForm;
