"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Orders.module.css";
import { useRouter } from "next/navigation"; 

interface OrderItem {
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const Orders: React.FC = () => {
  const router = useRouter(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
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
        return;
      }

      // Group by order_number
      const groupedOrders: Record<string, Order> = {};
      (data || []).forEach((order: any) => {
        const orderNum = order.order_number;
        if (!groupedOrders[orderNum]) {
          groupedOrders[orderNum] = {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
            items: [],
          };
        }
        groupedOrders[orderNum].items.push(...order.order_items);
      });

      setOrders(Object.values(groupedOrders));
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
            className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
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
            <div key={order.order_number} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <span
                  className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}
                >
                  {order.status}
                </span>
                <span className={styles.orderDate}>
                  {new Date(order.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className={styles.orderNumber}>
                  Order No: {order.order_number}
                </span>
              </div>

              {/* All products for this order */}
            `  {order.items?.map((item, i) => (
                <div key={i} className={styles.orderBody}>
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className={styles.productImage}
                  />
                  <div className={styles.orderInfo}>
                    <div className={styles.productName}>{item.product_name}</div>
                    <div className={styles.productPrice}>
                      ${item.price} × {item.quantity}
                    </div>
                    <div className={styles.subtotal}>
                      Subtotal: ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              {/* ✅ Final order total below all products */}
              <div className={styles.orderSummary}>
                {/* Compute subtotal */}
                {(() => {
                  const subtotal = order.items?.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ) ?? 0;

                  // Example values — you can replace with order.shipping_fee, order.tax if stored in DB
                  const shippingCost = 15.0; // Flat rate or fetched from order table
                  const tax = subtotal * 0.1; // Example: 10% tax

                  const total = subtotal + shippingCost + tax;

                  return (
                    <>
                      <div className={styles.paymentSummary}>
                        <p>Subtotal: ${subtotal.toFixed(2)}</p>
                        <p>Shipping Fee: ${shippingCost.toFixed(2)}</p>
                        <p>Tax: ${tax.toFixed(2)}</p>
                        <strong>Total: ${total.toFixed(2)}</strong>
                      </div>
                    </>
                  );
                })()}
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
