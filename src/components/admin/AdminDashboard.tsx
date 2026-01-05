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
import ContactSubmissionsTable from "./ContactSubmissionsTable";
import AdminDataTable from "./AdminDataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import AdminEmailPanel from "./AdminEmailPanel";

type TabKey =
  | "auth"
  | "users"
  | "profiles"
  | "email"
  | "design_profiles"
  | "contact_submissions"
  | "work_orders"
  | "orders"
  | "addons"
  | "analytics"
  | "contacts"
  | "order_items"
  | "plans"
  | "product_addons"
  | "products"
  | "subscriptions";

type DataTabKey = Exclude<
  TabKey,
  "auth" | "profiles" | "design_profiles" | "orders" | "email"
>;

type TabConfig = {
  key: TabKey;
  label: string;
};

interface Props {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  primaryTabs: TabConfig[];
  moreTabs: TabConfig[];
}

const primaryTabs: { key: TabKey; label: string }[] = [
  { key: "auth", label: "Auth" },
  { key: "users", label: "Users" },
  { key: "profiles", label: "Profiles" },
  { key: "email", label: "Email" },
  { key: "design_profiles", label: "Design Profiles" },
  { key: "contact_submissions", label: "Contact Submissions" },
  { key: "work_orders", label: "Work Orders" },
];

const moreTabs: { key: TabKey; label: string }[] = [
  { key: "orders", label: "Orders" },
  { key: "addons", label: "Addons" },
  { key: "analytics", label: "Analytics" },
  { key: "contacts", label: "Contacts" },
  { key: "order_items", label: "Order Items" },
  { key: "plans", label: "Plans" },
  { key: "product_addons", label: "Product Addons" },
  { key: "products", label: "Products" },
  { key: "subscriptions", label: "Subscriptions" },
];

const dataTabConfig: Record<
  DataTabKey,
  {
    table: string;
    title: string;
    description?: string;
    orderBy?: string;
    orderDescending?: boolean;
  }
> = {
  addons: {
    table: "addons",
    title: "Addons",
  },
  analytics: {
    table: "analytics",
    title: "Analytics",
    description: "Events and engagement records",
    orderBy: "created_at",
  },
  contact_submissions: {
    table: "contact_submissions",
    title: "Contact Submissions",
    description: "Messages sent via the contact form",
    orderBy: "created_at",
  },
  contacts: {
    table: "contacts",
    title: "Contacts",
    description: "Saved contact imports",
    orderBy: "created_at",
  },
  order_items: {
    table: "order_items",
    title: "Order Items",
    description: "Line items attached to orders",
    orderBy: "created_at",
  },
  plans: {
    table: "plans",
    title: "Plans",
    description: "Pricing plans and attributes",
  },
  product_addons: {
    table: "product_addons",
    title: "Product Addons",
  },
  products: {
    table: "products",
    title: "Products",
    orderBy: "created_at",
  },
  subscriptions: {
    table: "subscriptions",
    title: "Subscriptions",
    orderBy: "created_at",
  },
  work_orders: {
    table: "work_orders",
    title: "Work Orders",
    orderBy: "created_at",
  },
  users: {
    table: "users",
    title: "Users",
    description: "Users table from the database",
    orderBy: "created_at",
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTabState] = useState<TabKey>("auth");
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      if (userEmail === "tapinc.io.au@gmail.com" || userEmail === "hello@tapink.com.au") {
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

  if (isAdmin === null) return <LoadingSpinner label="Loading admin dashboard..." fullscreen={false} />;
  if (!isAdmin) return <p>Redirecting...</p>;

  const renderActiveTab = () => {
    switch (activeTab) {
      case "auth":
        return <UsersTable />;
      case "profiles":
        return <ProfilesTable />;
      case "design_profiles":
        return <DesignProfilesTable />;
      case "contact_submissions":
        return <ContactSubmissionsTable />;
      case "email":
        return <AdminEmailPanel />;
      case "orders":
        return <OrdersTable />;
      default: {
        const dataTabKey = activeTab as DataTabKey;
        const config = dataTabConfig[dataTabKey];
        return (
          <AdminDataTable
            table={config.table}
            title={config.title}
            description={config.description}
            orderBy={config.orderBy}
            orderDescending={config.orderDescending}
          />
        );
      }
    }
  };

  return (
    <div className={styles.adminDashboard}>
      <div className={`${styles.sidebarWrap} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTabState(tab);
            setSidebarOpen(false);
          }}
          primaryTabs={primaryTabs}
          moreTabs={moreTabs}
          email={email}
          onLogout={handleLogout}
        />
      </div>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      <main className={styles.mainContent}>
        <div className={styles.dashboardHeader}>
          <button
            className={styles.mobileMenuBtn}
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle admin menu"
          >
            ☰
          </button>
          <h2>Admin Dashboard</h2>
        </div>

        {renderActiveTab()}
      </main>
    </div>
  );
}
