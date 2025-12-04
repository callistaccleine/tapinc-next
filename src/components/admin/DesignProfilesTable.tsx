"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/DesignProfilesTable.module.css";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DesignProfilesTable() {
  const [designProfiles, setDesignProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    setPage(1);
  }, [search, sortDir]);

  const filtered = designProfiles
    .filter((d) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.firstname?.toLowerCase().includes(q) ||
        d.company?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        (d.profile_id && String(d.profile_id).toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return sortDir === "desc" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);

  if (loading) return <LoadingSpinner label="Loading design profiles..." fullscreen={false} />;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div>
          <h3>All Design Profiles</h3>
          <p className={styles.subhead}>Search by name, company, email or profile ID</p>
        </div>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search design profiles"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}>
            <option value="desc">Latest update</option>
            <option value="asc">Oldest update</option>
          </select>
        </div>
      </div>
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
          {pageRows.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.profile_id}</td>
              <td>{d.firstname}</td>
              <td>{d.company}</td>
              <td>{d.email}</td>
              <td>{new Date(d.updated_at).toLocaleString()}</td>
              <td className={styles.actions}>
                <button
                  className={styles.deleteBtn}
                  onClick={() => deleteDesignProfile(d.id)}
                >
                  Delete
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
    </div>
  );
}
