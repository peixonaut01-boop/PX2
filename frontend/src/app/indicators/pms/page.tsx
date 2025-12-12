import Link from "next/link";
import { InflationChart, HeatmapTable } from "@/components/InflationChart";
import FlashReportBanner from "@/components/FlashReportBanner";
import pmsData from "../../../../public/data/pms.json";

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

export default function PmsPage() {
    const momData = pmsData.mom as any[];
    const yoyData = pmsData.yoy as any[];
    const saIndexData = pmsData.sa_index as any[];

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
    // Series Configuration
    const totalSeries = [
        { key: "Total", name: "Serviços Totais", color: "#0f172a" }
    ];

    const categorySeries = [
        { key: "1. Serviços prestados às famílias", name: "Famílias", color: "#ea580c" },
        { key: "2. Serviços de informação e comunicação", name: "Info e Comunicação", color: "#2563eb" },
        { key: "3. Serviços profissionais, administrativos e complementares", name: "Profissionais/Adm", color: "#16a34a" },
        { key: "4. Transportes, serviços auxiliares aos transportes e correio", name: "Transportes", color: "#f59e0b" },
        { key: "5. Outros serviços", name: "Outros", color: "#7c3aed" },
    ];

    // Indicators for Heatmap
    const indicators = [
        { key: "Total", label: "Volume Total de Serviços" },
        { key: "1. Serviços prestados às famílias", label: "Famílias" },
        { key: "2. Serviços de informação e comunicação", label: "Info e Comunicação" },
        { key: "3. Serviços profissionais, administrativos e complementares", label: "Profissionais/Adm" },
        { key: "4. Transportes, serviços auxiliares aos transportes e correio", label: "Transportes" },
        { key: "5. Outros serviços", label: "Outros Serviços" },
    ];

    // Prepare heatmap data
    const prepareHeatmapData = (rawData: any[]) => {
        const last24 = rawData.slice(-24);
        const last12 = last24.slice(-12);
        return last12.map((row) => ({
            date: row.data_date as string,
            formattedDate: formatDateShort(row.data_date as string),
            values: indicators.reduce((acc, ind) => {
                acc[ind.key] = row[ind.key] as number | null;
                return acc;
            }, {} as Record<string, number | null>),
        }));
    };

    const heatmapMomData = prepareHeatmapData(momData);
    const heatmapYoyData = prepareHeatmapData(yoyData);

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
                    / <span className="text-gray-900 dark:text-white font-semibold">PMS</span>
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
                            Volume de Serviços (PMS) de <span className="capitalize">{formattedDate}</span>
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-gray-700 dark:text-gray-300">
                            Pesquisa Mensal de Serviços (IBGE). Acompanhamento conjuntural do setor de serviços.
                        </p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Atualizado em {(pmsData.metadata as any).last_updated}
                        </p>
                    </div>
                </section>

                {/* Flash Report Banner */}
                <FlashReportBanner indicator="PMS" />

                {/* Heatmap Tables */}
                <section className="mb-8 space-y-6">
                    <HeatmapTable
                        data={heatmapMomData}
                        indicators={indicators}
                        title="Variação Mensal (MoM) — Últimos 12 meses"
                    />
                    <HeatmapTable
                        data={heatmapYoyData}
                        indicators={indicators}
                        title="Variação Anual (YoY) — Últimos 12 meses"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 px-1">
                        Valores em % | Cores indicam desvio em relação à média dos últimos 24 meses: tons quentes = acima da média, tons frios = abaixo da média
                    </p>
                </section>

                <div className="space-y-8">

                    {/* Section 1: Total Services */}
                    <section className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Volume Total de Serviços</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <InflationChart
                                data={chartDataMom}
                                series={totalSeries}
                                title="Variação Mensal (MoM) %"
                                showZeroLine
                            />
                            <InflationChart
                                data={chartDataYoy}
                                series={totalSeries}
                                title="Variação Anual (YoY) %"
                                showZeroLine
                            />
                        </div>
                        <div className="mt-6">
                            <InflationChart
                                data={chartDataIndex}
                                series={totalSeries}
                                title="Nível do Volume de Serviços (Sazonalmente Ajustado)"
                                yAxisLabel=""
                                height={350}
                            />
                        </div>
                    </section>

                    {/* Section 2: Categories */}
                    <section className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Abertura por Atividade</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <InflationChart
                                data={chartDataMom}
                                series={categorySeries}
                                title="Variação Mensal (MoM) %"
                                showZeroLine
                            />
                            <InflationChart
                                data={chartDataYoy}
                                series={categorySeries}
                                title="Variação Anual (YoY) %"
                                showZeroLine
                            />
                        </div>
                        <div className="mt-6">
                            <InflationChart
                                data={chartDataIndex}
                                series={categorySeries}
                                title="Nível do Volume de Serviços (Sazonalmente Ajustado)"
                                yAxisLabel=""
                                height={350}
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
