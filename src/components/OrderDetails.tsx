"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/OrderDetails.module.css";
import { useParams } from "next/navigation";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_address: string;
  user_id: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

const OrderDetails: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { id } = useParams();  
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single();


      if (orderError) {
        console.error("Error fetching order:", orderError.message);
        return;
      }

      setOrder(orderData);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not logged in");
      
      const { data, error } = await supabase.from("orders").insert([
        {
          user_id: user.id,
          customer_name: user.user_metadata?.display_name || "Guest",
          customer_email: user.email,
          status: "pending",
          // …other order fields
        }
      ]);

      // Fetch order items
      const { data: itemData, error: itemError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      if (!itemError && itemData) setItems(itemData);

      setCustomer({
        name: orderData.customer_name,
        email: orderData.customer_email,});
    };
    fetchOrder();
  }, [id]);

  if (!order) return <p className={styles.loading}>Loading order details...</p>;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 15; // static demo value
  const tax = subtotal * 0.1; 
  const total = subtotal + shippingCost + tax;

  return (
    <div className={styles.orderDetails}>
      {/* Header */}
      <button onClick={() => router.push(`/dashboard`)} className={styles.backBtn}>
        ← 
    </button>
      <h2 className={styles.title}>Order ID: {order.order_number}</h2>
      <p className={styles.date}>Order date: {new Date(order.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
        {order.status}
      </span>

      {/* Customer Info */}
      <section className={styles.section}>
        <h3>Customer</h3>
        <p>{customer.name || "N/A"}</p>
        <p>{customer.email || "N/A"}</p>
        <p>{order.shipping_address || "No shipping address"}</p>
      </section>

      {/* Items */}
      <section className={styles.section}>
        <h3>Items</h3>
        {items.length === 0 ? (
          <p>No items found for this order.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={styles.item}>
              <img
                src={item.product_image}
                alt={item.product_name}
                className={styles.itemImage}
              />
              <div>
                <p className={styles.itemName}>{item.product_name}</p>
                <p className={styles.itemMeta}>
                  ${item.price} x {item.quantity}
                </p>
              </div>
              <p className={styles.itemTotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </section>

      {/* Payment Summary */}
      <section className={styles.section}>
        <h3>Payment Summary</h3>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Shipping Fee: ${shippingCost.toFixed(2)}</p>
        <p>Tax: ${tax.toFixed(2)}</p>
        <br />
        <strong>Total: ${total.toFixed(2)}</strong>

      </section>

      <br />

      {/* <button
        className={styles.payBtn}
        onClick={() => router.push(`/checkout?order_id=${order.id}`)}
        >
        Pay Now
        </button> */}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button>Invoice</button>
      </div>
    </div>
  );
};

export default OrderDetails;
