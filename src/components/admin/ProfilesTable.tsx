"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/ProfilesTable.module.css";

export default function ProfilesTable() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    setPage(1);
  }, [search, sortDir]);

  const filtered = profiles
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.plan?.toLowerCase().includes(q) ||
        (p.id && String(p.id).toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDir === "desc" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);

  if (loading) return <p>Loading profiles...</p>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div>
          <h3>All Profiles</h3>
          <p className={styles.subhead}>Filter and search profiles</p>
        </div>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search title, subtitle, plan or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}>
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>
      </div>
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
          {pageRows.map((p) => (
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
