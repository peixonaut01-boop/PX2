import Link from "next/link";
import { InflationChart, HeatmapTable } from "@/components/InflationChart";
import FlashReportBanner from "@/components/FlashReportBanner";
import pmcData from "../../../../public/data/pmc.json";

function parseDate(isoDate: string): Date {
    return new Date(isoDate + "T12:00:00");
}

function formatDateLong(isoDate: string): string {
    const date = parseDate(isoDate);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatDateShort(isoDate: string): string {
    const date = parseDate(isoDate);
    const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
}

function formatChartDate(isoDate: string): string {
    const date = parseDate(isoDate);
    const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
}

function getDataByOffset(data: any[], offset: number) {
    const index = data.length - 1 + offset;
    return index >= 0 && index < data.length ? data[index] : null;
}

function prepareChartData(rawData: any[], startYear: number = 2021) {
    const startDate = parseDate(`${startYear}-01-01`);
    return rawData
        .filter((row: any) => parseDate(row.data_date) >= startDate)
        .map((row: any) => ({
            ...row,
            date: formatChartDate(row.data_date),
        }));
}

export default function PmcPage() {
    const momData = pmcData.mom as any[];
    const yoyData = pmcData.yoy as any[];
    const saIndexData = pmcData.sa_index as any[];

    const latestMom = getDataByOffset(momData, 0);

    if (!latestMom) {
        return <div className="p-8 text-center">Carregando dados...</div>;
    }

    const formattedDate = formatDateLong(latestMom.data_date);

    // Chart Data Preparation
    const chartDataMom = prepareChartData(momData, 2023);
    const chartDataYoy = prepareChartData(yoyData, 2021);
    const chartDataIndex = prepareChartData(saIndexData, 2012);

    // Series Configuration
    const aggregateSeries = [
        { key: "PMC SA", name: "Varejo Restrito (PMC)", color: "#0f172a" },
        { key: "PMCA SA", name: "Varejo Ampliado (PMCA)", color: "#2563eb" },
    ];

    const aggregateSeriesYoy = [
        { key: "PMC NSA", name: "Varejo Restrito", color: "#0f172a" },
        { key: "PMCA NSA", name: "Varejo Ampliado", color: "#2563eb" },
    ]

    const sectorsSeries = [
        { key: "Hipermercados, supermercados, produtos alimentícios, bebidas e fumo", name: "Supermercados", color: "#16a34a" },
        { key: "Combustíveis e lubrificantes", name: "Combustíveis", color: "#f59e0b" },
        { key: "Tecidos, vestuário e calçados", name: "Vestuário", color: "#db2777" },
        { key: "Móveis e eletrodomésticos", name: "Móveis/Eletro", color: "#7c3aed" },
        { key: "Veículos, motocicletas, partes e peças", name: "Veículos", color: "#dc2626" },
    ];

    // Indicators for Heatmap
    const indicators = [
        { key: "PMC SA", label: "Varejo Restrito (SA)" },
        { key: "PMCA SA", label: "Varejo Ampliado (SA)" },
        { key: "Hipermercados, supermercados, produtos alimentícios, bebidas e fumo", label: "Supermercados" },
        { key: "Combustíveis e lubrificantes", label: "Combustíveis" },
        { key: "Tecidos, vestuário e calçados", label: "Vestuário" },
        { key: "Móveis e eletrodomésticos", label: "Móveis e Eletro" },
        { key: "Veículos, motocicletas, partes e peças", label: "Veículos" },
        { key: "Material de construção", label: "Mat. Construção" },
        { key: "Equipamentos e materiais para escritório, informática e comunicação", label: "Escritório/Info" },
        { key: "Artigos farmacêuticos, médicos, ortopédicos, de perfumaria e cosméticos", label: "Farmácia" },
        { key: "Livros, jornais, revistas e papelaria", label: "Livros/Papelaria" },
        { key: "Outros artigos de uso pessoal e doméstico", label: "Outros Artigos" },
    ];

    // Indicators for Heatmap (MoM uses SA, YoY use NSA)
    const momIndicators = [
        { key: "PMC SA", label: "Varejo Restrito (SA)" },
        { key: "PMCA SA", label: "Varejo Ampliado (SA)" },
        ...indicators.slice(2)
    ];

    const yoyIndicators = [
        { key: "PMC NSA", label: "Varejo Restrito" },
        { key: "PMCA NSA", label: "Varejo Ampliado" },
        ...indicators.slice(2)
    ];

    const prepareHeatmapData = (rawData: any[], isYoy = false) => {
        const last24 = rawData.slice(-24);
        const last12 = last24.slice(-12);
        const targetIndicators = isYoy ? yoyIndicators : momIndicators;

        return last12.map((row) => ({
            date: row.data_date as string,
            formattedDate: formatDateShort(row.data_date as string),
            values: targetIndicators.reduce((acc, ind) => {
                acc[ind.key] = row[ind.key] as number | null;
                return acc;
            }, {} as Record<string, number | null>),
        }));
    };

    const heatmapMomData = prepareHeatmapData(momData, false);
    const heatmapYoyData = prepareHeatmapData(yoyData, true);

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
                        Início
                    </Link>{" "}
                    /{" "}
                    <Link href="/indicators" className="text-blue-600 hover:underline dark:text-blue-400">
                        Brasil
                    </Link>{" "}
                    / <span className="text-gray-900 dark:text-white font-semibold">PMC</span>
                </div>

                {/* Header */}
                <section className="mb-8 rounded-3xl px-8 py-8 shadow-xl relative overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
                            <span>Macro Brasil</span>
                            <span>•</span>
                            <span>Atividade</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Vendas no Varejo (PMC) de <span className="capitalize">{formattedDate}</span>
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-gray-700 dark:text-gray-300">
                            Pesquisa Mensal de Comércio (IBGE). Monitoramento do volume de vendas do comércio varejista.
                        </p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Atualizado em {(pmcData.metadata as any).last_updated}
                        </p>
                    </div>
                </section>

                {/* Flash Report Banner */}
                <FlashReportBanner indicator="PMC" />

                {/* Heatmap Tables */}
                <section className="mb-8 space-y-6">
                    <HeatmapTable
                        data={heatmapMomData}
                        indicators={momIndicators}
                        title="Variação Mensal (MoM) — Últimos 12 meses"
                    />
                    <HeatmapTable
                        data={heatmapYoyData}
                        indicators={yoyIndicators}
                        title="Variação Anual (YoY) — Últimos 12 meses"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 px-1">
                        Valores em % | Cores indicam desvio em relação à média dos últimos 24 meses: tons quentes = acima da média, tons frios = abaixo da média
                    </p>
                </section>

                <div className="space-y-8">

                    {/* Section 1: Aggregate Views */}
                    <section className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Varejo Restrito vs Ampliado</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <InflationChart
                                data={chartDataMom}
                                series={aggregateSeries}
                                title="Variação Mensal (MoM) %"
                                showZeroLine
                            />
                            <InflationChart
                                data={chartDataYoy}
                                series={aggregateSeriesYoy}
                                title="Variação Anual (YoY) %"
                                showZeroLine
                            />
                        </div>
                        <div className="mt-6">
                            <InflationChart
                                data={chartDataIndex}
                                series={aggregateSeries}
                                title="Nível do Volume de Vendas (Sazonalmente Ajustado)"
                                yAxisLabel=""
                                height={350}
                            />
                        </div>
                    </section>

                    {/* Section 2: Main Sectors */}
                    <section className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Principais Setores</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <InflationChart
                                data={chartDataMom}
                                series={sectorsSeries}
                                title="Variação Mensal (MoM) %"
                                showZeroLine
                            />
                            <InflationChart
                                data={chartDataYoy}
                                series={sectorsSeries}
                                title="Variação Anual (YoY) %"
                                showZeroLine
                            />
                        </div>
                    </section>

                </div>

                <section className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    <strong className="font-semibold text-gray-900 dark:text-white">Fonte:</strong> IBGE/SIDRA.
                </section>
            </div>
        </main>
    );
}
