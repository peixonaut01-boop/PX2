import Link from "next/link";
import { InflationChart, MetricCard, InflationTable, DiffusionChart, HeatmapTable } from "@/components/InflationChart";
import FlashReportBanner from "@/components/FlashReportBanner";
import ipcaData from "../../../../public/data/ipca.json";

// Helper: parse date without timezone issues
function parseDate(isoDate: string): Date {
  // Add time component to avoid timezone shifting
  return new Date(isoDate + "T12:00:00");
}

// Helper: format date for display (e.g., "Outubro de 2025")
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

// Helper: format update timestamp
function formatUpdateDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get data by offset from end
function getDataByOffset(data: Record<string, unknown>[], offset: number) {
  const index = data.length - 1 + offset;
  return index >= 0 && index < data.length ? data[index] : null;
}

// Find same month from previous year
function getSameMonthPreviousYear(data: Record<string, unknown>[], currentDate: string) {
  const current = parseDate(currentDate);
  const targetYear = current.getFullYear() - 1;
  const targetMonth = current.getMonth();

  return (
    data.find((row) => {
      const rowDate = parseDate(row.data_date as string);
      return rowDate.getFullYear() === targetYear && rowDate.getMonth() === targetMonth;
    }) || null
  );
}

// Prepare chart data
function prepareChartData(dataKey: "mom" | "a12", startYear: number = 2020) {
  const rawData = ipcaData[dataKey] as Record<string, unknown>[];
  const startDate = parseDate(`${startYear}-01-01`);

  const filtered = rawData.filter((row) => {
    const rowDate = parseDate(row.data_date as string);
    if (dataKey === "a12") {
      return rowDate >= startDate && row.IPCA !== null;
    }
    return rowDate >= startDate;
  });

  return filtered.map((row) => ({
    ...row,
    date: formatChartDate(row.data_date as string),
  }));
}

// Get series with weights in legend
function getSeriesWithWeights(
  keys: string[],
  colors: string[],
  latestPesos: Record<string, unknown> | null
) {
  return keys.map((key, index) => {
    const weight = latestPesos?.[key] as number | null;
    const weightStr = weight !== null && weight !== undefined ? ` (${weight.toFixed(1)}%)` : "";
    return {
      key,
      name: `${key}${weightStr}`,
      color: colors[index],
    };
  });
}

export default function IpcaPage() {
  const momData = ipcaData.mom as Record<string, unknown>[];
  const a12Data = ipcaData.a12 as Record<string, unknown>[];
  const pesosData = ipcaData.pesos as Record<string, unknown>[];

  const latestMom = getDataByOffset(momData, 0);
  const previousMom = getDataByOffset(momData, -1);
  const latestA12 = getDataByOffset(a12Data, 0);
  const previousA12 = getDataByOffset(a12Data, -1);
  const latestPesos = getDataByOffset(pesosData, 0);

  const sameMonthLastYearMom = latestMom
    ? getSameMonthPreviousYear(momData, latestMom.data_date as string)
    : null;
  const sameMonthLastYearA12 = latestMom
    ? getSameMonthPreviousYear(a12Data, latestMom.data_date as string)
    : null;

  if (!latestMom || !previousMom || !latestA12) {
    return <div className="p-8 text-center">Carregando dados...</div>;
  }

  const formattedDate = formatDateLong(latestMom.data_date as string);
  const previousMonthDate = formatDateShort(previousMom.data_date as string);
  const sameMonthLastYearDate = sameMonthLastYearMom
    ? formatDateShort(sameMonthLastYearMom.data_date as string)
    : "—";

  // Calculate deltas
  const ipcaMomDelta = (latestMom.IPCA as number) - (previousMom.IPCA as number);
  const livresMomDelta = (latestMom.Livres as number) - (previousMom.Livres as number);
  const admMomDelta = (latestMom.Administrados as number) - (previousMom.Administrados as number);

  // YoY comparison
  const ipcaYoY = sameMonthLastYearA12
    ? (latestA12.IPCA as number) - (sameMonthLastYearA12.IPCA as number)
    : null;

  // Structured narrative data
  // Camada 1: Livres vs Administrados
  const livres = {
    mom: latestMom.Livres as number,
    a12: latestA12.Livres as number,
    delta: (latestMom.Livres as number) - (previousMom.Livres as number),
  };
  const administrados = {
    mom: latestMom.Administrados as number,
    a12: latestA12.Administrados as number,
    delta: (latestMom.Administrados as number) - (previousMom.Administrados as number),
  };
  const livresVsAdm = Math.abs(livres.mom) > Math.abs(administrados.mom)
    ? { maior: { name: "Livres", ...livres }, menor: { name: "Administrados", ...administrados } }
    : { maior: { name: "Administrados", ...administrados }, menor: { name: "Livres", ...livres } };

  // Camada 2: Dentro de Administrados
  const energiaEletrica = {
    mom: latestMom["Energia elétrica"] as number,
    a12: latestA12["Energia elétrica"] as number,
  };
  const combustiveis = {
    mom: latestMom.Combustíveis as number,
    a12: latestA12.Combustíveis as number,
  };

  // Camada 3: Dentro de Livres
  const alimentacao = {
    mom: latestMom["Alimentação no domicílio"] as number,
    a12: latestA12["Alimentação no domicílio"] as number,
  };
  const industrializados = {
    mom: latestMom.Industrializados as number,
    a12: latestA12.Industrializados as number,
  };

  // Outros destaques: itens fora das camadas principais
  const outrosItens = [
    { name: "Serviços", key: "Serviços" },
    { name: "Serviços Subjacentes", key: "Serviços subjacentes" },
    { name: "Ind. Subjacentes", key: "Ind Subjacente" },
    { name: "Duráveis", key: "Duráveis" },
    { name: "Semiduráveis", key: "Semiduráveis" },
    { name: "Não duráveis", key: "Não duráveis" },
    { name: "Tradables", key: "Tradables" },
    { name: "Non-tradables", key: "Non-tradables" },
  ].map((item) => ({
    ...item,
    mom: latestMom[item.key] as number,
    a12: latestA12[item.key] as number,
  }));

  // Top 2 por magnitude no MoM (fora os já citados)
  const outrosDestaqueMom = [...outrosItens]
    .sort((a, b) => Math.abs(b.mom) - Math.abs(a.mom))
    .slice(0, 2);

  // Top 2 por magnitude no A12 (fora os já citados)
  const outrosDestaqueA12 = [...outrosItens]
    .sort((a, b) => Math.abs(b.a12) - Math.abs(a.a12))
    .slice(0, 2);

  // Chart data
  const chartDataA12 = prepareChartData("a12", 2020);

  // Diffusion data (optional - may not be present if diffusion Excel is missing)
  const ipcaDataAny = ipcaData as Record<string, unknown>;
  const difusaoBrutaData = (ipcaDataAny.difusao_bruta as Record<string, unknown>[] | undefined)
    ?.filter((row) => {
      const rowDate = parseDate(row.data_date as string);
      return rowDate >= parseDate("2020-01-01");
    })
    .map((row) => ({
      date: formatChartDate(row.data_date as string),
      mensal: row.Difusao_Mensal as number | null,
      referencia: row.Media_Historica as number | null,
    })) || [];
  const difusaoDessazData = (ipcaDataAny.difusao_dessaz as Record<string, unknown>[] | undefined)
    ?.filter((row) => {
      const rowDate = parseDate(row.data_date as string);
      return rowDate >= parseDate("2020-01-01");
    })
    .map((row) => ({
      date: formatChartDate(row.data_date as string),
      mensal: row.Difusao_Mensal as number | null,
      referencia: row.Tendencia as number | null,
    })) || [];

  // Chart series
  const mainSeries = getSeriesWithWeights(
    ["IPCA", "Administrados", "Livres"],
    ["#0f172a", "#7c3aed", "#16a34a"],
    latestPesos
  );

  const componentsSeries = getSeriesWithWeights(
    ["Alimentação no domicílio", "Industrializados", "Serviços"],
    ["#ea580c", "#2563eb", "#dc2626"],
    latestPesos
  );

  const adminSeries = getSeriesWithWeights(
    ["Administrados", "Combustíveis", "Energia elétrica"],
    ["#7c3aed", "#059669", "#f59e0b"],
    latestPesos
  );

  const nucleosSeries = getSeriesWithWeights(
    ["IPCA", "Ex0", "Ex3"],
    ["#0f172a", "#0ea5e9", "#8b5cf6"],
    latestPesos
  );

  const durablesSeries = getSeriesWithWeights(
    ["Duráveis", "Semiduráveis", "Não duráveis", "Tradables", "Non-tradables"],
    ["#f97316", "#22c55e", "#ef4444", "#3b82f6", "#a855f7"],
    latestPesos
  );

  // Table indicators
  const keyIndicators = [
    { key: "IPCA", label: "IPCA (Índice Geral)" },
    { key: "Livres", label: "Preços Livres" },
    { key: "Administrados", label: "Preços Administrados" },
    { key: "Serviços", label: "Serviços" },
    { key: "Serviços subjacentes", label: "Serviços Subjacentes" },
    { key: "Industrializados", label: "Industrializados" },
    { key: "Ind Subjacente", label: "Industriais Subjacentes" },
    { key: "Alimentação no domicílio", label: "Alimentação no Domicílio" },
    { key: "Combustíveis", label: "Combustíveis" },
    { key: "Energia elétrica", label: "Energia Elétrica" },
    { key: "Ex0", label: "Núcleo EX0" },
    { key: "Ex3", label: "Núcleo EX3" },
  ];

  // Prepare table data
  const tableData = keyIndicators.map((ind) => ({
    componente: ind.label,
    peso: latestPesos?.[ind.key] as number | null,
    mom: latestMom[ind.key] as number | null,
    momAnterior: previousMom[ind.key] as number | null,
    delta:
      latestMom[ind.key] !== null && previousMom[ind.key] !== null
        ? (latestMom[ind.key] as number) - (previousMom[ind.key] as number)
        : null,
    a12: latestA12[ind.key] as number | null,
    a12Anterior: sameMonthLastYearA12?.[ind.key] as number | null,
  }));

  // Prepare heatmap data (last 12 months with 24 months for average calculation)
  const prepareHeatmapData = (rawData: Record<string, unknown>[]) => {
    const last24 = rawData.slice(-24);
    const last12 = last24.slice(-12);
    return last12.map((row) => ({
      date: row.data_date as string,
      formattedDate: formatDateShort(row.data_date as string),
      values: keyIndicators.reduce((acc, ind) => {
        acc[ind.key] = row[ind.key] as number | null;
        return acc;
      }, {} as Record<string, number | null>),
    }));
  };

  const heatmapMomData = prepareHeatmapData(momData);
  const heatmapA12Data = prepareHeatmapData(a12Data);

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
          / <span className="text-gray-900 dark:text-white font-semibold">IPCA</span>
        </div>

        {/* Header */}
        <section className="mb-8 rounded-3xl px-8 py-8 shadow-xl relative overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
              <span>Macro Brasil</span>
              <span>•</span>
              <span>Inflação</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              IPCA de <span className="capitalize">{formattedDate}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-700 dark:text-gray-300">
              Índice Nacional de Preços ao Consumidor Amplo — inflação oficial do Brasil, medida
              pelo IBGE com coleta do dia 1 ao último dia do mês.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Atualizado em {ipcaData.metadata.last_updated}
            </p>
          </div>
        </section>

        {/* Flash Report Banner */}
        <FlashReportBanner indicator="IPCA" />

        {/* Sumário Executivo - Texto Corrido */}
        <section className="mb-8 rounded-2xl border-0 dark:border dark:border-blue-900 border-l-4 border-l-blue-600 dark:border-l-blue-500 bg-white dark:bg-gray-800 p-6 shadow-sm text-gray-900 dark:text-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-3">Sumário Executivo</h2>
          <p className="leading-relaxed text-justify">
            O <strong>IPCA</strong> de <span className="capitalize">{formattedDate}</span>{" "}
            {(latestMom.IPCA as number) >= 0 ? "registrou alta" : "apresentou queda"} de{" "}
            <strong className="text-blue-700 dark:text-blue-400">{Math.abs(latestMom.IPCA as number).toFixed(2)}%</strong>{" "}
            {ipcaMomDelta !== 0 && (
              <>({ipcaMomDelta > 0 ? "aceleração" : "desaceleração"} de {Math.abs(ipcaMomDelta).toFixed(2)} p.p. frente aos {(previousMom.IPCA as number).toFixed(2)}% de {previousMonthDate})</>
            )}, acumulando{" "}
            <strong className="text-blue-700 dark:text-blue-400">{(latestA12.IPCA as number).toFixed(2)}%</strong> em 12 meses
            {ipcaYoY !== null && (
              <> ({ipcaYoY > 0 ? "+" : ""}{ipcaYoY.toFixed(2)} p.p. vs mesmo mês do ano anterior)</>
            )}. Na composição, os <strong>preços {livresVsAdm.maior.name === "Livres" ? "livres" : "administrados"}</strong>{" "}
            {livresVsAdm.maior.mom >= 0 ? "avançaram" : "recuaram"} {Math.abs(livresVsAdm.maior.mom).toFixed(2)}%{" "}
            ({livresVsAdm.maior.delta > 0 ? "+" : ""}{livresVsAdm.maior.delta.toFixed(2)} p.p.), acumulando {livresVsAdm.maior.a12.toFixed(2)}% em 12 meses, enquanto os{" "}
            <strong>preços {livresVsAdm.menor.name === "Livres" ? "livres" : "administrados"}</strong>{" "}
            {livresVsAdm.menor.mom >= 0 ? "subiram" : "caíram"} {Math.abs(livresVsAdm.menor.mom).toFixed(2)}%{" "}
            ({livresVsAdm.menor.a12.toFixed(2)}% em 12m). Dentro dos <strong>Administrados</strong>, a{" "}
            <strong>energia elétrica</strong> {energiaEletrica.mom >= 0 ? "avançou" : "recuou"} {Math.abs(energiaEletrica.mom).toFixed(2)}%{" "}
            ({energiaEletrica.a12.toFixed(2)}% em 12m) e os <strong>combustíveis</strong>{" "}
            {combustiveis.mom >= 0 ? "subiram" : "caíram"} {Math.abs(combustiveis.mom).toFixed(2)}%{" "}
            ({combustiveis.a12.toFixed(2)}% em 12m). Nos <strong>Livres</strong>, a{" "}
            <strong>alimentação no domicílio</strong> {alimentacao.mom >= 0 ? "subiu" : "caiu"}{" "}
            {Math.abs(alimentacao.mom).toFixed(2)}% ({alimentacao.a12.toFixed(2)}% em 12m), enquanto os{" "}
            <strong>industrializados</strong> {industrializados.mom >= 0 ? "avançaram" : "recuaram"}{" "}
            {Math.abs(industrializados.mom).toFixed(2)}% ({industrializados.a12.toFixed(2)}% em 12m). Os{" "}
            <strong>serviços</strong> {(latestMom.Serviços as number) >= 0 ? "registraram alta" : "apresentaram queda"} de{" "}
            {Math.abs(latestMom.Serviços as number).toFixed(2)}% no mês ({(latestA12.Serviços as number).toFixed(2)}% em 12m), com{" "}
            <strong>serviços subjacentes</strong> em {(latestMom["Serviços subjacentes"] as number).toFixed(2)}%{" "}
            ({(latestA12["Serviços subjacentes"] as number).toFixed(2)}% em 12m). Os <strong>núcleos de inflação</strong>{" "}
            apresentaram EX0 em {(latestMom.Ex0 as number).toFixed(2)}% ({(latestA12.Ex0 as number).toFixed(2)}% em 12m) e{" "}
            EX3 em {(latestMom.Ex3 as number).toFixed(2)}% ({(latestA12.Ex3 as number).toFixed(2)}% em 12m), sinalizando{" "}
            {(latestA12.Ex0 as number) > 4.5 || (latestA12.Ex3 as number) > 4.5
              ? "pressão inflacionária subjacente acima da meta"
              : (latestA12.Ex0 as number) < 3.0 && (latestA12.Ex3 as number) < 3.0
                ? "inflação subjacente controlada"
                : "dinâmica inflacionária dentro do esperado"
            }.
          </p>
        </section>

        {/* Heatmap Tables - MoM and A12 */}
        <section className="mb-8 space-y-6">
          <HeatmapTable
            data={heatmapMomData}
            indicators={keyIndicators}
            title="Variação Mensal (MoM) — Últimos 12 meses"
          />
          <HeatmapTable
            data={heatmapA12Data}
            indicators={keyIndicators}
            title="Acumulado 12 Meses (A12) — Últimos 12 meses"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 px-1">
            Valores em % | Cores indicam desvio em relação à média dos últimos 24 meses: tons quentes = acima da média, tons frios = abaixo da média
          </p>
        </section>

        {/* Charts Row 1 - 3 columns */}
        <section className="mb-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <InflationChart
              data={chartDataA12}
              series={mainSeries}
              title="IPCA, Livres e Administrados — A12 (%)"
            />
            <InflationChart
              data={chartDataA12}
              series={componentsSeries}
              title="Alimentação, Industriais e Serviços — A12 (%)"
            />
            <InflationChart
              data={chartDataA12}
              series={adminSeries}
              title="Administrados e Componentes — A12 (%)"
              yDomain={[-30, 90]}
            />
          </div>
        </section>

        {/* Charts Row 2 - 2 columns */}
        <section className="mb-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <InflationChart
              data={chartDataA12}
              series={nucleosSeries}
              title="Núcleos de Inflação — A12 (%)"
            />
            <InflationChart
              data={chartDataA12}
              series={durablesSeries}
              title="Duráveis e Tradables — A12 (%)"
            />
          </div>
        </section>

        {/* Diffusion Charts - 2 columns */}
        {difusaoBrutaData.length > 0 && (
          <section className="mb-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-4 dark:text-gray-200">
              Difusão
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <DiffusionChart
                data={difusaoBrutaData}
                title="Difusão — % de itens com alta"
                barLabel="Difusão Mensal"
                lineLabel="Média Histórica"
                barColor="#3b82f6"
                lineColor="#ef4444"
              />
              <DiffusionChart
                data={difusaoDessazData}
                title="Difusão Dessazonalizada — % de itens com alta"
                barLabel="Difusão Mensal (SA)"
                lineLabel="Tendência (MM3)"
                barColor="#8b5cf6"
                lineColor="#f59e0b"
              />
            </div>
          </section>
        )}

        {/* Footer Note */}
        <section className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="font-semibold text-gray-900 dark:text-white">Fonte:</strong> IBGE/Sidra. Dados processados automaticamente.
          <br />
          <strong className="font-semibold text-gray-900 dark:text-white">Metodologia:</strong> Núcleos calculados com ponderação pelos pesos do IPCA.
        </section>
      </div>
    </main>
  );
}

