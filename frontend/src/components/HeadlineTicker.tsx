import Link from "next/link";

const headlines = [
  {
    slug: "primeiro-artigo",
    title: "Política monetária: riscos inflacionários e o custo da cautela",
  },
  {
    slug: "segundo-artigo",
    title: "Investimentos em renováveis aceleram, mas gargalos persistem",
  },
  {
    slug: "terceiro-artigo",
    title: "Tecnologia e produtividade: evidências dos últimos trimestres",
  },
  {
    slug: "primeiro-artigo",
    title: "Expectativas de mercado versus modelos estruturais",
  },
];

export default function HeadlineTicker() {
  const loopingHeadlines = [...headlines, ...headlines];

  return (
    <div className="bg-gray-100 text-gray-900 border-b border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-800 overflow-hidden">
      <div className="container mx-auto flex items-center">
        <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase">
          <span>Últimas</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-track flex-none flex items-center gap-10 whitespace-nowrap">
            {loopingHeadlines.map((headline, index) => (
              <Link
                key={`${headline.slug}-${index}`}
                href={`/articles/${headline.slug}`}
                className="text-sm md:text-base text-gray-800 hover:text-gray-900 dark:text-white/80 dark:hover:text-white transition-colors"
              >
                {headline.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

