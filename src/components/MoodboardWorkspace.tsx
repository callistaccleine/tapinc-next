import { useState, useRef, useEffect, type ChangeEvent } from "react";

type MoodboardItemType = "card-size" | "template" | "palette" | "text" | "image";

interface MoodboardItem {
  id: string;
  type: MoodboardItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: Record<string, unknown>;
}

const moodboardSwatches = ["#ff6b35", "#ffb347", "#ffe0c2", "#0f172a", "#111827", "#f3f4f6", "#1d4ed8", "#22c55e"];

const newId = () => Math.random().toString(36).slice(2, 10);

const MoodboardWorkspace = () => {
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [zoom, setZoom] = useState(0.75);
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const boardClientToCoords = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  const addItem = (type: MoodboardItemType, x: number, y: number) => {
    const baseData: Record<string, unknown> = {};
    if (type === "card-size") baseData.selected = "plastic";
    if (type === "template") baseData.selected = "template1";
    if (type === "palette") baseData.selected = moodboardSwatches[0];
    if (type === "text") baseData.text = "Add notes here";
    if (type === "image") baseData.label = "Upload logo / image";

    setItems((prev) => [
      ...prev,
      {
        id: newId(),
        type,
        x,
        y,
        width: 280,
        height: type === "text" ? 200 : 180,
        data: baseData,
      },
    ]);
  };

  const handleSidebarDragStart = (type: MoodboardItemType, event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleBoardDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("text/plain") as MoodboardItemType | "";
    if (!type) return;
    const { x, y } = boardClientToCoords(event.clientX, event.clientY);
    addItem(type, x - 20, y - 20);
  };

  const handleBoardDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const updateItem = (id: string, updates: Partial<MoodboardItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, data: { ...item.data, ...updates.data } } : item))
    );
  };

  const startDraggingItem = (id: string, clientX: number, clientY: number) => {
    const { x, y } = boardClientToCoords(clientX, clientY);
    const target = items.find((item) => item.id === id);
    if (!target) return;
    setDragging({
      id,
      offsetX: x - target.x,
      offsetY: y - target.y,
    });
  };

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!dragging) return;
      const { x, y } = boardClientToCoords(event.clientX, event.clientY);
      updateItem(dragging.id, {
        x: x - dragging.offsetX,
        y: y - dragging.offsetY,
      });
    };
    const stopDrag = () => setDragging(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [dragging, zoom, items]);

  const handleExport = () => {
    if (!boardRef.current) return;
    const html = boardRef.current.outerHTML;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "moodboard.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderItem = (item: MoodboardItem) => {
    const baseCardStyle: React.CSSProperties = {
      width: item.width,
      height: item.height,
      background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))",
      border: "1px solid rgba(255,107,53,0.2)",
      borderRadius: 14,
      boxShadow: "0 10px 24px rgba(255,107,53,0.18)",
      color: "#0f172a",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      cursor: "grab",
      backdropFilter: "blur(4px)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    };

    const headerStyle: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "12px",
      letterSpacing: "1px",
      textTransform: "uppercase",
      color: "#6b7280",
    };

    const title = (label: string) => (
      <div style={headerStyle}>
        <span>{label}</span>
        <span style={{ opacity: 0.6 }}>⋮</span>
      </div>
    );

    if (item.type === "card-size") {
      const selected = (item.data?.selected as string) || "plastic";
      const options = [
        { key: "plastic", label: "Plastic", desc: "86x54mm" },
        { key: "paper", label: "Paper", desc: "89x51mm" },
        { key: "metal", label: "Metal", desc: "Stainless / Brass" },
      ];
      return (
        <div
          style={baseCardStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            startDraggingItem(item.id, e.clientX, e.clientY);
          }}
        >
          {title("Card Size")}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => updateItem(item.id, { data: { selected: opt.key } })}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: selected === opt.key ? "linear-gradient(135deg, #ff6b35, #ff8c4a)" : "#fff7ef",
                  border: `1px solid ${selected === opt.key ? "rgba(255,107,53,0.6)" : "rgba(255,107,53,0.25)"}`,
                  color: "#0f172a",
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                  boxShadow: selected === opt.key ? "0 8px 16px rgba(255,107,53,0.22)" : "none",
                }}
              >
                <span>{opt.label}</span>
                <span style={{ opacity: selected === opt.key ? 0.7 : 0.6 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (item.type === "template") {
      const selected = (item.data?.selected as string) || "template1";
      const templates = [
        { key: "template1", name: "Virtual Template A" },
        { key: "template2", name: "Virtual Template B" },
        { key: "template3", name: "Virtual Template C" },
      ];
      return (
        <div
          style={baseCardStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            startDraggingItem(item.id, e.clientX, e.clientY);
          }}
        >
          {title("Virtual Templates")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {templates.map((tpl, idx) => (
              <button
                key={tpl.key}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => updateItem(item.id, { data: { selected: tpl.key } })}
                style={{
                  height: 72,
                  borderRadius: 10,
                  border: selected === tpl.key ? "2px solid #ffb347" : "1px solid rgba(255,107,53,0.2)",
                  background: `linear-gradient(135deg, rgba(255,107,53,0.${idx + 3}), rgba(255,240,229,0.9))`,
                  color: "#0f172a",
                  fontSize: "11px",
                  letterSpacing: "0.4px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: selected === tpl.key ? "0 10px 20px rgba(255,107,53,0.2)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "6px",
                }}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (item.type === "palette") {
      const selected = (item.data?.selected as string) || moodboardSwatches[0];
      return (
        <div
          style={baseCardStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            startDraggingItem(item.id, e.clientX, e.clientY);
          }}
        >
          {title("Color Palette")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {moodboardSwatches.map((color) => (
              <button
                key={color}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => updateItem(item.id, { data: { selected: color } })}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  border: selected === color ? "2px solid #ff6b35" : "1px solid rgba(255,107,53,0.25)",
                  background: color,
                  cursor: "pointer",
                  boxShadow: selected === color ? "0 8px 18px rgba(255,107,53,0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (item.type === "text") {
      const text = (item.data?.text as string) || "";
      return (
        <div
          style={baseCardStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            startDraggingItem(item.id, e.clientX, e.clientY);
          }}
        >
          {title("Notes")}
          <textarea
            value={text}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => updateItem(item.id, { data: { text: e.target.value } })}
            style={{
              flex: 1,
              width: "100%",
              resize: "none",
              background: "#fff7ef",
              border: "1px solid rgba(255,107,53,0.2)",
              borderRadius: 10,
              color: "#0f172a",
              padding: "10px",
              outline: "none",
              fontSize: "13px",
              lineHeight: 1.4,
            }}
          />
        </div>
      );
    }

    const preview = item.data?.preview as string | undefined;
    const label = (item.data?.label as string) || "Upload logo / image";
    return (
      <div
        style={baseCardStyle}
        onMouseDown={(e) => {
          e.stopPropagation();
          startDraggingItem(item.id, e.clientX, e.clientY);
        }}
      >
        {title("Image / Logo")}
        <label
          style={{
            display: "block",
            background: "#fff7ef",
            border: "1px dashed rgba(255,107,53,0.3)",
            borderRadius: 12,
            padding: "12px",
            textAlign: "center",
            cursor: "pointer",
            color: "#0f172a",
            fontSize: "12px",
            letterSpacing: "0.5px",
          }}
        >
          {label}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                updateItem(item.id, { data: { preview: reader.result, label: file.name } });
              };
              reader.readAsDataURL(file);
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </label>
        {preview && (
          <div
            style={{
              marginTop: "10px",
              height: 90,
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(255,107,53,0.18)",
              background: "#ffffff",
            }}
          >
            <img src={preview} alt="upload preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "90vh",
        background: "#ffffff",
        color: "#1f2937",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 18px 40px rgba(0,0,0,0.05)",
      }}
    >
      {/* Floating drag & drop modal */}
      <div
        style={{
          position: "fixed",
          top: "18px",
          left: "18px",
          width: "220px",
          zIndex: 20,
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 14,
          padding: "12px",
          boxShadow: "0 10px 24px rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#ff6b35",
              marginBottom: "4px",
            }}
          >
            Drag & Drop
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Moodboard Modules</div>
          <p style={{ color: "#4b5563", fontSize: "12px", marginTop: "4px" }}>
            Pull modules onto the infinite grid canvas to map your ideas.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { key: "card-size", title: "Card Size", desc: "Plastic / Paper / Metal", accent: "#ff6b35" },
            { key: "template", title: "Virtual Templates", desc: "Pick digital layouts", accent: "#ffb347" },
            { key: "palette", title: "Color Palette", desc: "Brand swatches", accent: "#f59e0b" },
            { key: "text", title: "Notes", desc: "Ideas & copy blocks", accent: "#22c55e" },
            { key: "image", title: "Logo / Image", desc: "Upload assets", accent: "#60a5fa" },
          ].map((module) => (
            <div
              key={module.key}
              draggable
              onDragStart={(e) => handleSidebarDragStart(module.key as MoodboardItemType, e)}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: "10px",
                cursor: "grab",
                transition: "transform 0.2s ease, border-color 0.2s ease",
                boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, letterSpacing: "0.6px", color: "#0f172a" }}>{module.title}</div>
                  <div style={{ color: "#4b5563", fontSize: "12px" }}>{module.desc}</div>
                </div>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: module.accent,
                    boxShadow: `0 0 0 6px ${module.accent}22`,
                  }}
                />
              </div>
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#6b7280" }}>Drag into canvas</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          height: "100%",
          minHeight: "90vh",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.3) 1px, rgba(0,0,0,0) 0)",
          backgroundSize: "24px 24px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            gap: "8px",
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
            style={{
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,107,53,0.18)",
            background: "#ffffff",
            color: "#0f172a",
            cursor: "pointer",
          }}
        >
          −
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
            style={{
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,107,53,0.18)",
            background: "#ffffff",
            color: "#0f172a",
            cursor: "pointer",
          }}
        >
          +
          </button>
          <button
            type="button"
            onClick={() => setZoom(0.75)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #ff6b35, #ff8c4a)",
              color: "#0c0c0d",
              cursor: "pointer",
              fontWeight: 700,
              letterSpacing: "0.6px",
              boxShadow: "0 10px 24px rgba(255,107,53,0.25)",
            }}
          >
            Reset
          </button>
        </div>

        <div
          ref={boardRef}
          onDrop={handleBoardDrop}
          onDragOver={handleBoardDragOver}
          style={{
            position: "relative",
            minWidth: 6000,
            minHeight: 4000,
            width: "100%",
            height: "100%",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            transition: "transform 0.15s ease",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                userSelect: "none",
              }}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleExport}
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          background: "linear-gradient(135deg, #ff6b35, #ff8c4a)",
          color: "#0c0c0d",
          border: "none",
          borderRadius: 999,
          padding: "14px 18px",
          fontWeight: 800,
          letterSpacing: "0.8px",
          cursor: "pointer",
          boxShadow: "0 18px 40px rgba(255,107,53,0.35)",
          zIndex: 20,
        }}
      >
        Export Moodboard
      </button>
    </div>
  );
};

export default MoodboardWorkspace;
