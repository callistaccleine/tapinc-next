"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin/ContactSubmissionsTable.module.css";

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  category?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  replied_at?: string;
  admin_reply?: string;
}

export default function ContactSubmissionsTable() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const activeSubmission = useMemo(
    () => submissions.find((s) => s.id === activeReplyId) || null,
    [submissions, activeReplyId]
  );
  const pageSize = 10;

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("contact_submissions")
          .select("*")
          .order("created_at", { ascending: false });
        if (fetchError) throw fetchError;
        setSubmissions(data as Submission[] ?? []);
      } catch (err: any) {
        setError(err?.message || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, sortDir]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return submissions
      .filter((s) => {
        if (!query) return true;
        return (
          s.name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.category?.toLowerCase().includes(query) ||
          s.message?.toLowerCase().includes(query) ||
          s.id?.toString().toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return sortDir === "desc" ? bDate - aDate : aDate - bDate;
      });
  }, [submissions, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);

  const handleStartReply = (id: string, preset?: string) => {
    setActiveReplyId(id);
    setReplyText(preset ?? "");
    setSuccessMsg(null);
  };

  const handleSendReply = async (submission: Submission) => {
    if (!replyText.trim()) {
      setError("Reply message cannot be empty.");
      return;
    }
    setSendingId(submission.id);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/contact-submissions/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submission.id,
          to: submission.email,
          name: submission.name,
          category: submission.category,
          replyMessage: replyText,
          originalMessage: submission.message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send reply");

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id
            ? {
                ...s,
                status: "Replied",
                admin_reply: replyText,
                replied_at: new Date().toISOString(),
              }
            : s
        )
      );
      setActiveReplyId(null);
      setReplyText("");
      setSuccessMsg("Reply sent successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to send reply.");
    } finally {
      setSendingId(null);
    }
  };

  if (loading) return <div className={styles.state}>Loading contact submissions…</div>;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div>
          <h3>Contact Submissions</h3>
          <p className={styles.subhead}>Reply directly without leaving the admin</p>
        </div>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search name, email, category, message"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}>
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <div className={styles.scrollArea}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Category</th>
              <th>Message</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.category || "—"}</td>
                <td className={styles.messageCell} title={s.message}>
                  {s.message?.slice(0, 80)}
                  {s.message && s.message.length > 80 ? "…" : ""}
                </td>
                <td>
                  <span
                    className={`${styles.status} ${
                      s.status?.toLowerCase() === "replied" ? styles.statusDone : styles.statusPending
                    }`}
                  >
                    {s.status || "Pending"}
                  </span>
                </td>
                <td>{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => handleStartReply(s.id, `Hi ${s.name || ""},\n\n`)}
                  >
                    Reply
                  </button>
                  <button
                    className={styles.ghostBtn}
                    onClick={() => alert(s.message || "No message")}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {activeReplyId && (
      <div className={styles.replyBox}>
        <div className={styles.replyHeader}>
          <div>
            <div className={styles.replyTitle}>Reply to submission #{activeReplyId}</div>
            <div className={styles.replySub}>
              Sending to: <strong>{activeSubmission?.email || "No email provided"}</strong>
              {activeSubmission?.name ? ` (${activeSubmission.name})` : ""}
              {activeSubmission?.category ? ` • ${activeSubmission.category}` : ""}
            </div>
            {activeSubmission?.message && (
              <div className={styles.replyOriginal}>
                <span>Original message:</span>
                <p>{activeSubmission.message}</p>
              </div>
            )}
          </div>
          <button className={styles.closeBtn} onClick={() => setActiveReplyId(null)}>
            Close
          </button>
        </div>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
          />
          <div className={styles.replyActions}>
            <button
              className={styles.sendBtn}
              onClick={() => {
                const submission = submissions.find((s) => s.id === activeReplyId);
                if (submission) handleSendReply(submission);
              }}
              disabled={sendingId === activeReplyId || !activeSubmission?.email}
            >
              {sendingId === activeReplyId ? "Sending..." : "Send Reply"}
            </button>
            <button className={styles.cancelBtn} onClick={() => setActiveReplyId(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
