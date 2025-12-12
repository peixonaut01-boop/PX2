interface GlobalIndicatorsRowProps {
  brValue: string;
  brPeriod: string;
}

export function GlobalIndicatorsRow({
  brValue,
  brPeriod,
}: GlobalIndicatorsRowProps) {
  const items = [
    {
      country: "Brasil",
      indicator: "IPCA (inflação mensal)",
      value: `${brValue}%`,
      period: brPeriod,
    },
    {
      country: "Estados Unidos",
      indicator: "CPI anual",
      value: "2,4%",
      period: "outubro 2025",
    },
    {
      country: "Zona do Euro",
      indicator: "HICP anual",
      value: "2,1%",
      period: "outubro 2025",
    },
  ];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-400">
        Indicadores chave globais — comparação entre países
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.country}
            className="rounded-2xl border-0 dark:border dark:border-slate-700 bg-slate-50 p-4 shadow-sm dark:bg-slate-800/80"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-400">
              {item.country}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {item.indicator}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {item.value}
              </p>
              <p className="text-xs text-gray-700 dark:text-slate-400">({item.period})</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


