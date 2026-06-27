export interface StrategyResponse {
    id: string;
    name: string;
    description?: string;
    type: 'json' | 'pine' | 'python';
    rules: any;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}
