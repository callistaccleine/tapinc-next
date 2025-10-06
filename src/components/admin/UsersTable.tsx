"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/admin/UsersTable.module.css";

interface SupabaseUser {
  id: string;
  email: string | null;
  user_metadata?: Record<string, any>;
  created_at: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className={styles.loading}>Loading users...</div>;

  if (users.length === 0)
    return (
      <div className={styles.noResults}>
        <h3>No Users Found</h3>
        <p>No registered users in authentication.</p>
      </div>
    );

  return (
    <div className={styles.tableContainer}>
      <h3>Registered Users</h3>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>UID</th>
            <th>Email</th>
            <th>Display Name</th>
            <th>Created At</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email ?? "—"}</td>
              <td>{user.user_metadata?.full_name || "—"}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
