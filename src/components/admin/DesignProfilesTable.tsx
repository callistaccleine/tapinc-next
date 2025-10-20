"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/DesignProfilesTable.module.css";

export default function DesignProfilesTable() {
  const [designProfiles, setDesignProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesignProfiles = async () => {
      const { data, error } = await supabase.from("design_profile").select("*");
      if (error) console.error("Error loading design profiles:", error);
      else setDesignProfiles(data || []);
      setLoading(false);
    };
    fetchDesignProfiles();
  }, []);

  const deleteDesignProfile = async (id: string) => {
    const { error } = await supabase.from("design_profile").delete().eq("id", id);
    if (error) alert("Failed to delete");
    else setDesignProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <p>Loading design profiles...</p>;

  return (
    <div className={styles.tableContainer}>
      <h3>All Design Profiles</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Profile ID</th>
            <th>First Name</th>
            <th>Company</th>
            <th>Email</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {designProfiles.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.profile_id}</td>
              <td>{d.firstname}</td>
              <td>{d.company}</td>
              <td>{d.email}</td>
              <td>{new Date(d.updated_at).toLocaleString()}</td>
              <td>
                <button onClick={() => deleteDesignProfile(d.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
