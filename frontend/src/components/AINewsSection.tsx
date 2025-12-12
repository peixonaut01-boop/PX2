'use client';

import { useState, useEffect } from 'react';

interface AINewsItem {
    id: string;
    title: string;
    summary: string;
    source_url: string;
    source_name: 'IBGE' | 'BCB';
    category: string;
    generated_at: string;
    original_date: string;
}

interface AINewsData {
    metadata: {
        last_updated: string | null;
        source_count: number;
    };
    news: AINewsItem[];
}

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}

function formatRelativeTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Agora há pouco';
        if (diffHours < 24) return `Há ${diffHours}h`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `Há ${diffDays} dias`;
        return formatDate(dateString);
    } catch {
        return '';
    }
}

const categoryColors: Record<string, string> = {
    'Inflação': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Indústria': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Serviços': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Comércio': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Política Monetária': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Agropecuária': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Geral': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export default function AINewsSection() {
    const [newsData, setNewsData] = useState<AINewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadNews() {
            try {
                const response = await fetch('/data/ai_news.json');
                if (!response.ok) throw new Error('Failed to load news');
                const data = await response.json();
                setNewsData(data);
            } catch (err) {
                setError('Não foi possível carregar as notícias');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadNews();
    }, []);

    if (loading) {
        return (
            <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Resumos AI
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 animate-pulse"
                        >
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-3"></div>
                            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (error || !newsData?.news?.length) {
        return null; // Don't show section if no AI news available
    }

    return (
        <section className="mb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Resumos AI
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            Notícias oficiais resumidas por IA
                        </p>
                    </div>
                </div>
                {newsData.metadata.last_updated && (
                    <span className="text-xs text-gray-500 dark:text-slate-500">
                        Atualizado {formatRelativeTime(newsData.metadata.last_updated)}
                    </span>
                )}
            </div>

            {/* News Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {newsData.news.map((item) => (
                    <article
                        key={item.id}
                        className="group bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                    >
                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[item.category] || categoryColors['Geral']
                                    }`}
                            >
                                {item.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                                {item.source_name}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-slate-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                                {formatDate(item.original_date)}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {item.title}
                        </h3>

                        {/* Summary */}
                        <p className="text-sm text-gray-700 dark:text-slate-300 mb-4 line-clamp-4">
                            {item.summary}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
                            <a
                                href={item.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                                Ver fonte original →
                            </a>
                            <span className="text-xs text-gray-400 dark:text-slate-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                AI
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
