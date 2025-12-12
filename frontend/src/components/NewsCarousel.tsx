"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { IbgeNewsItem } from "@/lib/ibge";
import { NewsCard } from "./NewsCard";

export function NewsCarousel({ articles }: { articles: IbgeNewsItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative group h-full">
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full items-stretch touch-pan-y">
          {articles.map((article, index) => (
            <div
              // Usando index na chave para garantir unicidade absoluta
              key={`${article.link}-${index}`}
              className="relative flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-4 min-w-0"
            >
              <NewsCard article={article} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Botões de navegação melhorados (aparecem no hover) */}
      <button
        className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border-0 dark:border dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-300 z-10"
        onClick={scrollPrev}
        aria-label="Anterior"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border-0 dark:border dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-300 z-10"
        onClick={scrollNext}
        aria-label="Próximo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  );
}
