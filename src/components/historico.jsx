/**
 * Lee el ultimo archivo de cada dia hasta un maximo de N dias (0 es ilimitado)
 * muestra un grafico donde se muestra el historico de inventario con doble eje Y,
 * uno para "COMPLETA" === "Saldo" y otro para "COMPLETA" === "Completa"
 * recibe la lista completa de archivos CSV y el maximo de archivos a leer.
 * @module Historico
 */

import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  readCSV,
  dataFrameToRows,
  filterRowsByCriteria,
  normalizeString,
} from "@/utils/csvRead.js";

const FILENAME_REGEX = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.csv$/i;

const DATE_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  month: "long",
  year: "numeric",
});

const NUMBER_FORMAT = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function extractFileMeta(entry) {
  const rawName = entry?.file?.name ?? entry?.relativePath ?? "";
  const match = rawName.match(FILENAME_REGEX);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;

  const timestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const dateKey = `${year}-${month}-${day}`;
  const dateLabel = DATE_FORMATTER.format(new Date(timestamp));
  const longLabel = FULL_DATE_FORMATTER.format(new Date(timestamp));

  return {
    rawName,
    dateKey,
    timestamp,
    dateLabel,
    longLabel,
  };
}

function selectLatestFilesByDay(files, maxDays) {
  if (!files || files.length === 0) {
    return [];
  }

  const grouped = files.reduce((map, entry) => {
    const meta = extractFileMeta(entry);

    if (!meta) {
      return map;
    }

    const existing = map.get(meta.dateKey);

    if (!existing || meta.timestamp > existing.meta.timestamp) {
      map.set(meta.dateKey, { entry, meta });
    }

    return map;
  }, new Map());

  const sorted = Array.from(grouped.values()).sort(
    (a, b) => b.meta.timestamp - a.meta.timestamp
  );

  const limited =
    typeof maxDays === "number" && maxDays > 0
      ? sorted.slice(0, maxDays)
      : sorted;

  return limited.sort((a, b) => a.meta.timestamp - b.meta.timestamp);
}

function buildChartData(entries) {
  return entries.map((item) => ({
    date: item.meta.dateLabel,
    fullDate: item.meta.longLabel,
    timestamp: item.meta.timestamp,
    dateKey: item.meta.dateKey,
    monthKey: item.meta.dateKey.slice(0, 7),
    saldo: item.metrics.saldo,
    completa: item.metrics.completa,
  }));
}

async function computeDailyMetrics(entry) {
  const df = await readCSV(entry.entry.file, { applyFilter: false });
  const rows = filterRowsByCriteria(dataFrameToRows(df));

  return rows.reduce(
    (accumulator, row) => {
      const status = normalizeString(row?.COMPLETA);

      if (status === "SALDO") {
        accumulator.saldo += 1;
      } else if (status === "COMPLETA") {
        accumulator.completa += 1;
      }

      return accumulator;
    },
    { saldo: 0, completa: 0 }
  );
}

function HistoricoSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse gap-4 lg:grid-cols-1">
      <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
        <div className="h-72 rounded-xl bg-slate-200" />
      </div>
      <aside className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
        <div className="h-5 w-2/3 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`historico-skeleton-${index}`}
              className="rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm"
            >
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="h-16 rounded-lg bg-slate-200" />
                <div className="h-16 rounded-lg bg-slate-200" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function Historico({ files, maxDays = 0, onChangeMaxDays }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [expandedMonths, setExpandedMonths] = useState(() => new Map());

  const selectedEntries = useMemo(
    () => selectLatestFilesByDay(files, maxDays),
    [files, maxDays]
  );

  useEffect(() => {
    let isCancelled = false;

    if (!selectedEntries.length) {
      setHistoryEntries([]);
      setError(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const metrics = await Promise.all(
          selectedEntries.map(async (entry) => {
            try {
              const dailyMetrics = await computeDailyMetrics(entry);
              return { ...entry, metrics: dailyMetrics };
            } catch (err) {
              console.error("No se pudo procesar", entry.meta.rawName, err);
              return { ...entry, metrics: { saldo: 0, completa: 0 } };
            }
          })
        );

        if (!isCancelled) {
          setHistoryEntries(metrics);
        }
      } catch (err) {
        console.error("Error general al calcular el histórico", err);
        if (!isCancelled) {
          setError("No se pudo calcular el histórico");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [selectedEntries]);

  const chartData = useMemo(
    () => buildChartData(historyEntries),
    [historyEntries]
  );

  const monthlyStats = useMemo(() => {
    const map = new Map();

    chartData.forEach((item) => {
      const monthKey = item.monthKey;
      const timestamp = item.timestamp;
      const existing = map.get(monthKey);

      if (!existing) {
        map.set(monthKey, {
          key: monthKey,
          label: MONTH_LABEL_FORMATTER.format(new Date(timestamp)),
          saldoSum: item.saldo,
          completaSum: item.completa,
          days: [
            {
              label: item.fullDate,
              saldo: item.saldo,
              completa: item.completa,
            },
          ],
        });
      } else {
        existing.saldoSum += item.saldo;
        existing.completaSum += item.completa;
        existing.days.push({
          label: item.fullDate,
          saldo: item.saldo,
          completa: item.completa,
        });
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => {
      const [yearA, monthA] = a.key.split("-").map(Number);
      const [yearB, monthB] = b.key.split("-").map(Number);

      if (yearA !== yearB) {
        return yearA - yearB;
      }

      return monthA - monthB;
    });

    return sorted.map((item) => {
      const count = item.days.length;

      return {
        ...item,
        count,
        avgSaldo: count ? item.saldoSum / count : 0,
        avgCompleta: count ? item.completaSum / count : 0,
      };
    });
  }, [chartData]);

  useEffect(() => {
    setExpandedMonths((prev) => {
      const next = new Map();

      monthlyStats.forEach((month) => {
        next.set(month.key, prev.get(month.key) ?? false);
      });

      return next;
    });
  }, [monthlyStats]);

  const toggleMonth = (key) => {
    setExpandedMonths((current) => {
      const next = new Map(current);
      next.set(key, !next.get(key));
      return next;
    });
  };

  const handleMaxDaysChange = (event) => {
    if (!onChangeMaxDays) {
      return;
    }

    const value = Number(event.target.value);

    if (Number.isNaN(value) || value < 0) {
      onChangeMaxDays(0);
      return;
    }

    onChangeMaxDays(value);
  };

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Histórico de Inventario
          </h3>
          <p className="text-sm text-slate-500">
            Último archivo de cada día {maxDays > 0 && `(máx. ${maxDays} días)`}
          </p>
        </div>
        {onChangeMaxDays && (
          <label className="inline-flex items-center gap-3 text-sm text-slate-600">
            <span>Días a mostrar (0 = todos)</span>
            <input
              type="number"
              min="0"
              value={maxDays}
              onChange={handleMaxDaysChange}
              className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
        )}
      </header>

      {loading && <HistoricoSkeleton />}
      {!loading && error && (
        <p className="mt-6 text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && !chartData.length && (
        <p className="mt-6 text-sm text-slate-500">
          No se encontraron archivos con el formato esperado.
        </p>
      )}

      {!loading && !error && !!chartData.length && (
        <div className="mt-6 grid gap-4 lg:grid-cols-1">
          <div className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#4f46e5" allowDecimals={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#ef4444"
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => Number(value).toLocaleString("es-CL")}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullDate ?? label;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="completa"
                  name="Completa"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <aside className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
            <h4 className="text-sm font-semibold text-slate-700">
              Promedio mensual por estado
            </h4>
            <p className="mt-2 text-xs text-slate-500">
              {chartData.length}{" "}
              {chartData.length === 1 ? "día registrado" : "días registrados"}.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {monthlyStats.map((month) => {
                const isExpanded = expandedMonths.get(month.key);

                return (
                  <div
                    key={month.key}
                    className="rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMonth(month.key)}
                      className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-700"
                      aria-expanded={isExpanded}
                    >
                      <span className="capitalize">{month.label}</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-indigo-500">
                        {isExpanded ? "Ocultar días" : "Ver días"}
                        <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                          {month.count}
                        </span>
                      </span>
                    </button>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-indigo-50/80 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">
                          Saldo promedio
                        </p>
                        <p className="text-base font-semibold text-indigo-700">
                          {NUMBER_FORMAT.format(month.avgSaldo)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-rose-50/80 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500">
                          Completa promedio
                        </p>
                        <p className="text-base font-semibold text-rose-600">
                          {NUMBER_FORMAT.format(month.avgCompleta)}
                        </p>
                      </div>
                    </div>
                    {isExpanded && (
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                        {month.days.map((day) => (
                          <li
                            key={`${month.key}-${day.label}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/70 px-2 py-1"
                          >
                            <span className="line-clamp-1 font-medium text-slate-600">
                              {day.label}
                            </span>
                            <span className="flex items-center gap-3 text-[11px]">
                              <span className="font-semibold text-indigo-600">
                                Saldo: {day.saldo.toLocaleString("es-CL")}
                              </span>
                              <span className="font-semibold text-rose-600">
                                Completa: {day.completa.toLocaleString("es-CL")}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
