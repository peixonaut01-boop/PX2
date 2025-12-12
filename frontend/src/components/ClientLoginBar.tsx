"use client";

import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export function ClientLoginBar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`w-full border-b ${
        isDark ? "border-slate-800 bg-slate-900 text-white" : "border-gray-200 bg-white text-gray-900"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 text-sm md:flex-row md:items-center md:justify-between">
        <div className="font-semibold tracking-tight">
          Área do Cliente
          <span
            className={`ml-2 text-xs font-normal ${
              isDark ? "text-slate-200" : "text-gray-500"
            }`}
          >
            Acesse seus relatórios e conteúdos exclusivos.
          </span>
        </div>

        <Link
          href="/cliente"
          className={`inline-flex items-center justify-center rounded-md px-4 py-1.5 text-xs font-semibold shadow-sm transition ${
            isDark
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Entrar / Cadastrar
        </Link>
      </div>
    </div>
  );
}


