"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/AdminDataTable.module.css";

interface AdminDataTableProps {
  table: string;
  title?: string;
  description?: string;
  limit?: number;
  orderBy?: string;
  orderDescending?: boolean;
}

export default function AdminDataTable({
  table,
  title,
  description,
  limit = 100,
  orderBy,
  orderDescending = true,
}: AdminDataTableProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    orderDescending ? "desc" : "asc"
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadRows = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select("*").limit(limit);
      if (orderBy) {
        query = query.order(orderBy, { ascending: sortDir === "asc" });
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setRows(data ?? []);
    } catch (err: any) {
      const message = err?.message || "Failed to load data";
      console.error(`Error loading ${table}:`, message);
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, limit, orderBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, table]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const value = row[col];
        if (value === null || value === undefined) return false;
        const text =
          typeof value === "object" ? JSON.stringify(value) : String(value);
        return text.toLowerCase().includes(query);
      })
    );
  }, [rows, search, columns]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filteredRows.slice(start, end);

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") {
      return value.length > 120 ? `${value.slice(0, 117)}…` : value;
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableHeader}>
        <div>
          <h3>{title ?? table}</h3>
          {description && <p className={styles.subhead}>{description}</p>}
        </div>
        <div className={styles.headerActions}>
          <span className={styles.rowCount}>{filteredRows.length} rows</span>
          <button onClick={loadRows} className={styles.refreshBtn}>
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.sortBox}>
          <label>Sort</label>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            disabled={!orderBy}
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>
      </div>

      {loading && <div className={styles.state}>Loading {table}…</div>}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadRows} className={styles.refreshBtn}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className={styles.state}>No rows found.</div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <div className={styles.scrollArea}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={row.id ?? `${table}-${index}`}>
                  {columns.map((col) => (
                    <td
                      key={`${col}-${index}`}
                      title={row[col] === null || row[col] === undefined ? "" : String(row[col])}
                    >
                      {formatValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
