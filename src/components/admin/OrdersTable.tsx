"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/OrdersTable.module.css";

export default function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className={styles.tableContainer}>
      <h3>All Orders</h3>
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
          {orders.map((o) => (
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
    </div>
  );
}
