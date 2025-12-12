import Link from "next/link";
import { getLatestIPCA, getIbgeNews } from "@/lib/ibge";
import { getTickerQuotes, getBrazilQuotes } from "@/lib/market";
import { getAllPosts } from "@/lib/content"; // Importa a função que lê suas notícias
import { NewsCarousel } from "@/components/NewsCarousel";
import { TickerTape } from "@/components/TickerTape";
import { FeaturedNews } from "@/components/FeaturedNews"; // Importa o novo componente visual
import { ClientLoginBar } from "@/components/ClientLoginBar";
import { KeyIndicatorsCarousel } from "@/components/KeyIndicatorsCarousel";

export default async function Home() {
  const ipca = await getLatestIPCA();
  const news = await getIbgeNews(6);
  // Tickers globais (Tiingo) + tickers BR (IbovFinancials)
  const usQuotes = await getTickerQuotes([
    "AAPL",
    "MSFT",
    "TSLA",
    "SPY",
    "QQQ",
    "PLTR",
    "MSTR",
  ]);
  // Tickers B3 (IbovFinancials): PETR4, VALE3 e Banco do Brasil (BBAS3)
  const brQuotes = await getBrazilQuotes(["PETR4", "VALE3", "BBAS3"]);
  const quotes = [...brQuotes, ...usQuotes];
  const cmsPosts = getAllPosts(); // Busca suas notícias do CMS

  const agendaSemanal = [
    {
      time: "Seg",
      title: "EUA - ISM manufatura",
      detail: "Sinaliza ritmo da indústria e apetite a risco global.",
    },
    {
      time: "Ter",
      title: "Brasil - IPCA-15",
      detail: "Prévia de inflação que costuma mexer na curva de juros.",
    },
    {
      time: "Qua",
      title: "Zona do Euro - CPI",
      detail: "Inflacao europeia, importante para o ECB e o euro.",
    },
    {
      time: "Qui",
      title: "EUA - Pedido de seguro-desemprego",
      detail: "Termômetro de mercado de trabalho americano.",
    },
    {
      time: "Sex",
      title: "China - dados de atividade",
      detail: "Produção industrial e vendas no varejo na China.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Login da Área do Cliente no topo */}
      <ClientLoginBar />

      <div className="w-full px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col space-y-8">
          {/* Hero Section - FIXED COLORS */}
          <section className="relative overflow-hidden rounded-3xl px-8 py-16 shadow-xl bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="relative z-10 max-w-3xl">
              <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                <span className="text-gray-900 dark:text-white">
                  PX Economics:
                </span>{" "}
                <span className="text-blue-700 dark:text-blue-400">
                  auxílio estratégico em decisões econômicas
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-gray-800 md:text-xl dark:text-gray-200">
                Análises baseadas em evidências para apoiar decisões de investidores, empresas e formuladores de políticas.
              </p>
            </div>
          </section>

          {/* Ticker Tape Section */}
          <div className="overflow-hidden rounded-xl border-0 dark:border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <TickerTape quotes={quotes} />
          </div>

          {/* Featured News (SEU CONTEÚDO DO CMS) */}
          {cmsPosts.length > 0 && <FeaturedNews posts={cmsPosts} />}

          {/* Indicadores globais em carrossel (full width) */}
          <section className="space-y-3 rounded-2xl border-0 dark:border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <KeyIndicatorsCarousel
              brInflation={ipca?.value || "0.56"}
              brInflationPeriod={ipca?.period || "outubro 2025"}
            />
            <div className="text-right text-xs text-gray-600 dark:text-gray-400">
              <Link
                href="/indicators/ipca15"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
              >
                Ver página dedicada do IPCA-15 &rarr;
              </Link>
            </div>
          </section>

          {/* Main Content Grid: IBGE + agenda semanal, mesma altura */}
          <section className="grid items-stretch gap-6 lg:grid-cols-[2fr_1fr]">
            {/* News Section (IBGE) */}
            <div className="h-full">
              {news && news.length > 0 ? (
                <NewsCarousel articles={news} />
              ) : (
                <div className="p-8 text-center text-gray-700 dark:text-gray-400">
                  Carregando notícias...
                </div>
              )}
            </div>

            {/* Sidebar: agenda econômica semanal, mesma altura do bloco do IBGE */}
            <aside className="h-full rounded-2xl border-0 dark:border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="space-y-4">
                {agendaSemanal.map((item, index) => (
                  <div key={index} className="group flex gap-4">
                    <div className="w-12 pt-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                      {item.time}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
