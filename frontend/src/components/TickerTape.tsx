 "use client";

import { TickerQuote } from "@/lib/market";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

const TickerItem = ({ quote }: { quote: TickerQuote }) => {
  const pct = quote.regularMarketChangePercent ?? 0;
  const isPositive = pct >= 0;
  
  // Determina o símbolo da moeda
  const currencySymbol = quote.currency === "BRL" ? "R$" : "$";
  
  return (
    <div className="inline-flex items-center space-x-2 px-8">
      <span className="font-bold text-gray-900 dark:text-slate-100">{quote.symbol}</span>
      <span className="text-gray-800 dark:text-slate-300">
        {currencySymbol} {quote.regularMarketPrice.toFixed(2)}
      </span>
      <span
        className={`font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
      >
        {isPositive ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
      </span>
    </div>
  );
};

export const TickerTape = ({ quotes }: { quotes: TickerQuote[] }) => {
  // Se não houver cotações, não renderiza nada
  if (!quotes || quotes.length === 0) return null;

  // Duplicamos a lista várias vezes para garantir que o scroll preencha telas largas sem buracos
  // 4x é seguro para garantir um loop visualmente infinito
  const extendedQuotes = [...quotes, ...quotes, ...quotes, ...quotes];

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bgBase = isDark ? "bg-slate-900" : "bg-white";
  const gradFrom = isDark ? "from-slate-900" : "from-white";
  const gradVia = isDark ? "via-slate-900/70" : "via-white/70";

  return (
    <div className={`w-full ${bgBase} overflow-hidden h-12 flex items-center relative shadow-sm`}>
      {/* Máscaras de gradiente nas pontas para dar efeito de "fade" suave */}
      <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r ${gradFrom} ${gradVia} to-transparent z-10`} />
      <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l ${gradFrom} ${gradVia} to-transparent z-10`} />

      {/* Container da animação */}
      <div className="animate-scroll flex whitespace-nowrap hover:pause">
        {extendedQuotes.map((quote, index) => (
          <TickerItem key={`${quote.symbol}-${index}`} quote={quote} />
        ))}
      </div>
    </div>
  );
};
