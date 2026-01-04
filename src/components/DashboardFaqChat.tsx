"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type FaqItem = {
  q: string;
  a: string;
  actionType?: "spotlight-add-profiles" | "spotlight-edit-profile";
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  actionLabel?: string;
  actionType?: "spotlight-add-profiles" | "spotlight-edit-profile";
};

interface DashboardFaqChatProps {
  onSpotlightAddProfiles?: () => void;
  onSpotlightEditProfile?: () => void;
}

const FAQ_ITEMS: FaqItem[] = [
  { q: "How do I share my card?", a: "Open your profile, tap Share Profile, and let friends scan the QR or copy the link." },
  { q: "Where do I edit my card design?", a: "Hop into Edit Profile → Physical card design to swap colours, logos, and layouts.", actionType: "spotlight-edit-profile" },
  { q: "Can I add more profiles?", a: "Absolutely. Tap + Add profiles in the Profiles tab to spin up a new one.", actionType: "spotlight-add-profiles" },
  { q: "Why can't I see analytics?", a: "We show analytics after your card has a few views/scans. Share it with 15 of your friends!" },
  { q: "Need a human?", a: "Email hello@tapink.com.au and we'll jump in right away." },
];

export default function DashboardFaqChat({ onSpotlightAddProfiles, onSpotlightEditProfile }: DashboardFaqChatProps) {
  const [isChatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro-1",
      role: "bot",
      text: "Hey! I'm INKA, ready to help you with profiles, design, and analytics.",
    },
    {
      id: "intro-2",
      role: "bot",
      text: "Choose a question below and I'll point you in the right direction.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reopenTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("tapink_dashboard_chat_seen_v1");
    if (!seen) {
      setChatOpen(true);
      localStorage.setItem("tapink_dashboard_chat_seen_v1", "true");
    }
  }, []);

  useEffect(() => {
    if (!isChatOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  useEffect(() => {
    return () => {
      if (reopenTimeoutRef.current) {
        window.clearTimeout(reopenTimeoutRef.current);
      }
    };
  }, []);

  const handleQuestionClick = (item: FaqItem) => {
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: item.q },
      {
        id: `bot-${Date.now()}-reply`,
        role: "bot",
        text: item.a,
        actionLabel: item.actionType ? "Show me" : undefined,
        actionType: item.actionType,
      },
    ]);
  };

  const handleShowMe = (actionType: ChatMessage["actionType"]) => {
    setChatOpen(false);
    if (reopenTimeoutRef.current) {
      window.clearTimeout(reopenTimeoutRef.current);
    }
    if (actionType === "spotlight-add-profiles") {
      onSpotlightAddProfiles?.();
    }
    if (actionType === "spotlight-edit-profile") {
      onSpotlightEditProfile?.();
    }
    reopenTimeoutRef.current = window.setTimeout(() => {
      setChatOpen(true);
    }, 1200);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px",
      }}
    >
      {isChatOpen && (
        <div
          style={{
            width: 360,
            maxWidth: "92vw",
            background: "linear-gradient(180deg, #fff7f0 0%, #ffffff 38%, #ffffff 100%)",
            color: "#111827",
            borderRadius: 20,
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
            padding: "16px",
            border: "1px solid #f2e8dd",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#111827",
                  boxShadow: "0 10px 24px rgba(255,106,0,0.35)",
                  border: "1px solid #f2e0d0",
                }}
              >
                <Image src="/images/Tapink-logo.png" alt="TapINK" width={22} height={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>INKA</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Fast answers, with a wink.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                fontSize: 18,
                cursor: "pointer",
              }}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxHeight: 300,
              overflowY: "auto",
              paddingRight: 4,
              marginBottom: 12,
            }}
          >
            {messages.map((message) => {
              const isBot = message.role === "bot";
              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: isBot ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "10px 12px",
                      borderRadius: isBot ? "14px 14px 14px 6px" : "14px 14px 6px 14px",
                      background: isBot ? "#f8f5f2" : "#ff7a1c",
                      color: isBot ? "#111827" : "#ffffff",
                      fontSize: 13,
                      lineHeight: 1.5,
                      boxShadow: isBot ? "none" : "0 8px 18px rgba(255,122,28,0.25)",
                      border: isBot ? "1px solid #f0e6dc" : "none",
                    }}
                  >
                    <div>{message.text}</div>
                    {isBot && message.actionLabel && message.actionType && (
                      <button
                        type="button"
                        onClick={() => {
                          handleShowMe(message.actionType);
                        }}
                        style={{
                          marginTop: 8,
                          border: "none",
                          background: "#ff7a1c",
                          color: "#ffffff",
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {message.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid #efe3d8",
                background: "#ffffff",
              }}
            >
              <input
                type="text"
                placeholder="Pick a question below..."
                disabled
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  fontSize: 12,
                  color: "#6b7280",
                  outline: "none",
                }}
              />
              <button
                type="button"
                disabled
                style={{
                  border: "none",
                  background: "#f3e8dd",
                  color: "#d97706",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: "not-allowed",
                }}
              >
                Send
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FAQ_ITEMS.map((item) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => handleQuestionClick(item)}
                  style={{
                    border: "1px solid #f2e0d0",
                    background: "#fff1e6",
                    color: "#b45309",
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setChatOpen((v) => !v)}
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "none",
          background: isChatOpen
            ? "linear-gradient(135deg, #111827, #0b1220)"
            : "linear-gradient(135deg, #ff8b37, #ff6a00)",
          color: isChatOpen ? "#ff9a4d" : "#ffffff",
          boxShadow: isChatOpen
            ? "0 8px 18px rgba(0,0,0,0.35)"
            : "0 12px 28px rgba(255,106,0,0.35)",
          cursor: "pointer",
          fontSize: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        aria-label="Open TapINK FAQ chat"
      >
        {isChatOpen ? "✖" : "💬"}
      </button>
    </div>
  );
}
