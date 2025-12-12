"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar,
} from "recharts";
import { useTheme } from "@/contexts/ThemeContext";

interface ChartDataPoint {
  date: string;
  [key: string]: string | number | null;
}

interface SeriesConfig {
  key: string;
  name: string;
  color: string;
}

interface InflationChartProps {
  data: ChartDataPoint[];
  series: SeriesConfig[];
  title: string;
  yAxisLabel?: string;
  showZeroLine?: boolean;
  yDomain?: [number | "auto", number | "auto"];
  height?: number;
}

export function InflationChart({
  data,
  series,
  title,
  yAxisLabel = "%",
  showZeroLine = false,
  yDomain,
  height = 280,
}: InflationChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#1f2937" : "#e5e7eb";
  const axisColor = isDark ? "#9ca3af" : "#6b7280";
  const axisLine = isDark ? "#374151" : "#d1d5db";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#1f2937" : "#e5e7eb";
  const tooltipText = isDark ? "#e5e7eb" : "#111827";
  const refLineColor = isDark ? "#4b5563" : "#9ca3af";

  // Generate ticks: show ~6 evenly spaced + always the last one
  const tickCount = 6;
  const step = Math.max(1, Math.floor(data.length / tickCount));
  const tickIndices = new Set<number>();

  for (let i = 0; i < data.length; i += step) {
    tickIndices.add(i);
  }
  tickIndices.add(data.length - 1); // Always show last

  const ticks = data
    .filter((_, i) => tickIndices.has(i))
    .map((d) => d.date);

  return (
    <div className="rounded-2xl border-0 bg-white p-5 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-gray-800 mb-4 dark:text-slate-100">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: axisColor }}
            tickLine={{ stroke: axisLine }}
            axisLine={{ stroke: axisLine }}
            ticks={ticks}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor }}
            tickLine={{ stroke: axisLine }}
            axisLine={{ stroke: axisLine }}
            tickFormatter={(value) => `${value.toFixed(0)}${yAxisLabel}`}
            width={40}
            domain={yDomain || ["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: isDark
                ? "0 4px 16px -1px rgb(0 0 0 / 0.35)"
                : "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              color: tooltipText,
            }}
            formatter={(value, name) => {
              const numValue = typeof value === "number" ? value : null;
              return [numValue !== null ? `${numValue.toFixed(2)}%` : "—", name];
            }}
            labelStyle={{ fontWeight: 600, marginBottom: "4px", color: tooltipText }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "11px",
              paddingTop: "12px",
              color: isDark ? "#e5e7eb" : "#111827",
            }}
            iconType="line"
            iconSize={14}
          />
          {showZeroLine && (
            <ReferenceLine y={0} stroke={refLineColor} strokeDasharray="3 3" />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={isDark && s.color === "#0f172a" ? "#f1f5f9" : s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: isDark && s.color === "#0f172a" ? "#f1f5f9" : s.color }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string | number | null;
  suffix?: string;
  subtext?: string;
  delta?: number | null;
  size?: "sm" | "md" | "lg";
}

export function MetricCard({
  label,
  value,
  suffix = "%",
  subtext,
  delta,
  size = "md",
}: MetricCardProps) {
  const valueSize = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  const deltaColor =
    delta && delta > 0 ? "text-red-500" : delta && delta < 0 ? "text-green-500" : "text-gray-500";
  const deltaSign = delta && delta > 0 ? "+" : "";

  return (
    <div className="rounded-2xl border-0 dark:border dark:border-slate-800 bg-white p-4 shadow-sm dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 ${valueSize} font-semibold text-gray-900 dark:text-white`}>
        {value !== null && value !== undefined
          ? typeof value === "number"
            ? value.toFixed(2)
            : value
          : "—"}
        <span className="text-base font-normal text-gray-700 dark:text-slate-400">{suffix}</span>
      </p>
      {delta !== undefined && delta !== null && (
        <p className={`mt-1 text-xs font-medium ${deltaColor}`}>
          {deltaSign}{delta.toFixed(2)} p.p. vs anterior
        </p>
      )}
      {subtext && <p className="mt-1 text-xs text-gray-700 dark:text-slate-400">{subtext}</p>}
    </div>
  );
}

// Data Table Component for Inflation Reports
interface InflationTableRow {
  componente: string;
  peso: number | null;
  mom: number | null;
  momAnterior: number | null;
  delta: number | null;
  a12: number | null;
  a12Anterior: number | null;
}

interface InflationTableProps {
  data: InflationTableRow[];
  title: string;
  previousMonthLabel: string;
  sameMonthLastYearLabel: string;
}

export function InflationTable({
  data,
  title,
  previousMonthLabel,
  sameMonthLastYearLabel,
}: InflationTableProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerClass = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden"
    : "rounded-2xl border-0 bg-white shadow-sm overflow-hidden";

  const headerRowClass = isDark
    ? "border-b border-slate-700 text-slate-100 bg-slate-800"
    : "border-b-0 text-gray-900 bg-white";

  const rowBorderClass = isDark ? "border-slate-800" : "border-0";
  const rowHighlight = isDark ? "bg-slate-800/60" : "bg-blue-50";
  const rowEven = isDark ? "bg-slate-900/60" : "bg-white";
  const rowOdd = isDark ? "bg-slate-800/50" : "bg-gray-50";
  const rowHover = isDark ? "hover:bg-slate-700/70" : "hover:bg-blue-50/60";
  const textMain = isDark ? "text-slate-100" : "text-gray-900";
  const textSecondary = isDark ? "text-slate-200" : "text-gray-900";
  const textDeltaNeutral = isDark ? "text-slate-200" : "text-gray-900";

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (value === null || value === undefined) return "—";
    return value.toFixed(decimals);
  };

  const formatDelta = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  };

  return (
    <div className={containerClass}>
      <div className="px-5 py-3 border-b-0 bg-white dark:border dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className={`text-sm font-semibold ${textMain}`}>{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white dark:bg-slate-800">
            <tr
              className={headerRowClass}
              style={
                isDark
                  ? undefined
                  : {
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                  }
              }
            >
              {[
                "Componente",
                "Peso",
                "MoM",
                previousMonthLabel,
                "Δ p.p.",
                "A12",
                sameMonthLastYearLabel,
              ].map((label) => (
                <th
                  key={label}
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide bg-white dark:bg-slate-800"
                  style={
                    isDark
                      ? undefined
                      : {
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                      }
                  }
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b ${rowBorderClass} ${idx === 0 ? `${rowHighlight} font-medium` : idx % 2 === 0 ? rowEven : rowOdd
                  } ${rowHover} transition-colors`}
                style={isDark ? undefined : idx === 0 ? { backgroundColor: "#f7fbff" } : { backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}
              >
                <td className={`px-4 py-2.5 font-medium ${textMain}`}>
                  {row.componente}
                </td>
                <td className={`px-4 py-2.5 font-mono ${textSecondary}`}>
                  {formatNumber(row.peso, 1)}
                </td>
                <td className={`px-4 py-2.5 font-mono ${textSecondary}`}>
                  {formatNumber(row.mom)}
                </td>
                <td className={`px-4 py-2.5 font-mono ${textSecondary}`}>
                  {formatNumber(row.momAnterior)}
                </td>
                <td
                  className={`px-4 py-2.5 font-mono ${row.delta !== null && row.delta > 0
                      ? "text-red-500"
                      : row.delta !== null && row.delta < 0
                        ? "text-green-500"
                        : textDeltaNeutral
                    }`}
                >
                  {formatDelta(row.delta)}
                </td>
                <td className={`px-4 py-2.5 font-mono ${textSecondary}`}>
                  {formatNumber(row.a12)}
                </td>
                <td className={`px-4 py-2.5 font-mono ${textSecondary}`}>
                  {formatNumber(row.a12Anterior)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Heatmap Table Component for 12-month time series
interface HeatmapTableProps {
  data: { date: string; formattedDate: string; values: Record<string, number | null> }[];
  indicators: { key: string; label: string }[];
  title: string;
}

export function HeatmapTable({
  data,
  indicators,
  title,
}: HeatmapTableProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Calculate 2-year average for each indicator (for heatmap reference)
  // We use all provided data for the average calculation
  const twoYearAvg: Record<string, number> = {};
  const twoYearStd: Record<string, number> = {};

  indicators.forEach((ind) => {
    const values = data
      .map((row) => row.values[ind.key])
      .filter((v): v is number => v !== null && v !== undefined);

    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
      twoYearAvg[ind.key] = avg;
      twoYearStd[ind.key] = Math.sqrt(variance);
    }
  });

  // Get heatmap color based on deviation from 2-year average
  // Blue = below average (cooler/better for inflation), Red = above average (hotter/worse)
  const getHeatmapColor = (value: number | null, key: string): string => {
    if (value === null || value === undefined) return "transparent";

    const avg = twoYearAvg[key];
    const std = twoYearStd[key];

    if (avg === undefined || std === undefined || std === 0) return "transparent";

    // Calculate z-score (how many std deviations from mean)
    const zScore = (value - avg) / std;

    // Clamp z-score to reasonable range
    const clampedZ = Math.max(-2, Math.min(2, zScore));

    if (isDark) {
      // Dark mode colors - Blue (cool/below avg) to Red (hot/above avg)
      if (clampedZ > 1.5) return "rgba(220, 38, 38, 0.6)";   // Very hot - dark red
      if (clampedZ > 1.0) return "rgba(239, 68, 68, 0.5)";   // Hot - red
      if (clampedZ > 0.5) return "rgba(248, 113, 113, 0.4)"; // Warm - light red
      if (clampedZ > 0.25) return "rgba(252, 165, 165, 0.3)";// Slightly warm - pale red
      if (clampedZ < -1.5) return "rgba(30, 64, 175, 0.6)";  // Very cool - dark blue
      if (clampedZ < -1.0) return "rgba(59, 130, 246, 0.5)"; // Cool - blue
      if (clampedZ < -0.5) return "rgba(96, 165, 250, 0.4)"; // Mild cool - light blue
      if (clampedZ < -0.25) return "rgba(147, 197, 253, 0.3)";// Slightly cool - pale blue
      return "transparent"; // Neutral (near average)
    } else {
      // Light mode colors - Blue (cool/below avg) to Red (hot/above avg)
      if (clampedZ > 1.5) return "rgba(220, 38, 38, 0.4)";   // Very hot - dark red
      if (clampedZ > 1.0) return "rgba(239, 68, 68, 0.3)";   // Hot - red
      if (clampedZ > 0.5) return "rgba(248, 113, 113, 0.25)";// Warm - light red
      if (clampedZ > 0.25) return "rgba(254, 202, 202, 0.35)";// Slightly warm - pale red
      if (clampedZ < -1.5) return "rgba(30, 64, 175, 0.35)"; // Very cool - dark blue
      if (clampedZ < -1.0) return "rgba(59, 130, 246, 0.3)"; // Cool - blue
      if (clampedZ < -0.5) return "rgba(96, 165, 250, 0.25)";// Mild cool - light blue
      if (clampedZ < -0.25) return "rgba(191, 219, 254, 0.4)";// Slightly cool - pale blue
      return "transparent"; // Neutral (near average)
    }
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return value.toFixed(2);
  };

  const containerClass = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden"
    : "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden";

  const headerClass = isDark
    ? "bg-slate-800 text-slate-100"
    : "bg-gray-50 text-gray-900";

  const textMain = isDark ? "text-slate-100" : "text-gray-900";
  const textSecondary = isDark ? "text-slate-300" : "text-gray-700";

  return (
    <div className={containerClass}>
      <div className={`px-5 py-3 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
        <h3 className={`text-sm font-semibold ${textMain}`}>{title}</h3>
        <p className={`text-xs mt-1 ${textSecondary} flex items-center flex-wrap gap-1`}>
          <span>Cores vs média 2 anos:</span>
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: isDark ? "rgba(30, 64, 175, 0.6)" : "rgba(30, 64, 175, 0.35)" }}></span>
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: isDark ? "rgba(59, 130, 246, 0.5)" : "rgba(59, 130, 246, 0.3)" }}></span>
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: isDark ? "rgba(147, 197, 253, 0.3)" : "rgba(191, 219, 254, 0.4)" }}></span>
          <span className="text-blue-600 dark:text-blue-400 mx-1">abaixo</span>
          <span className="mx-1">|</span>
          <span className="text-red-600 dark:text-red-400 mx-1">acima</span>
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: isDark ? "rgba(252, 165, 165, 0.3)" : "rgba(254, 202, 202, 0.35)" }}></span>
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: isDark ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.3)" }}></span>
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: isDark ? "rgba(220, 38, 38, 0.6)" : "rgba(220, 38, 38, 0.4)" }}></span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={headerClass}>
            <tr>
              <th className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide sticky left-0 ${headerClass}`}>
                Indicador
              </th>
              {data.map((row) => (
                <th
                  key={row.date}
                  className="px-2 py-2.5 text-center text-xs font-medium whitespace-nowrap"
                >
                  {row.formattedDate}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind, idx) => (
              <tr
                key={ind.key}
                className={`border-b ${isDark ? "border-slate-800" : "border-gray-100"} ${idx === 0 ? "font-medium" : ""
                  }`}
              >
                <td className={`px-3 py-2 font-medium whitespace-nowrap sticky left-0 ${isDark ? "bg-slate-900" : "bg-white"
                  } ${textMain}`}>
                  {ind.label}
                </td>
                {data.map((row) => {
                  const value = row.values[ind.key];
                  const bgColor = getHeatmapColor(value, ind.key);
                  return (
                    <td
                      key={row.date}
                      className={`px-2 py-2 text-center font-mono text-xs ${textSecondary}`}
                      style={{ backgroundColor: bgColor }}
                    >
                      {formatNumber(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Diffusion Chart Component (Bar + Line)
interface DiffusionChartProps {
  data: { date: string; mensal: number | null; referencia: number | null }[];
  title: string;
  barLabel: string;
  lineLabel: string;
  barColor?: string;
  lineColor?: string;
  height?: number;
}

export function DiffusionChart({
  data,
  title,
  barLabel,
  lineLabel,
  barColor = "#3b82f6",
  lineColor = "#ef4444",
  height = 280,
}: DiffusionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#1f2937" : "#e5e7eb";
  const axisColor = isDark ? "#9ca3af" : "#6b7280";
  const axisLine = isDark ? "#374151" : "#d1d5db";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#1f2937" : "#e5e7eb";
  const tooltipText = isDark ? "#e5e7eb" : "#111827";
  const refLineColor = isDark ? "#4b5563" : "#9ca3af";

  // Generate ticks
  const tickCount = 6;
  const step = Math.max(1, Math.floor(data.length / tickCount));
  const tickIndices = new Set<number>();

  for (let i = 0; i < data.length; i += step) {
    tickIndices.add(i);
  }
  tickIndices.add(data.length - 1);

  const ticks = data.filter((_, i) => tickIndices.has(i)).map((d) => d.date);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-gray-800 mb-4 dark:text-slate-100">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 5, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: axisColor }}
            tickLine={{ stroke: axisLine }}
            axisLine={{ stroke: axisLine }}
            ticks={ticks}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor }}
            tickLine={{ stroke: axisLine }}
            axisLine={{ stroke: axisLine }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            width={40}
            domain={[30, 80]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: isDark
                ? "0 4px 16px -1px rgb(0 0 0 / 0.35)"
                : "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              color: tooltipText,
            }}
            formatter={(value, name) => {
              const numValue = typeof value === "number" ? value : null;
              return [numValue !== null ? `${numValue.toFixed(1)}%` : "—", name];
            }}
            labelStyle={{ fontWeight: 600, marginBottom: "4px", color: tooltipText }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "11px",
              paddingTop: "12px",
              color: isDark ? "#e5e7eb" : "#111827",
            }}
            iconType="rect"
            iconSize={12}
          />
          <ReferenceLine y={50} stroke={refLineColor} strokeDasharray="3 3" />
          <Bar
            dataKey="mensal"
            name={barLabel}
            fill={barColor}
            radius={[2, 2, 0, 0]}
            maxBarSize={12}
          />
          <Line
            type="monotone"
            dataKey="referencia"
            name={lineLabel}
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

