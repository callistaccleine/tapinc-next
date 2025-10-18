"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/ProfilesTable.module.css";

export default function ProfilesTable() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) console.error("Error loading profiles:", error);
      else setProfiles(data || []);
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const deleteProfile = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) alert("Failed to delete");
    else setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <p>Loading profiles...</p>;

  return (
    <div className={styles.tableContainer}>
      <h3>All Profiles</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Plan</th>
            <th>Title</th>
            <th>Subtitle</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.plan}</td>
              <td>{p.title}</td>
              <td>{p.subtitle}</td>
              <td>{new Date(p.created_at).toLocaleString()}</td>
              <td>
                <button className={styles.deleteBtn} onClick={() => deleteProfile(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
