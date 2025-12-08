"use client";

import { useState } from "react";

export default function AdminEmailPanel() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [allEmails, setAllEmails] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus(null);
    setError(null);
    setSending(true);
    try {
      const parsedRecipients = recipients
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, recipients: parsedRecipients, sendToAll }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to send emails");

      setStatus(data?.info || "Email(s) queued");
      setSubject("");
      setMessage("");
      setRecipients("");
      setSendToAll(false);
    } catch (err: any) {
      setError(err?.message || "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  const handleLoadAllRecipients = async () => {
    setStatus(null);
    setError(null);
    setRecipientsLoading(true);
    try {
      const response = await fetch("/api/admin/email/recipients");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load recipients");
      const joined = (data?.emails || []).join(", ");
      setRecipients(joined);
      setAllEmails(data?.emails || []);
      setStatus(`Loaded ${data?.count ?? (data?.emails?.length || 0)} recipient(s)`);
    } catch (err: any) {
      setError(err?.message || "Failed to load recipients");
    } finally {
      setRecipientsLoading(false);
    }
  };

  const ensureEmailsLoaded = async () => {
    if (allEmails.length || recipientsLoading) return;
    await handleLoadAllRecipients();
  };

  const toggleEmailSelection = (email: string) => {
    setRecipients((prev) => {
      const current = prev
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter(Boolean);
      const exists = current.includes(email);
      const next = exists ? current.filter((e) => e !== email) : [...current, email];
      return next.join(", ");
    });
  };

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: "16px",
        padding: "22px",
        color: "#e5e7eb",
        boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
        border: "1px solid rgba(255,255,255,0.08)",
        maxWidth: "860px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.01em" }}>Send email</h3>
          <p style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: "14px" }}>
            Send an individual or bulk email using your configured SMTP.
          </p>
        </div>
        <span style={{ padding: "6px 10px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", fontSize: "12px", color: "#a5b4fc" }}>
          From: {process.env.NEXT_PUBLIC_SENDER ?? "tapinc.io.au@gmail.com"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginTop: "18px",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#cbd5e1" }}>
          Subject
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Project update, product launch, etc."
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.03)",
              color: "#f8fafc",
              fontSize: "14px",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#cbd5e1", position: "relative" }}>
          Recipients
          <textarea
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="user1@example.com, user2@example.com"
            rows={4}
            disabled={sendToAll}
            onFocus={() => {
              setDropdownOpen(true);
              ensureEmailsLoaded();
            }}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 120)}
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.16)",
              background: sendToAll ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
              color: "#f8fafc",
              fontSize: "14px",
              minHeight: "90px",
            }}
          />
          {!sendToAll && dropdownOpen && (
            <div
              style={{
                position: "absolute",
                zIndex: 10,
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "6px",
                background: "#0b1224",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
                maxHeight: "220px",
                overflowY: "auto",
                padding: "8px",
              }}
            >
              {recipientsLoading && (
                <div style={{ color: "#cbd5e1", fontSize: "13px", padding: "6px 8px" }}>Loading...</div>
              )}
              {!recipientsLoading && allEmails.length === 0 && (
                <div style={{ color: "#cbd5e1", fontSize: "13px", padding: "6px 8px" }}>
                  No emails loaded
                </div>
              )}
              {allEmails.map((email) => {
                const selected = recipients.split(/[,\n]/).map((e) => e.trim()).filter(Boolean).includes(email);
                return (
                  <label
                    key={email}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: selected ? "rgba(99,102,241,0.12)" : "transparent",
                      color: "#e2e8f0",
                      fontSize: "13px",
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleEmailSelection(email)}
                      style={{ width: "16px", height: "16px", accentColor: "#6366f1" }}
                    />
                    <span style={{ wordBreak: "break-all" }}>{email}</span>
                  </label>
                );
              })}
            </div>
          )}
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
              color: "#cbd5e1",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              width: "fit-content",
            }}
          >
            <input
              type="checkbox"
              checked={sendToAll}
              onChange={(e) => setSendToAll(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "#6366f1",
                borderRadius: "6px",
              }}
            />
            <span style={{ color: "#e2e8f0", fontSize: "13px" }}>Send to all users</span>
          </label>
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#cbd5e1", marginTop: "14px" }}>
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your email message"
          rows={10}
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.03)",
            color: "#f8fafc",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        />
      </label>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
        {status && <span style={{ color: "#22c55e", fontSize: "13px" }}>{status}</span>}
        {error && <span style={{ color: "#ef4444", fontSize: "13px" }}>{error}</span>}
      </div>

      <div style={{ marginTop: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={sending || (!sendToAll && !recipients.trim()) || !subject.trim() || !message.trim()}
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            border: "none",
            background: sending ? "#9ca3af" : "linear-gradient(135deg,#6366f1,#0ea5e9)",
            color: "#ffffff",
            fontWeight: 800,
            cursor: sending ? "not-allowed" : "pointer",
            boxShadow: "0 14px 30px rgba(99,102,241,0.25)",
          }}
        >
          {sending ? "Sending..." : "Send email"}
        </button>
        <span style={{ color: "#94a3b8", fontSize: "13px" }}>
          Tip: use comma or newline to list multiple recipients when bulk toggle is off.
        </span>
      </div>
    </div>
  );
}
