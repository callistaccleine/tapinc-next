"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/AdminDashboard.module.css";
import AdminSidebar from "./AdminSidebar";
import UsersTable from "./UsersTable";
import ProfilesTable from "./ProfilesTable";
import DesignProfilesTable from "./DesignProfilesTable";
import OrdersTable from "./OrdersTable";

type TabKey = "users" | "profiles" | "design_profiles" | "orders";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login"); // redirect if not logged in
        return;
      }

      console.log("Email fetched:", data.user.email);

      const userEmail = (data.user.email || "").trim().toLowerCase();
      setEmail(userEmail);

      if (userEmail === "tapinc.io.au@gmail.com" || "hello@tapink.com.au") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.push("/dashboard");
      }
    };

    checkAdmin();
  }, [router]);

  // ✅ Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isAdmin === null) return <p>Loading admin dashboard...</p>;
  if (!isAdmin) return <p>Redirecting...</p>;

  return (
    <div className={styles.adminDashboard}>
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={styles.mainContent}>
        <div className={styles.dashboardHeader}>
          <h2>Admin Dashboard</h2>
          <button onClick={handleLogout} className={styles.btnPrimary}>
            Logout
          </button>
        </div>

        <p>Logged in as: {email}</p>

        {activeTab === "users" && <UsersTable />}
        {activeTab === "profiles" && <ProfilesTable />}
        {activeTab === "design_profiles" && <DesignProfilesTable />}
        {activeTab === "orders" && <OrdersTable />}
      </main>
    </div>
  );
}
