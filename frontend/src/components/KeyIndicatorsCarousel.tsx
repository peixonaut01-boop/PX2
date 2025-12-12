"use client";

import { useState } from "react";

type Country = "Brasil" | "Estados Unidos" | "Zona do Euro";

type IndicatorSlide = {
  id: string;
  title: string;
  description: string;
  metricLabel: string;
  rows: {
    country: Country;
    value: string;
    period: string;
  }[];
};

interface KeyIndicatorsCarouselProps {
  brInflation?: string | null;
  brInflationPeriod?: string | null;
}

export function KeyIndicatorsCarousel({
  brInflation,
  brInflationPeriod,
}: KeyIndicatorsCarouselProps) {
  const slides: IndicatorSlide[] = [
    {
      id: "cpi",
      title: "Inflação ao consumidor (CPI/HICP)",
      description:
        "Inflação corrente nas principais economias, referência para política monetária.",
      metricLabel: "Inflação anual (acumulado em 12 meses)",
      rows: [
        {
          country: "Brasil",
          value: brInflation ? `${brInflation}%` : "4,2%",
          period:
            brInflationPeriod ?? "IPCA acumulado em 12 meses até out/2025",
        },
        {
          country: "Estados Unidos",
          value: "2,4%",
          period: "12 meses até out/2025 (CPI)",
        },
        {
          country: "Zona do Euro",
          value: "2,1%",
          period: "12 meses até out/2025 (HICP)",
        },
      ],
    },
    {
      id: "rates",
      title: "Taxa básica de juros (policy rate)",
      description:
        "Nível da taxa de juros de curto prazo definida pelos bancos centrais.",
      metricLabel: "Taxa de juros nominal (overnight)",
      rows: [
        {
          country: "Brasil",
          value: "10,75%",
          period: "Meta Selic — após última reunião do Copom",
        },
        {
          country: "Estados Unidos",
          value: "5,25–5,50%",
          period: "Intervalo-alvo Fed Funds",
        },
        {
          country: "Zona do Euro",
          value: "4,00%",
          period: "Taxa de depósito do BCE",
        },
      ],
    },
    {
      id: "gdp",
      title: "PIB real — variação em 12 meses",
      description:
        "Ritmo de crescimento das economias, importante para lucros, emprego e crédito.",
      metricLabel: "PIB real (a/a)",
      rows: [
        {
          country: "Brasil",
          value: "2,3%",
          period: "3T 2025 vs 3T 2024",
        },
        {
          country: "Estados Unidos",
          value: "2,0%",
          period: "3T 2025 vs 3T 2024",
        },
        {
          country: "Zona do Euro",
          value: "1,1%",
          period: "3T 2025 vs 3T 2024",
        },
      ],
    },
    {
      id: "next",
      title: "Próximas divulgações importantes",
      description:
        "Datas indicativas (mock) de eventos macro relevantes para a semana corrente.",
      metricLabel: "Próxima divulgação",
      rows: [
        {
          country: "Brasil",
          value: "IPCA-15",
          period: "Próx. quarta-feira",
        },
        {
          country: "Estados Unidos",
          value: "Payroll",
          period: "Próx. sexta-feira",
        },
        {
          country: "Zona do Euro",
          value: "CPI preliminar",
          period: "Próx. terça-feira",
        },
      ],
    },
  ];

  const [index, setIndex] = useState(0);
  const total = slides.length;
  const slide = slides[index];

  const goPrev = () => setIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  const goNext = () => setIndex((prev) => (prev === total - 1 ? 0 : prev + 1));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 rounded-2xl p-3 border border-transparent">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200">
            Indicadores chave globais
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {slide.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-700 dark:text-slate-200">
            {slide.description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-200">
          <span>
            {index + 1} de {total}
          </span>
          <button
            type="button"
            onClick={goPrev}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-blue-200"
            aria-label="Slide anterior"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-blue-200"
            aria-label="Próximo slide"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {slide.rows.map((row) => (
          <div
            key={row.country}
            className="rounded-2xl border-0 dark:border dark:border-slate-700 bg-white p-4 shadow-sm dark:bg-slate-800/80"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-200">
              {row.country}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {slide.metricLabel}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {row.value}
              </p>
              <p className="text-xs text-gray-700 dark:text-slate-200">({row.period})</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


