"use client"
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Orders.module.css";
import { useRouter } from "next/navigation"; 

interface Order {
  id: string;
  order_number: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  status: string;
  created_at: string;
}

const Orders: React.FC = () => {
  const router = useRouter(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const fetchOrders = async () => {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user){
        console.error('No user found')
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          created_at,
          order_items (
            product_name,
            product_image,
            price,
            quantity
          )
        `)
        .eq("user_id", user.id) 
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error.message);
      } else {
        setOrders(
          (data || []).flatMap((order) =>
            order.order_items.map((item) => ({
              id: order.id,
              order_number: order.order_number,
              status: order.status,
              created_at: order.created_at,
              product_name: item.product_name,
              product_image: item.product_image,
              price: item.price,
              quantity: item.quantity,
            }))
          )
        );
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders =
    filter === "All" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className={styles.ordersContainer}>
      <h2 className={styles.pageTitle}>My Orders</h2>

      {/* Filters */}
      <div className={styles.filters}>
        {["All", "Shipped", "Delivered", "Cancelled", "Returned"].map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${
              filter === f ? styles.active : ""
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className={styles.orderList}>
        {filteredOrders.length === 0 ? (
          <p className={styles.emptyMessage}>No orders found.</p>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <span
                  className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}
                >
                  {order.status}
                </span>
                <span className={styles.orderDate}>
                  {new Date(order.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className={styles.orderNumber}>
                  Order No: {order.order_number}
                </span>
              </div>

              <div className={styles.orderBody}>
                <img
                  src={order.product_image}
                  alt={order.product_name}
                  className={styles.productImage}
                />
                <div className={styles.orderInfo}>
                  <div className={styles.productName}>{order.product_name}</div>
                  <div className={styles.productPrice}>
                    ${order.price} x {order.quantity}
                  </div>
                  <div className={styles.orderTotal}>
                    Total: ${(order.price * order.quantity).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={styles.orderFooter}>
              <button
                className={styles.detailsBtn}
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                Order Details
              </button>  
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
