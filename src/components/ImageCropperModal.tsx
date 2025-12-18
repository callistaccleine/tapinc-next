"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, convertToPixelCrop, makeAspectCrop } from "react-image-crop";
import { canvasPreview } from "../utils/canvasPreview";

import "react-image-crop/dist/ReactCrop.css";

type CropperProps = {
  file: File;
  aspectRatio?: number;
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function ImageCropperModal({ file, aspectRatio, onCancel, onComplete }: CropperProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(760);
  const [viewportHeight, setViewportHeight] = useState(520);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [lockAspect, setLockAspect] = useState<number | undefined>(undefined);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, [file]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const maxWidth = 820;
      const targetWidth = Math.min(width, maxWidth);
      const targetHeight = Math.min(540, Math.max(380, targetWidth * 0.66));
      setViewportWidth(targetWidth);
      setViewportHeight(targetHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const buildInitialCrop = useCallback(
    (inputWidth?: number, inputHeight?: number): PixelCrop | undefined => {
      const width = inputWidth ?? naturalSize.width;
      const height = inputHeight ?? naturalSize.height;
      if (!width || !height) return undefined;
      const aspect = lockAspect ?? (aspectRatio && aspectRatio > 0 ? aspectRatio : undefined);
      if (aspect) {
        const percentCrop = centerCrop(
          makeAspectCrop(
            {
              unit: "%",
              width: 90,
            },
            aspect,
            width,
            height
          ),
          width,
          height
        );
        return convertToPixelCrop(percentCrop, width, height);
      }
      const baseWidth = width * 0.8;
      const baseHeight = height * 0.8;
      return {
        unit: "px",
        x: (width - baseWidth) / 2,
        y: (height - baseHeight) / 2,
        width: baseWidth,
        height: baseHeight,
      };
    },
    [aspectRatio, lockAspect, naturalSize.height, naturalSize.width]
  );

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = event.currentTarget;
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    setNaturalSize({ width, height });
    const initial = buildInitialCrop(width, height);
    if (initial) {
      setCrop(initial);
      setCompletedCrop(initial);
      return;
    }
    const fallback: PixelCrop = {
      unit: "px",
      x: width * 0.1,
      y: height * 0.1,
      width: width * 0.8,
      height: height * 0.8,
    };
    setCrop(fallback);
    setCompletedCrop(fallback);
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imageRef.current) return;
    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    let outputWidth = Math.round(completedCrop.width * scaleX);
    let outputHeight = Math.round(completedCrop.height * scaleY);
    const maxOutput = 2400;
    const scaleDown = Math.min(1, maxOutput / Math.max(outputWidth, outputHeight));
    outputWidth = Math.max(1, Math.round(outputWidth * scaleDown));
    outputHeight = Math.max(1, Math.round(outputHeight * scaleDown));

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );
    canvas.toBlob((blob) => {
      if (blob) onComplete(blob);
    }, "image/png");
  };

  const previewScale = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return 1;
    const wScale = viewportWidth / naturalSize.width;
    const hScale = viewportHeight / naturalSize.height;
    return clamp(Math.min(wScale, hScale), 0.01, 1);
  }, [naturalSize.height, naturalSize.width, viewportHeight, viewportWidth]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "min(96vw, 900px)",
          background: "#ffffff",
          borderRadius: 18,
          padding: "18px 18px 20px",
          boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
          color: "#0f172a",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Crop your image</h3>
            <p style={{ margin: "4px 0 0", color: "#475467", fontSize: 13 }}>
              Drag edges or corners to choose the area you want to keep.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: "none",
              background: "#f1f5f9",
              color: "#0f172a",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 860,
            margin: "0 auto 16px",
            background: "#0b1220",
            borderRadius: 14,
            padding: "12px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 860,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: "100%",
                background: "#0b1220",
                borderRadius: 10,
                padding: 12,
              }}
            >
              {dataUrl && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ReactCrop
                    crop={crop}
                    onChange={(nextCrop) => setCrop(nextCrop)}
                    onComplete={(pixelCrop) => {
                      if (!pixelCrop) return;
                      setCompletedCrop(pixelCrop);
                    }}
                    aspect={lockAspect}
                    minWidth={30}
                    minHeight={30}
                    keepSelection
                    style={{
                      maxWidth: viewportWidth,
                      maxHeight: viewportHeight,
                      background: "#0b1220",
                    }}
                  >
                    <img
                      src={dataUrl}
                      alt="Crop"
                      onLoad={handleImageLoad}
                      ref={imageRef}
                      style={{
                        maxWidth: viewportWidth,
                        maxHeight: viewportHeight,
                        width: naturalSize.width ? naturalSize.width * previewScale * zoom : undefined,
                        height: naturalSize.height ? naturalSize.height * previewScale * zoom : undefined,
                      }}
                    />
                  </ReactCrop>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#e2e8f0",
                  fontSize: 12,
                  marginBottom: 8,
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ opacity: 0.85 }}>Zoom</span>
                <input
                  type="range"
                  min={0.25}
                  max={2}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 42, textAlign: "right" }}>{Math.round(zoom * 100)}%</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginTop: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (lockAspect) {
                      setLockAspect(undefined);
                    } else {
                      setLockAspect(16 / 9);
                      if (imageRef.current) {
                        const { naturalWidth, naturalHeight } = imageRef.current;
                        const newCrop = buildInitialCrop(naturalWidth, naturalHeight);
                        if (newCrop) {
                          setCrop(newCrop);
                          setCompletedCrop(newCrop);
                        }
                      }
                    }
                  }}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: lockAspect ? "#0f172a" : "#ffffff",
                    color: lockAspect ? "#ffffff" : "#0f172a",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {lockAspect ? "Aspect 16:9 (on)" : "Lock 16:9"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#ff8b37,#ff6a00)",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 12px 24px rgba(255,106,0,0.25)",
            }}
          >
            Set photo
          </button>
        </div>
      </div>
    </div>
  );
}
