/**
 * Carga el inventario de productos desde un archivo CSV
 * y muestra los datos en tarjetas, tiene un buscador por ROLL_ID.
 * recibe un archivo CSV como entrada.
 * @module Inventario
 */

import { useState, useEffect, useMemo } from "react";
import { readCSV, getTotalInventory } from "@/utils/csvRead.js";
import * as dfd from "danfojs";

const PREFERRED_WIDTHS = ["1930", "2100", "2250", "2350", "2450"];

function splitPreferredWidths(widths) {
  const preferred = [];
  const others = [];

  widths.forEach((item) => {
    const normalized = String(item.width ?? "").trim();

    if (PREFERRED_WIDTHS.includes(normalized)) {
      preferred.push(item);
      return;
    }

    others.push(item);
  });

  return {
    preferred,
    others,
  };
}

function InventorySkeleton({ count = 6 }) {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`inventory-skeleton-${index}`}
          className="rounded-xl border border-slate-200 bg-white/60 p-4 shadow-sm"
        >
          <div className="h-5 w-1/2 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="h-4 w-full rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Inventario({ file }) {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(() => new Map());

  useEffect(() => {
    if (!file) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const df = await readCSV(file);
        const inventory = getTotalInventory(df);
        let rows = [];

        if (inventory) {
          const jsonRows = dfd.toJSON(inventory, { format: "row" });

          if (Array.isArray(jsonRows)) {
            rows = jsonRows;
          } else if (typeof jsonRows === "string") {
            try {
              const parsed = JSON.parse(jsonRows);
              if (Array.isArray(parsed)) {
                rows = parsed;
              }
            } catch (parseError) {
              console.error(
                "No se pudo parsear el inventario JSON",
                parseError
              );
            }
          }
        }

        if (rows.length === 0 && Array.isArray(inventory?.values)) {
          rows = inventory.values;
        }

        const structuredRows = rows.map((row) => {
          const rowArray = Array.isArray(row)
            ? row
            : [row?.PAPER_CODE, row?.WIDTH, row?.TOTAL_ROLLS];

          return {
            paperCode: rowArray?.[0] ?? "",
            width: rowArray?.[1] ?? "",
            totalRolls: Number(rowArray?.[2] ?? 0),
          };
        });

        setData(structuredRows);
      } catch (err) {
        setError("Error loading data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [file]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return data.filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      const paperCodeMatch = item.paperCode
        ?.toString()
        .toLowerCase()
        .includes(normalizedSearch);
      const widthMatch = item.width
        ?.toString()
        .toLowerCase()
        .includes(normalizedSearch);

      return paperCodeMatch || widthMatch;
    });
  }, [data, normalizedSearch]);
  // debe sumar los totalRolls de cada item en filteredItems
  const totalItems = filteredItems.reduce(
    (sum, item) => sum + (item.totalRolls || 0),
    0
  );
  const groupedResults = useMemo(() => {
    const groupedMap = filteredItems.reduce((map, item) => {
      const key = item.paperCode || "Sin código";

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push({
        width: item.width,
        totalRolls: item.totalRolls,
      });

      return map;
    }, new Map());

    return Array.from(groupedMap.entries())
      .sort(([paperCodeA], [paperCodeB]) =>
        String(paperCodeA).localeCompare(String(paperCodeB))
      )
      .map(([paperCode, widths]) => {
        const sortedWidths = [...widths].sort((a, b) => {
          const widthA = Number(a.width);
          const widthB = Number(b.width);

          if (Number.isNaN(widthA) || Number.isNaN(widthB)) {
            return String(a.width).localeCompare(String(b.width));
          }

          return widthA - widthB;
        });

        const { preferred, others } = splitPreferredWidths(sortedWidths);

        return {
          paperCode,
          widths: sortedWidths,
          preferredWidths: preferred,
          additionalWidths: others,
        };
      });
  }, [filteredItems]);

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Map();

      groupedResults.forEach((group) => {
        next.set(group.paperCode, prev.get(group.paperCode) ?? false);
      });

      return next;
    });
  }, [groupedResults]);

  const toggleGroup = (paperCode) => {
    setExpandedGroups((current) => {
      const next = new Map(current);
      const isExpanded = next.get(paperCode);
      next.set(paperCode, !isExpanded);
      return next;
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Inventario de Bobinas</h2>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por PAPER_CODE o WIDTH"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span>
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
      {loading && <InventorySkeleton />}
      {!loading && error && <p className="text-red-500">{error}</p>}
      {!loading && !error && groupedResults.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
          No se encontraron datos.
        </div>
      )}
      {!loading && !error && groupedResults.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupedResults.map((group, index) => {
            const isExpanded = expandedGroups.get(group.paperCode) ?? false;
            const showToggle = group.additionalWidths.length > 0;

            return (
              <div
                key={`${group.paperCode || "sin-codigo"}-${index}`}
                className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {group.paperCode}
                  </h3>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {group.widths.length}{" "}
                    {group.widths.length === 1 ? "variante" : "variantes"}
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {group.preferredWidths.map((item) => (
                    <li
                      key={`${group.paperCode}-${item.width}`}
                      className="flex items-center justify-between rounded-lg bg-indigo-50/80 px-3 py-2 text-sm text-indigo-900"
                    >
                      <span className="font-medium">WIDTH: {item.width}</span>
                      <span>
                        {item.totalRolls}{" "}
                        {item.totalRolls === 1 ? "rollo" : "rollos"}
                      </span>
                    </li>
                  ))}
                  {showToggle && !isExpanded && (
                    <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      <span className="font-medium">Otros widths</span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.paperCode)}
                        className="text-indigo-600 transition hover:text-indigo-500"
                      >
                        Mostrar {group.additionalWidths.length}
                      </button>
                    </li>
                  )}
                  {isExpanded &&
                    group.additionalWidths.map((item) => (
                      <li
                        key={`${group.paperCode}-${item.width}-extra`}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"
                      >
                        <span className="font-medium">WIDTH: {item.width}</span>
                        <span>
                          {item.totalRolls}{" "}
                          {item.totalRolls === 1 ? "rollo" : "rollos"}
                        </span>
                      </li>
                    ))}
                  {showToggle && isExpanded && (
                    <li className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.paperCode)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        Ocultar adicionales
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
