"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/admin/UsersTable.module.css";
import LoadingSpinner from "@/components/LoadingSpinner";

interface SupabaseUser {
  id: string;
  email: string | null;
  phone?: string | null;
  user_metadata?: Record<string, any>;
  created_at: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "role-az" | "role-za">(
    "newest"
  );
  const [page, setPage] = useState(1);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch users");
        setUsers(data.users ?? []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  const filtered = users
    .filter((u) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      const name = u.user_metadata?.full_name?.toLowerCase() || "";
      const email = (u.email || "").toLowerCase();
      const role = (u.user_metadata?.role || "").toLowerCase();
      return (
        name.includes(query) ||
        email.includes(query) ||
        role.includes(query) ||
        u.id.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      const roleA = (a.user_metadata?.role || "").toLowerCase();
      const roleB = (b.user_metadata?.role || "").toLowerCase();

      switch (sortBy) {
        case "oldest":
          return dateA - dateB;
        case "role-az":
          return roleA.localeCompare(roleB);
        case "role-za":
          return roleB.localeCompare(roleA);
        case "newest":
        default:
          return dateB - dateA;
      }
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);

  const handleSendCode = async (user: SupabaseUser) => {
    const phone = user.phone || (user.user_metadata?.phone as string | undefined);
    if (!phone) {
      setToast("User has no phone number on record.");
      return;
    }
    try {
      setSendingId(user.id);
      setToast(null);
      const res = await fetch("/api/admin/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, userId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send code");
      }
      setToast(`Code sent to ${phone}`);
    } catch (err: any) {
      console.error("Send code error:", err);
      setToast(err.message || "Failed to send code");
    } finally {
      setSendingId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading users..." fullscreen={false} />;

  if (filtered.length === 0)
    return (
      <div className={styles.noResults}>
        <h3>No Users Found</h3>
        <p>No registered users in authentication.</p>
      </div>
    );

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div>
          <h3>Registered Users</h3>
          <p className={styles.subhead}>Supabase Auth users</p>
        </div>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search by email, name, or UID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "oldest" | "role-az" | "role-za")
            }
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="role-az">Role A → Z</option>
            <option value="role-za">Role Z → A</option>
          </select>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>UID</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Display Name</th>
            <th>Role</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {pageRows.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email ?? "—"}</td>
              <td>{user.phone || user.user_metadata?.phone || "—"}</td>
              <td>{user.user_metadata?.full_name || "—"}</td>
              <td>{user.user_metadata?.role || "—"}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className={styles.sendCodeBtn}
                  onClick={() => handleSendCode(user)}
                  disabled={sendingId === user.id}
                >
                  {sendingId === user.id ? "Sending..." : "Send code"}
                </button>
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
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
