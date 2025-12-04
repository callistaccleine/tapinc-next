"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/OrdersTable.module.css";

export default function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) console.error("Error loading orders:", error);
      else setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) alert("Failed to delete");
    else setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  useEffect(() => {
    setPage(1);
  }, [search, sortDir]);

  const filtered = orders
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (o.order_number && String(o.order_number).toLowerCase().includes(q)) ||
        (o.user_id && String(o.user_id).toLowerCase().includes(q)) ||
        (o.payment_status && String(o.payment_status).toLowerCase().includes(q)) ||
        (o.status && String(o.status).toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDir === "desc" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div>
          <h3>All Orders</h3>
          <p className={styles.subhead}>Search by order number, user, or status</p>
        </div>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}>
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Order Number</th>
            <th>Payment Status</th>
            <th>Shipment Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.user_id}</td>
              <td>{o.order_number}</td>
              <td>{o.payment_status}</td>
              <td>{o.status}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => deleteOrder(o.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length > 0 && (
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
