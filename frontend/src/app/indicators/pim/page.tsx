import Link from "next/link";
import { InflationChart, HeatmapTable } from "@/components/InflationChart";
import FlashReportBanner from "@/components/FlashReportBanner";
import pimData from "../../../../public/data/pim.json";

// Helper: parse date
function parseDate(isoDate: string): Date {
  return new Date(isoDate + "T12:00:00");
}

// Helper: format date for display
function formatDateLong(isoDate: string): string {
  const date = parseDate(isoDate);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// Helper: format date short (e.g., "out/25")
function formatDateShort(isoDate: string): string {
  const date = parseDate(isoDate);
  const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${year}`;
}

// Helper: format chart date
function formatChartDate(isoDate: string): string {
  const date = parseDate(isoDate);
  const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${year}`;
}

// Get data helper
function getDataByOffset(data: any[], offset: number) {
  const index = data.length - 1 + offset;
  return index >= 0 && index < data.length ? data[index] : null;
}

// Prepare chart data
function prepareChartData(rawData: any[], startYear: number = 2021) {
  const startDate = parseDate(`${startYear}-01-01`);
  return rawData
    .filter((row: any) => parseDate(row.data_date) >= startDate)
    .map((row: any) => ({
      ...row,
      date: formatChartDate(row.data_date),
    }));
}

export default function PimPage() {
  const momData = pimData.mom as any[];
  const yoyData = pimData.yoy as any[];
  // const qoqData = pimData.qoq as any[];
  const saIndexData = pimData.sa_index as any[];

  const latestMom = getDataByOffset(momData, 0);
  // const previousMom = getDataByOffset(momData, -1);

  if (!latestMom) {
    return <div className="p-8 text-center">Carregando dados...</div>;
  }

  const formattedDate = formatDateLong(latestMom.data_date);

  // Chart Data Preparation
  const chartDataMom = prepareChartData(momData, 2023);
  const chartDataYoy = prepareChartData(yoyData, 2021);
  const chartDataIndex = prepareChartData(saIndexData, 2012);

  // Series Configuration
  const mainSeries = [
    { key: "1 Indústria geral", name: "Indústria Geral", color: "#0f172a" },
    { key: "3 Indústrias de transformação", name: "Transformação", color: "#16a34a" },
    { key: "2 Indústrias extrativas", name: "Extrativa", color: "#7c3aed" },
  ];

  const categoriesSeries = [
    { key: "1 Bens de capital", name: "Bens de Capital", color: "#ea580c" },
    { key: "2 Bens intermediários", name: "Bens Intermediários", color: "#2563eb" },
    { key: "3 Bens de consumo", name: "Bens de Consumo", color: "#dc2626" },
  ];

  // Indicators for Heatmap
  const indicators = [
    { key: "1 Indústria geral", label: "Indústria Geral" },
    { key: "3 Indústrias de transformação", label: "Ind. Transformação" },
    { key: "2 Indústrias extrativas", label: "Ind. Extrativa" },
    { key: "1 Bens de capital", label: "Bens de Capital" },
    { key: "2 Bens intermediários", label: "Bens Intermediários" },
    { key: "3 Bens de consumo", label: "Bens de Consumo" },
    { key: "31 Bens de consumo duráveis", label: "Bens de Consumo Duráveis" },
    { key: "32 Bens de consumo semiduráveis e não duráveis", label: "Bens de Consumo Semi/Não Duráveis" },
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
          / <span className="text-gray-900 dark:text-white font-semibold">PIM</span>
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
              Produção Industrial (PIM) de <span className="capitalize">{formattedDate}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-700 dark:text-gray-300">
              Pesquisa Industrial Mensal (IBGE). Acompanhamento da produção física da indústria brasileira.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Atualizado em {(pimData.metadata as any).last_updated}
            </p>
          </div>
        </section>

        {/* Flash Report Banner */}
        <FlashReportBanner indicator="PIM" />

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

        {/* Charts Grid */}
        <div className="space-y-8">

          {/* Section 1: General Industry */}
          <section className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Indústria Geral e Setores</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <InflationChart
                data={chartDataMom}
                series={mainSeries}
                title="Variação Mensal (MoM) %"
                showZeroLine
              />
              <InflationChart
                data={chartDataYoy}
                series={mainSeries}
                title="Variação Anual (YoY) %"
                showZeroLine
              />
            </div>
            <div className="mt-6">
              <InflationChart
                data={chartDataIndex}
                series={mainSeries}
                title="Nível do Índice (Sazonalmente Ajustado)"
                yAxisLabel=""
                height={350}
              />
            </div>
          </section>

          {/* Section 2: Economic Categories */}
          <section className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Categorias Econômicas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <InflationChart
                data={chartDataMom}
                series={categoriesSeries}
                title="Variação Mensal (MoM) %"
                showZeroLine
              />
              <InflationChart
                data={chartDataYoy}
                series={categoriesSeries}
                title="Variação Anual (YoY) %"
                showZeroLine
              />
            </div>
            <div className="mt-6">
              <InflationChart
                data={chartDataIndex}
                series={categoriesSeries}
                title="Nível do Índice (Sazonalmente Ajustado)"
                yAxisLabel=""
                height={350}
              />
            </div>
          </section>

        </div>

        {/* Footer Note */}
        <section className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="font-semibold text-gray-900 dark:text-white">Fonte:</strong> IBGE/SIDRA.
        </section>
      </div>
    </main>
  );
}
