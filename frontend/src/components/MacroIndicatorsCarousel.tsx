"use client";

import { useState } from "react";

type MacroIndicator = {
  country: string;
  label: string;
  value: string;
  period: string;
  note?: string;
};

interface MacroIndicatorsCarouselProps {
  brValue?: string | null;
  brPeriod?: string | null;
}

export function MacroIndicatorsCarousel({
  brValue,
  brPeriod,
}: MacroIndicatorsCarouselProps) {
  const indicators: MacroIndicator[] = [
    {
      country: "Brasil",
      label: "IPCA (inflação mensal)",
      value: `${brValue ?? "0,56"}%`,
      period: brPeriod ?? "outubro 2025",
      note: "Inflação cheia, foco do Banco Central do Brasil.",
    },
    {
      country: "Estados Unidos",
      label: "CPI anual",
      value: "2,4%",
      period: "outubro 2025",
      note: "Inflação ao consumidor, referência para a política do Fed.",
    },
    {
      country: "Zona do Euro",
      label: "HICP anual",
      value: "2,1%",
      period: "outubro 2025",
      note: "Índice harmonizado de preços ao consumidor.",
    },
    {
      country: "China",
      label: "Crescimento do PIB (12 meses)",
      value: "4,8%",
      period: "3T 2025",
      note: "Variação real do PIB na comparação anual.",
    },
  ];

  const [index, setIndex] = useState(0);
  const total = indicators.length;
  const current = indicators[index];

  const goPrev = () => {
    setIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const goNext = () => {
    setIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-200">
          Indicador
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
          {current.country}
        </p>
        <p className="text-sm text-gray-600 dark:text-slate-300">{current.label}</p>
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-gray-900 dark:text-white">{current.value}</p>
        <p className="text-sm text-gray-400 dark:text-slate-300">({current.period})</p>
      </div>

      {current.note && (
        <p className="text-xs leading-relaxed text-gray-500 dark:text-slate-300">
          {current.note}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {index + 1} de {total}
        </span>
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-600 shadow-sm hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-blue-200"
            aria-label="Indicador anterior"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-600 shadow-sm hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-blue-200"
            aria-label="Próximo indicador"
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}


