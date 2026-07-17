"use client";

import { useState, useMemo } from "react";
import { Input, Badge, Select } from "./index";

export interface Column {
  key: string;
  label: string;
  type?: "text" | "badge";
  sortable?: boolean;
}

type BadgeCell = { label: string; tone: "green" | "yellow" | "red" | "blue" | "gray" };
export type Row = Record<string, string | number | BadgeCell | null | undefined>;

export function DataTable({
  columns,
  rows,
  searchable = true,
  pageSize = 10,
  emptyText = "Kayıt bulunamadı",
}: {
  columns: Column[];
  rows: Row[];
  searchable?: boolean;
  pageSize?: number;
  emptyText?: string;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(pageSize);

  const filtered = useMemo(() => {
    let data = rows;
    if (q.trim()) {
      const term = q.toLowerCase();
      data = data.filter((r) =>
        columns.some((c) => {
          const v = r[c.key];
          const text = typeof v === "object" && v ? v.label : v;
          return String(text ?? "").toLowerCase().includes(term);
        }),
      );
    }
    if (sortKey) {
      data = [...data].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const at = typeof av === "object" && av ? av.label : av;
        const bt = typeof bv === "object" && bv ? bv.label : bv;
        if (typeof at === "number" && typeof bt === "number") return sortDir === "asc" ? at - bt : bt - at;
        return sortDir === "asc"
          ? String(at ?? "").localeCompare(String(bt ?? ""), "tr")
          : String(bt ?? "").localeCompare(String(at ?? ""), "tr");
      });
    }
    return data;
  }, [rows, q, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(current * size, current * size + size);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="flex items-center justify-between gap-3">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Ara..."
            className="max-w-xs"
            aria-label="Tabloda ara"
          />
          <span className="text-xs text-slate-400">{filtered.length} kayıt</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={c.sortable !== false ? "cursor-pointer select-none px-3 py-2 hover:text-slate-700" : "px-3 py-2"}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sortKey === c.key && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                {columns.map((c) => {
                  const v = r[c.key];
                  if (c.type === "badge" && typeof v === "object" && v) {
                    return (
                      <td key={c.key} className="px-3 py-2">
                        <Badge tone={v.tone}>{v.label}</Badge>
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className="px-3 py-2 text-slate-700">
                      {v == null ? "-" : String(typeof v === "object" ? v.label : v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-slate-400">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <span>Sayfa başına</span>
          <Select
            value={String(size)}
            onChange={(e) => {
              setSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            className="w-20"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
            onClick={() => setPage(current - 1)}
            disabled={current === 0}
          >
            Önceki
          </button>
          <span className="text-xs text-slate-500">
            {current + 1} / {pageCount}
          </span>
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
            onClick={() => setPage(current + 1)}
            disabled={current >= pageCount - 1}
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
}
