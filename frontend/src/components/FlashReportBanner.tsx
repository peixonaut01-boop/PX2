'use client';

import { useState, useEffect } from 'react';

interface FlashReportData {
    id: string;
    indicator: string;
    reference_date: string;
    headline: string;
    metrics: Record<string, number | null>;
    analysis: string;
    generated_at: string;
}

interface FlashReportsCache {
    metadata: { last_updated: string | null };
    reports: FlashReportData[];
}

const indicatorColors: Record<string, { bg: string; border: string; text: string }> = {
    IPCA: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-800', text: 'text-red-800 dark:text-red-300' },
    IPCA15: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-800', text: 'text-orange-800 dark:text-orange-300' },
    PIM: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300' },
    PMC: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-300 dark:border-green-800', text: 'text-green-800 dark:text-green-300' },
    PMS: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-300 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-300' },
};

export default function FlashReportBanner({ indicator }: { indicator: 'IPCA' | 'IPCA15' | 'PIM' | 'PMC' | 'PMS' }) {
    const [report, setReport] = useState<FlashReportData | null>(null);

    useEffect(() => {
        async function loadReport() {
            try {
                const response = await fetch('/data/flash_reports.json');
                if (!response.ok) return;
                const data: FlashReportsCache = await response.json();
                const found = data.reports.find(r => r.indicator === indicator);
                if (found) setReport(found);
            } catch (err) {
                console.error('Error loading flash report:', err);
            }
        }
        loadReport();
    }, [indicator]);

    if (!report) return null;

    const colors = indicatorColors[indicator] || indicatorColors.IPCA;
    const generatedDate = new Date(report.generated_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <section className={`mb-6 rounded-2xl border ${colors.border} ${colors.bg} p-6`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors.text} bg-white/60 dark:bg-black/20`}>
                        ⚡ Flash Report
                    </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Gerado em {generatedDate}
                </span>
            </div>

            <h3 className={`text-lg font-bold ${colors.text} mb-3`}>
                {report.headline}
            </h3>

            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {report.analysis}
            </p>

            {/* Metrics badges inline */}
            <div className="flex flex-wrap gap-2 mt-4">
                {report.metrics.mom !== undefined && report.metrics.mom !== null && (
                    <span className="text-xs px-2 py-1 bg-white/70 dark:bg-black/20 rounded-lg font-medium">
                        Marginal: {report.metrics.mom.toFixed(2).replace('.', ',')}%
                    </span>
                )}
                {report.metrics.yoy !== undefined && report.metrics.yoy !== null && (
                    <span className="text-xs px-2 py-1 bg-white/70 dark:bg-black/20 rounded-lg font-medium">
                        Acum 12m: {report.metrics.yoy.toFixed(2).replace('.', ',')}%
                    </span>
                )}
                {report.metrics.servicos !== undefined && report.metrics.servicos !== null && (
                    <span className="text-xs px-2 py-1 bg-white/70 dark:bg-black/20 rounded-lg font-medium">
                        Serviços: {report.metrics.servicos.toFixed(2).replace('.', ',')}%
                    </span>
                )}
                {report.metrics.ex3 !== undefined && report.metrics.ex3 !== null && (
                    <span className="text-xs px-2 py-1 bg-white/70 dark:bg-black/20 rounded-lg font-medium">
                        Núcleo Ex3: {report.metrics.ex3.toFixed(2).replace('.', ',')}%
                    </span>
                )}
            </div>
        </section>
    );
}
