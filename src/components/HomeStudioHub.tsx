import type React from "react";

interface HomeStudioHubProps {
  onSelectVirtual: () => void;
  onSelectPhysical: (type: "paper" | "plastic") => void;
}

const HomeStudioHub: React.FC<HomeStudioHubProps> = ({ onSelectVirtual, onSelectPhysical }) => {
  const tiles = [
    { key: "virtual", title: "Virtual", subtitle: "Digital Cards", icon: "💳" },
    { key: "paper", title: "Paper", subtitle: "Premium Stock", icon: "📄" },
    { key: "plastic", title: "Plastic", subtitle: "PVC / PET", icon: "💎" },
    { key: "metal", title: "Metal", subtitle: "Stainless / Brass", icon: "✨" },
    { key: "gift", title: "Gift", subtitle: "Retail Ready", icon: "🎁" },
    { key: "business", title: "Business", subtitle: "Professional", icon: "👤" },
    { key: "loyalty", title: "Loyalty", subtitle: "Member Cards", icon: "🎫" },
    { key: "custom", title: "Custom", subtitle: "Bespoke", icon: "⊞" },
  ] as const;

  return (
    <div
      style={{
        maxWidth: "1320px",
        margin: "0 auto",
        color: "#f7f7f7",
        background:
          "radial-gradient(circle at 20% 20%, rgba(255,107,53,0.08), transparent 32%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.05), transparent 28%), #0c0c0d",
        borderRadius: "18px",
        padding: "48px 48px 64px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        {["Studio", "Templates", "Assets", "Archive"].map((pill, idx) => (
          <button
            key={pill}
            type="button"
            style={{
              background: idx === 0 ? "linear-gradient(135deg, #ff6b35, #ff8c4a)" : "rgba(255,255,255,0.06)",
              color: idx === 0 ? "#0c0c0d" : "#d7d7d7",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "999px",
              padding: "10px 18px",
              fontSize: "12px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: idx === 0 ? "0 10px 24px rgba(255,107,53,0.35)" : "none",
            }}
          >
            {pill}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "48px" }}>
        <h1
          style={{
            fontSize: "54px",
            fontWeight: 300,
            letterSpacing: "-1px",
            marginBottom: "10px",
            background: "linear-gradient(135deg, #ffffff 0%, #ff6b35 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 10px 30px rgba(0,0,0,0.45)",
          }}
        >
          Craft. Design. Deliver.
        </h1>
        <p style={{ fontSize: "12px", letterSpacing: "3px", color: "#aaaaaa" }}>PRECISION CARD DESIGN STUDIO</p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 14px",
          borderRadius: "10px",
          marginBottom: "36px",
        }}
      >
        <span style={{ fontSize: "14px", opacity: 0.6 }}>⌕</span>
        <input
          placeholder="Search your work"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#f0f0f0",
            outline: "none",
            fontSize: "14px",
          }}
        />
        <button
          type="button"
          style={{
            background: "linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,140,74,0.25))",
            color: "#ffb389",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "11px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Filter
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "54px",
        }}
      >
        {tiles.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (item.key === "virtual") {
                onSelectVirtual();
              } else if (item.key === "paper" || item.key === "plastic") {
                onSelectPhysical(item.key);
              }
            }}
            style={{
              aspectRatio: "1",
              background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s",
              position: "relative",
              color: "#f5f5f5",
              boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "16px",
                filter: "grayscale(40%)",
                opacity: 0.85,
              }}
            >
              {item.icon}
            </div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#ffffff",
                fontWeight: 600,
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontSize: "9px",
                color: "#c4c4c4",
                marginTop: "6px",
                letterSpacing: "1px",
              }}
            >
              {item.subtitle}
            </div>
          </button>
        ))}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            paddingBottom: "14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 500,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#ffffff",
            }}
          >
            Recent Work
          </h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              style={{
                padding: "8px 14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "1px",
                color: "#e8e8e8",
              }}
            >
              Filter
            </button>
            <button
              type="button"
              style={{
                padding: "8px 14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "1px",
                color: "#e8e8e8",
              }}
            >
              Sort
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              style={{
                background: "linear-gradient(155deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                transition: "all 0.25s",
                boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
              }}
            >
              <div
                style={{
                  height: "180px",
                  background: `linear-gradient(135deg, rgba(255,107,53,0.${idx + 2}), rgba(255,140,74,0.${idx + 3}))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "42px",
                  color: "#fff",
                }}
              >
                💳
              </div>
              <div style={{ padding: "16px 18px 18px" }}>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "8px",
                    fontSize: "14px",
                    letterSpacing: "0.4px",
                    color: "#ffffff",
                  }}
                >
                  Design Project {idx}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#bfbfbf",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {idx}D ago
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    fontSize: "9px",
                    fontWeight: 700,
                    marginTop: "10px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    background: "rgba(255, 107, 53, 0.16)",
                    color: "#ffc8aa",
                    border: "1px solid rgba(255, 107, 53, 0.3)",
                  }}
                >
                  Virtual
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeStudioHub;
