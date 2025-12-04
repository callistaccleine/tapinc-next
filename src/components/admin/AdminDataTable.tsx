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

  const loadRows = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select("*").limit(limit);
      if (orderBy) {
        query = query.order(orderBy, { ascending: !orderDescending });
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
  }, [table, limit, orderBy, orderDescending]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }, [rows]);

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
          <span className={styles.rowCount}>{rows.length} rows</span>
          <button onClick={loadRows} className={styles.refreshBtn}>
            Refresh
          </button>
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

      {!loading && !error && rows.length > 0 && (
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
              {rows.map((row, index) => (
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
    </div>
  );
}
