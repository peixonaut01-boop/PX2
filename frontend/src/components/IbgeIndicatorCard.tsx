import React from "react";

interface IbgeIndicatorCardProps {
  title: string;
  value: string | null;
  period: string | null;
}

export function IbgeIndicatorCard({
  title,
  value,
  period,
}: IbgeIndicatorCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        {value ? (
          <>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}%</p>
            <p className="text-sm text-gray-700 dark:text-slate-300">({period})</p>
          </>
        ) : (
          <p className="text-gray-700 dark:text-slate-300">Carregando dados...</p>
        )}
      </div>
    </div>
  );
}
