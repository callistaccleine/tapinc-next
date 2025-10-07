import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Notification = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 10100,
        animation: "slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        maxWidth: "380px",
      }}
    >
      <div
        style={{
          background: "#000000",
          borderRadius: "14px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          padding: "18px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            color: "#000000",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {type === "success" ? "✓" : "✕"}
        </div>
        <div style={{ flex: 1 }}>
          <strong
            style={{
              display: "block",
              fontSize: "15px",
              fontWeight: 500,
              color: "#ffffff",
              marginBottom: "4px",
              lineHeight: 1.4,
              letterSpacing: "-0.2px",
            }}
          >
            {message}
          </strong>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#86868b",
            fontSize: "20px",
            cursor: "pointer",
            padding: 0,
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRadius: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#86868b";
            e.currentTarget.style.background = "none";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;
