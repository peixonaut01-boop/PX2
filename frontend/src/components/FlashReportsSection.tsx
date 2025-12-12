'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    Cell,
} from 'recharts';

interface ChartDataPoint {
    date: string;
    value: number;
}

interface FlashReportData {
    id: string;
    indicator: string;
    reference_date: string;
    headline: string;
    metrics: Record<string, number | null>;
    analysis: string;
    chart_data: ChartDataPoint[];
    link: string;
    generated_at: string;
}

interface FlashReportsData {
    metadata: {
        last_updated: string | null;
        report_count: number;
    };
    reports: FlashReportData[];
}

const indicatorColors: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    IPCA: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', bar: '#dc2626' },
    IPCA15: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', bar: '#ea580c' },
    PIM: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', bar: '#2563eb' },
    PMC: { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', bar: '#16a34a' },
    PMS: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', bar: '#9333ea' },
};

const indicatorLabels: Record<string, string> = {
    IPCA: 'Inflação',
    IPCA15: 'Inflação (Prévia)',
    PIM: 'Indústria',
    PMC: 'Varejo',
    PMS: 'Serviços',
};

function MiniChart({ data, color }: { data: ChartDataPoint[]; color: string }) {
    return (
        <div className="h-32 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Variação']}
                        contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                    />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.value >= 0 ? color : '#64748b'}
                                opacity={index === data.length - 1 ? 1 : 0.6}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function MetricBadge({ label, value, suffix = '%' }: { label: string; value: number | null; suffix?: string }) {
    if (value === null || value === undefined) return null;

    return (
        <div className="flex flex-col items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
                {value.toFixed(2).replace('.', ',')}{suffix}
            </span>
        </div>
    );
}

function FlashReportCard({ report }: { report: FlashReportData }) {
    const colors = indicatorColors[report.indicator] || indicatorColors.IPCA;
    const label = indicatorLabels[report.indicator] || report.indicator;

    return (
        <article className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 transition-all hover:shadow-lg`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colors.text} bg-white/50 dark:bg-black/20`}>
                    {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(report.reference_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </span>
            </div>

            {/* Headline */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                {report.headline}
            </h3>

            {/* Metrics Grid */}
            <div className="flex gap-2 flex-wrap mb-4">
                {report.metrics.mom !== undefined && (
                    <MetricBadge label="Marginal" value={report.metrics.mom} />
                )}
                {report.metrics.yoy !== undefined && (
                    <MetricBadge
                        label={report.indicator === 'IPCA' || report.indicator === 'IPCA15' ? 'Acum 12m' : 'Interanual'}
                        value={report.metrics.yoy}
                    />
                )}
                {report.metrics.ex3 !== undefined && (
                    <MetricBadge label="Núcleo Ex3" value={report.metrics.ex3} />
                )}
                {report.metrics.servicos !== undefined && (
                    <MetricBadge label="Serviços" value={report.metrics.servicos} />
                )}
                {report.metrics.administrados !== undefined && (
                    <MetricBadge label="Administrados" value={report.metrics.administrados} />
                )}
                {report.metrics.transformacao !== undefined && (
                    <MetricBadge label="Transformação" value={report.metrics.transformacao} />
                )}
                {report.metrics.extrativas !== undefined && (
                    <MetricBadge label="Extrativas" value={report.metrics.extrativas} />
                )}
                {report.metrics.mom_ampliado !== undefined && (
                    <MetricBadge label="Ampliado" value={report.metrics.mom_ampliado} />
                )}
                {report.metrics.familias !== undefined && (
                    <MetricBadge label="Famílias" value={report.metrics.familias} />
                )}
            </div>

            {/* Mini Chart */}
            <MiniChart data={report.chart_data} color={colors.bar} />

            {/* Analysis */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 leading-relaxed">
                {report.analysis}
            </p>

            {/* Link */}
            <Link
                href={report.link}
                className={`inline-flex items-center mt-4 text-sm font-semibold ${colors.text} hover:underline`}
            >
                Ver relatório completo →
            </Link>
        </article>
    );
}

export default function FlashReportsSection() {
    const [data, setData] = useState<FlashReportsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadReports() {
            try {
                const response = await fetch('/data/flash_reports.json');
                if (!response.ok) throw new Error('Failed to load reports');
                const json = await response.json();
                setData(json);
            } catch (err) {
                console.error('Error loading flash reports:', err);
            } finally {
                setLoading(false);
            }
        }
        loadReports();
    }, []);

    if (loading) {
        return (
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Flash Reports
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse bg-white dark:bg-gray-800">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!data?.reports?.length) {
        return null;
    }

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Flash Reports
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Análises rápidas dos principais indicadores
                    </p>
                </div>
                {data.metadata.last_updated && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                        Atualizado em {new Date(data.metadata.last_updated).toLocaleDateString('pt-BR')}
                    </span>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {data.reports.map((report) => (
                    <FlashReportCard key={report.id} report={report} />
                ))}
            </div>
        </section>
    );
}
