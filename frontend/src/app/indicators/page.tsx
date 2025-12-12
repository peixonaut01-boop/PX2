import Link from "next/link";

export default function IndicatorsPage() {
  const indicators = [
    {
      name: "IPCA",
      description: "Índice Nacional de Preços ao Consumidor Amplo",
      subtitle: "Inflação oficial do Brasil, medida pelo IBGE",
      href: "/indicators/ipca",
      status: "live" as const,
      frequency: "Mensal",
    },
    {
      name: "IPCA-15",
      description: "Prévia da Inflação",
      subtitle: "Prévia do IPCA com coleta até o dia 15 do mês",
      href: "/indicators/ipca15",
      status: "live" as const,
      frequency: "Quinzenal",
    },
    {
      name: "PIB",
      description: "Produto Interno Bruto",
      subtitle: "Atividade econômica agregada do país",
      href: "#",
      status: "soon" as const,
      frequency: "Trimestral",
    },
    {
      name: "Selic",
      description: "Taxa Básica de Juros",
      subtitle: "Taxa definida pelo Copom/BCB",
      href: "#",
      status: "soon" as const,
      frequency: "A cada 45 dias",
    },
    {
      name: "Desemprego",
      description: "PNAD Contínua",
      subtitle: "Taxa de desocupação no Brasil",
      href: "#",
      status: "soon" as const,
      frequency: "Mensal",
    },
    {
      name: "PIM (Indústria)",
      description: "Produção Industrial",
      subtitle: "Indicadores da indústria geral e transformação",
      href: "/indicators/pim",
      status: "live" as const,
      frequency: "Mensal",
    },
    {
      name: "PMC (Varejo)",
      description: "Pesquisa Mensal de Comércio",
      subtitle: "Vendas no varejo ampliado e restrito",
      href: "/indicators/pmc",
      status: "live" as const,
      frequency: "Mensal",
    },
    {
      name: "PMS (Serviços)",
      description: "Pesquisa Mensal de Serviços",
      subtitle: "Volume de serviços no Brasil",
      href: "/indicators/pms",
      status: "live" as const,
      frequency: "Mensal",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Início
          </Link>{" "}
          / <span className="text-gray-700 font-medium">Brasil</span>
        </div>

        {/* Header */}
        <section className="mb-8 rounded-3xl bg-gray-900 px-8 py-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-indigo-500/30 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span className="flex items-center gap-1">
                🇧🇷 Brasil
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Indicadores Macroeconômicos
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-300">
              Acompanhe os principais indicadores da economia brasileira com visualizações
              atualizadas automaticamente.
            </p>
          </div>
        </section>

        {/* Indicators Grid */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Indicadores Disponíveis
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((indicator) =>
              indicator.status === "live" ? (
                <Link
                  key={indicator.name}
                  href={indicator.href}
                  className="block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{indicator.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Live
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">{indicator.description}</p>
                  <p className="text-sm text-gray-500 mt-1">{indicator.subtitle}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Frequência: {indicator.frequency}</span>
                  </div>
                </Link>
              ) : (
                <div
                  key={indicator.name}
                  className="block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm opacity-60"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{indicator.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Em breve
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">{indicator.description}</p>
                  <p className="text-sm text-gray-500 mt-1">{indicator.subtitle}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Frequência: {indicator.frequency}</span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* Coming Soon Note */}
        <section className="mt-8 p-4 bg-gray-100 rounded-xl text-sm text-gray-600">
          <strong>Em desenvolvimento:</strong> Novos indicadores serão adicionados em breve,
          incluindo PIB, Selic, desemprego, produção industrial e mais.
        </section>
      </div>
    </main>
  );
}

