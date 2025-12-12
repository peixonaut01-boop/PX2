"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";

// Força renderização apenas no cliente (evita pré-render durante build)
export const dynamic = 'force-dynamic';

// Senha admin
const ADMIN_PASSWORD = '@pxadmin2025';

interface Projecao {
  mom?: number | null;
  a12?: number | null;
  valor?: number | null;
}

interface ProjecoesData {
  metadata: {
    last_updated: string;
    updated_by: string;
  };
  indicadores: Record<string, {
    nome: string;
    unidade: string;
    categoria: string;
    tipo: string;
  }>;
  projecoes_px: Record<string, Record<string, Projecao>>;
  projecoes_mercado: Record<string, Record<string, Projecao>>;
  projecoes_anuais_px: Record<string, Record<string, number | null>>;
  projecoes_anuais_mercado: Record<string, Record<string, number | null>>;
}

// Generate months for the next 12 months
function generateMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// Format month for display
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${monthNames[parseInt(month) - 1]}/${year.slice(-2)}`;
}

// Indicadores MoM (variação mensal) - organizados por país
const INDICADORES_MOM = [
  // 🇧🇷 BRASIL
  { key: "IPCA", section: "🇧🇷 Brasil" },
  { key: "IPCA15", section: "🇧🇷 Brasil" },
  { key: "IPCA_ADM", section: "🇧🇷 Brasil" },
  { key: "INPC", section: "🇧🇷 Brasil" },
  { key: "IGP_M", section: "🇧🇷 Brasil" },
  { key: "IBC_BR", section: "🇧🇷 Brasil" },
  { key: "PIM", section: "🇧🇷 Brasil" },
  { key: "PMC", section: "🇧🇷 Brasil" },
  { key: "PMS", section: "🇧🇷 Brasil" },
  { key: "CAGED", section: "🇧🇷 Brasil" },
  { key: "DESEMPREGO_BR", section: "🇧🇷 Brasil" },
  { key: "PO", section: "🇧🇷 Brasil" },
  { key: "RESULTADO_PRIMARIO", section: "🇧🇷 Brasil" },
  { key: "RESULTADO_PRIMARIO_SUB", section: "🇧🇷 Brasil" },
  { key: "RESULTADO_NOMINAL", section: "🇧🇷 Brasil" },
  { key: "ARRECADACAO", section: "🇧🇷 Brasil" },
  { key: "ARRECADACAO_ICMS", section: "🇧🇷 Brasil" },
  { key: "DESPESA_GOV", section: "🇧🇷 Brasil" },
  { key: "BALANCA_COMERCIAL", section: "🇧🇷 Brasil" },
  { key: "CONTA_CORRENTE", section: "🇧🇷 Brasil" },
  { key: "IDP", section: "🇧🇷 Brasil" },
  { key: "CAMBIO", section: "🇧🇷 Brasil" },
  { key: "SELIC", section: "🇧🇷 Brasil" },
  // 🇺🇸 EUA
  { key: "CPI_EUA", section: "🇺🇸 EUA" },
  { key: "CORE_CPI_EUA", section: "🇺🇸 EUA" },
  { key: "PCE_EUA", section: "🇺🇸 EUA" },
  { key: "PAYROLL_EUA", section: "🇺🇸 EUA" },
  { key: "DESEMPREGO_EUA", section: "🇺🇸 EUA" },
  { key: "PIM_EUA", section: "🇺🇸 EUA" },
  { key: "FED_FUNDS", section: "🇺🇸 EUA" },
  // 🇪🇺 Europa
  { key: "CPI_EUR", section: "🇪🇺 Europa" },
  { key: "CORE_CPI_EUR", section: "🇪🇺 Europa" },
  { key: "DESEMPREGO_EUR", section: "🇪🇺 Europa" },
  { key: "PIM_EUR", section: "🇪🇺 Europa" },
  { key: "ECB_RATE", section: "🇪🇺 Europa" },
  // 🇬🇧 Reino Unido
  { key: "BOE_RATE", section: "🇬🇧 Reino Unido" },
  // 🇯🇵 Japão
  { key: "BOJ_RATE", section: "🇯🇵 Japão" },
];

// Indicadores A12 (acumulado 12 meses) - organizados por país
const INDICADORES_A12 = [
  // 🇧🇷 BRASIL
  { key: "IPCA", section: "🇧🇷 Brasil" },
  { key: "IPCA15", section: "🇧🇷 Brasil" },
  { key: "IPCA_ADM", section: "🇧🇷 Brasil" },
  { key: "INPC", section: "🇧🇷 Brasil" },
  { key: "IGP_M", section: "🇧🇷 Brasil" },
  { key: "DIVIDA_LIQUIDA", section: "🇧🇷 Brasil" },
  { key: "DIVIDA_BRUTA", section: "🇧🇷 Brasil" },
  { key: "SELIC", section: "🇧🇷 Brasil" },
  // 🇺🇸 EUA
  { key: "CPI_EUA", section: "🇺🇸 EUA" },
  { key: "CORE_CPI_EUA", section: "🇺🇸 EUA" },
  { key: "FED_FUNDS", section: "🇺🇸 EUA" },
  // 🇪🇺 Europa
  { key: "CPI_EUR", section: "🇪🇺 Europa" },
  { key: "CORE_CPI_EUR", section: "🇪🇺 Europa" },
  { key: "ECB_RATE", section: "🇪🇺 Europa" },
];

// Indicadores Anuais - organizados por país
const INDICADORES_ANUAIS = [
  // 🇧🇷 BRASIL
  { key: "IPCA", section: "🇧🇷 Brasil" },
  { key: "PIB", section: "🇧🇷 Brasil" },
  { key: "SELIC", section: "🇧🇷 Brasil" },
  { key: "CAMBIO", section: "🇧🇷 Brasil" },
  { key: "RESULTADO_PRIMARIO", section: "🇧🇷 Brasil" },
  { key: "DIVIDA_BRUTA", section: "🇧🇷 Brasil" },
  // 🇺🇸 EUA
  { key: "CPI_EUA", section: "🇺🇸 EUA" },
  { key: "FED_FUNDS", section: "🇺🇸 EUA" },
  // 🇪🇺 Europa
  { key: "CPI_EUR", section: "🇪🇺 Europa" },
  { key: "ECB_RATE", section: "🇪🇺 Europa" },
];

export default function ProjecoesPage() {
  const [data, setData] = useState<ProjecoesData | null>(null);
  const [activeTab, setActiveTab] = useState<"px" | "mercado">("px");
  const [activeView, setActiveView] = useState<"mom" | "a12" | "anual">("mom");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Admin auth state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const months = generateMonths();
  const years = ["2025", "2026", "2027", "2028", "2029", "2030"];

  // Check saved auth
  useEffect(() => {
    const savedAuth = localStorage.getItem('px_admin_auth');
    if (savedAuth === 'true') {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      localStorage.setItem('px_admin_auth', 'true');
    } else {
      setAuthError('Senha incorreta');
    }
  };

  useEffect(() => {
    fetch("/data/projecoes.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Erro ao carregar projeções:", err));
  }, []);

  const handleInputChange = (
    periodo: string,
    indicador: string,
    field: string,
    value: string,
    isAnual: boolean = false
  ) => {
    if (!data) return;

    const numValue = value === "" ? null : parseFloat(value);
    const newData = { ...data };

    if (isAnual) {
      const target = activeTab === "px" ? "projecoes_anuais_px" : "projecoes_anuais_mercado";
      if (!newData[target][periodo]) {
        newData[target][periodo] = {};
      }
      newData[target][periodo][indicador] = numValue;
    } else {
      const target = activeTab === "px" ? "projecoes_px" : "projecoes_mercado";
      if (!newData[target][periodo]) {
        newData[target][periodo] = {};
      }
      if (!newData[target][periodo][indicador]) {
        newData[target][periodo][indicador] = {};
      }
      (newData[target][periodo][indicador] as Projecao)[field as keyof Projecao] = numValue;
    }

    setData(newData);
  };

  const getValue = (periodo: string, indicador: string, field: string, isAnual: boolean = false): string => {
    if (!data) return "";

    if (isAnual) {
      const target = activeTab === "px" ? "projecoes_anuais_px" : "projecoes_anuais_mercado";
      const val = data[target]?.[periodo]?.[indicador];
      return val !== null && val !== undefined ? String(val) : "";
    } else {
      const target = activeTab === "px" ? "projecoes_px" : "projecoes_mercado";
      const val = (data[target]?.[periodo]?.[indicador] as Projecao)?.[field as keyof Projecao];
      return val !== null && val !== undefined ? String(val) : "";
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/projecoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          metadata: {
            last_updated: new Date().toISOString(),
            updated_by: "admin",
          },
        }),
      });

      if (response.ok) {
        setMessage("✅ Projeções salvas com sucesso!");
      } else {
        setMessage("❌ Erro ao salvar projeções");
      }
    } catch (error) {
      setMessage("❌ Erro ao salvar projeções");
      console.error(error);
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // Tela de senha
  if (showPasswordPrompt && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              Px
            </div>
            <h1 className="text-2xl font-bold text-white">Central de Projeções</h1>
            <p className="text-slate-400 mt-2">Digite a senha para acessar</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-sm">
                {authError}
              </div>
            )}
            
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Senha administrativa"
                className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Entrar
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-slate-400 hover:text-white text-sm">
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">
              PX Economics
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-blue-400">Central de Projeções</span>
          </div>
          <div className="text-sm text-gray-400">
            Última atualização: {new Date(data.metadata.last_updated).toLocaleString("pt-BR")}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs - PX vs Mercado */}
        <div className="flex gap-4 mb-6">
          <div className="flex bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setActiveTab("px")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "px"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📊 Projeções PX
            </button>
            <button
              onClick={() => setActiveTab("mercado")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "mercado"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🏦 Projeções Mercado
            </button>
          </div>

          <div className="flex bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setActiveView("mom")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeView === "mom"
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              MoM
            </button>
            <button
              onClick={() => setActiveView("a12")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeView === "a12"
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              A12
            </button>
            <button
              onClick={() => setActiveView("anual")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeView === "anual"
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* Grid MoM */}
        {activeView === "mom" && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3">
              <h2 className="font-semibold">
                📅 Variação Mensal (MoM) - {activeTab === "px" ? "PX Economics" : "Consenso de Mercado"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white text-xs">
                    <th className="px-3 py-2 text-left font-medium sticky left-0 bg-gray-800 z-10 w-40">
                      Indicador
                    </th>
                    {months.map((month) => (
                      <th key={month} className="px-1 py-2 text-center font-medium w-16">
                        {formatMonth(month)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let lastSection = "";
                    return INDICADORES_MOM.map((ind, idx) => {
                      const showSectionHeader = ind.section !== lastSection;
                      lastSection = ind.section || "";
                      
                      return (
                        <Fragment key={`group-${ind.key}`}>
                          {showSectionHeader && ind.section && (
                            <tr className="bg-gray-700">
                              <td
                                colSpan={months.length + 1}
                                className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide"
                              >
                                {ind.section}
                              </td>
                            </tr>
                          )}
                          <tr className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="px-3 py-1.5 text-xs font-medium text-gray-900 sticky left-0 bg-inherit z-10 whitespace-nowrap">
                              {data.indicadores[ind.key]?.nome || ind.key}
                              <span className="text-gray-400 ml-0.5">
                                ({data.indicadores[ind.key]?.unidade})
                              </span>
                            </td>
                            {months.map((month) => (
                              <td key={month} className="px-0.5 py-0.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={getValue(month, ind.key, "mom")}
                                  onChange={(e) =>
                                    handleInputChange(month, ind.key, "mom", e.target.value)
                                  }
                                  className="w-full px-1 py-1 text-center border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                                  placeholder="—"
                                />
                              </td>
                            ))}
                          </tr>
                        </Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid A12 */}
        {activeView === "a12" && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-3">
              <h2 className="font-semibold">
                📊 Acumulado 12 Meses (A12) - {activeTab === "px" ? "PX Economics" : "Consenso de Mercado"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white text-xs">
                    <th className="px-3 py-2 text-left font-medium sticky left-0 bg-gray-800 z-10 w-40">
                      Indicador
                    </th>
                    {months.map((month) => (
                      <th key={month} className="px-1 py-2 text-center font-medium w-16">
                        {formatMonth(month)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let lastSection = "";
                    return INDICADORES_A12.map((ind, idx) => {
                      const showSectionHeader = ind.section !== lastSection;
                      lastSection = ind.section || "";
                      
                      return (
                        <Fragment key={`group-${ind.key}`}>
                          {showSectionHeader && ind.section && (
                            <tr className="bg-gray-700">
                              <td
                                colSpan={months.length + 1}
                                className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide"
                              >
                                {ind.section}
                              </td>
                            </tr>
                          )}
                          <tr className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="px-3 py-1.5 text-xs font-medium text-gray-900 sticky left-0 bg-inherit z-10 whitespace-nowrap">
                              {data.indicadores[ind.key]?.nome || ind.key}
                              <span className="text-gray-400 ml-0.5">
                                ({data.indicadores[ind.key]?.unidade})
                              </span>
                            </td>
                            {months.map((month) => (
                              <td key={month} className="px-0.5 py-0.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={getValue(month, ind.key, "a12")}
                                  onChange={(e) =>
                                    handleInputChange(month, ind.key, "a12", e.target.value)
                                  }
                                  className="w-full px-1 py-1 text-center border border-gray-200 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs"
                                  placeholder="—"
                                />
                              </td>
                            ))}
                          </tr>
                        </Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid Anual */}
        {activeView === "anual" && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white px-6 py-3">
              <h2 className="font-semibold">
                📆 Previsão Anual - {activeTab === "px" ? "PX Economics" : "Consenso de Mercado"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white text-xs">
                    <th className="px-3 py-2 text-left font-medium w-40">Indicador</th>
                    {years.map((year) => (
                      <th key={year} className="px-2 py-2 text-center font-medium w-20">
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let lastSection = "";
                    return INDICADORES_ANUAIS.map((ind, idx) => {
                      const showSectionHeader = ind.section !== lastSection;
                      lastSection = ind.section || "";
                      
                      return (
                        <Fragment key={`group-${ind.key}`}>
                          {showSectionHeader && ind.section && (
                            <tr className="bg-gray-700">
                              <td
                                colSpan={years.length + 1}
                                className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide"
                              >
                                {ind.section}
                              </td>
                            </tr>
                          )}
                          <tr className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="px-3 py-1.5 text-xs font-medium text-gray-900 whitespace-nowrap">
                              {data.indicadores[ind.key]?.nome || ind.key}
                              <span className="text-gray-400 ml-0.5">
                                ({data.indicadores[ind.key]?.unidade})
                              </span>
                            </td>
                            {years.map((year) => (
                              <td key={year} className="px-1 py-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={getValue(year, ind.key, "valor", true)}
                                  onChange={(e) =>
                                    handleInputChange(year, ind.key, "valor", e.target.value, true)
                                  }
                                  className="w-full px-2 py-1.5 text-center border border-gray-200 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                  placeholder="—"
                                />
                              </td>
                            ))}
                          </tr>
                        </Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition shadow-lg"
          >
            {saving ? "Salvando..." : "💾 Salvar Projeções"}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
          >
            🔄 Recuperar última versão
          </button>

          {message && (
            <span className={`text-sm ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </span>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>📋 Instruções:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Use ponto (.) como separador decimal</li>
            <li>Deixe em branco campos sem projeção</li>
            <li>Clique em "Salvar Projeções" para gravar as alterações</li>
            <li>As projeções serão usadas nos relatórios de IPCA e IPCA-15</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

