'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

export default function KnowledgePage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [ingestContent, setIngestContent] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/knowledge/search', { query });
            setResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIngest = async () => {
        if (!ingestContent) return;
        try {
            await api.post('/knowledge/ingest', { content: ingestContent, category: 'research' });
            setIngestContent('');
            alert('Knowledge Ingested!');
        } catch (error) {
            console.error('Ingest failed:', error);
            alert('Ingest failed');
        }
    };

    return (
        <main className="min-h-screen bg-background text-ink px-5 py-8 sm:px-8">
            <div className="max-w-6xl mx-auto">

                <p className="eyebrow mb-3">knowledge base</p>
                <h1 className="font-display text-3xl font-semibold text-ink mb-10">Quant Knowledge Base</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Search */}
                    <div className="border border-hairline bg-surface p-6">
                        <p className="eyebrow mb-3">semantic search</p>
                        <h2 className="font-display text-xl font-semibold text-ink mb-5">Search Knowledge</h2>

                        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask about strategies, market behavior..."
                                className="flex-1 bg-background border border-hairline text-ink placeholder:text-muted px-4 py-2.5 text-sm font-mono focus:border-accent focus:outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="font-mono bg-ink text-background px-5 py-2.5 text-xs font-semibold transition-colors hover:bg-accent disabled:opacity-40"
                            >
                                {loading ? 'Searching...' : 'Search →'}
                            </button>
                        </form>

                        <div className="space-y-3">
                            {results.map((result: any, i) => (
                                <div key={i} className="p-4 border border-hairline bg-background">
                                    <p className="text-sm text-muted leading-relaxed">{result.content}</p>
                                    <div className="mt-3 pt-3 border-t border-hairline flex gap-2">
                                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] border border-hairline px-2 py-0.5 text-accent">
                                            Match: {(result.similarity * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {results.length === 0 && !loading && (
                                <p className="font-mono text-xs text-muted text-center py-10">No results yet. Try a search above.</p>
                            )}
                            {loading && (
                                <div className="flex justify-center py-10">
                                    <div className="h-5 w-5 animate-spin border-b-2 border-accent" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ingest */}
                    <div className="border border-hairline bg-surface p-6">
                        <p className="eyebrow mb-3">ingest knowledge</p>
                        <h2 className="font-display text-xl font-semibold text-ink mb-3">Add Research</h2>
                        <p className="font-mono text-xs text-muted mb-5 leading-relaxed">
                            Add research papers, notes, or strategy ideas to the vector database.
                        </p>
                        <textarea
                            value={ingestContent}
                            onChange={(e) => setIngestContent(e.target.value)}
                            placeholder="Paste text content here..."
                            className="w-full h-56 bg-background border border-hairline text-ink placeholder:text-muted px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none transition-colors mb-4 resize-none"
                        />
                        <button
                            onClick={handleIngest}
                            disabled={!ingestContent}
                            className="w-full font-mono bg-ink text-background py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-40"
                        >
                            Ingest Content →
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
