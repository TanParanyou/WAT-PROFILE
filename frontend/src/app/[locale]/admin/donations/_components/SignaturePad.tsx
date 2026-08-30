"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { RotateCcw, PenTool, Save, BookmarkPlus, Check, Loader2 } from "lucide-react";

interface SignaturePadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  clearButtonText?: string;
  helperText?: string;
  height?: number;
  onSaveAsDefault?: (dataUrl: string) => Promise<void> | void;
  onSaveToPresets?: (name: string, dataUrl: string) => Promise<void> | void;
  canSaveDefault?: boolean;
  isSaving?: boolean;
}

export function SignaturePad({
  value,
  onChange,
  label = "กระดานเซ็นสด (Live Signature Pad)",
  clearButtonText = "ล้างลายเซ็น",
  helperText = "ใช้เมาส์ ทัชสกรีน หรือปากกา วาดลายเซ็นภายในกรอบ",
  height = 140,
  onSaveAsDefault,
  onSaveToPresets,
  canSaveDefault = true,
  isSaving = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(value));
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Setup canvas size with DPI scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#0f172a"; // Deep navy ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // If initial value exists, load it onto canvas
    if (value) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    }
  }, [value]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if ("touches" in e) {
      e.stopPropagation();
    }
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    if ("touches" in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
      e.stopPropagation();
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-admin-foreground flex items-center gap-1.5">
          <PenTool size={13} className="text-admin-muted" />
          <span>{label}</span>
        </label>
        {hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-admin-danger hover:underline flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} />
            <span>{clearButtonText}</span>
          </button>
        )}
      </div>

      <div
        className="relative w-full border border-admin-control-border bg-white rounded-none overflow-hidden touch-none"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair block"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-3 text-gray-300">
            <div className="border-b border-dashed border-gray-300 w-full mb-1" />
            <span className="text-[10px] text-gray-400 font-mono">
              ✕ ลงลายมือชื่อที่นี่ (Sign here)
            </span>
          </div>
        )}
      </div>

      {hasDrawn && (
        <div className="pt-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {onSaveAsDefault && canSaveDefault && (
              <button
                type="button"
                onClick={() => {
                  const canvas = canvasRef.current;
                  const dataUrl = value || canvas?.toDataURL("image/png");
                  if (dataUrl) onSaveAsDefault(dataUrl);
                }}
                disabled={isSaving}
                className="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                <span>บันทึกเป็นลายเซ็นวัด (Default)</span>
              </button>
            )}

            {onSaveToPresets && (
              <button
                type="button"
                onClick={() => setShowPresetInput(!showPresetInput)}
                className="px-2.5 py-1 text-xs font-medium border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <BookmarkPlus size={12} />
                <span>บันทึกลงคลังลายเซ็น</span>
              </button>
            )}
          </div>

          {showPresetInput && onSaveToPresets && (
            <div className="p-2.5 bg-admin-surface-muted/60 border border-admin-border space-y-2">
              <label className="text-[11px] font-medium text-admin-foreground block">
                ตั้งชื่อลายเซ็นเพื่อนำมาใช้ซ้ำ (เช่น ลายเซ็นไวยาวัจกร, ลายเซ็นเจ้าอาวาส):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="เช่น ลายเซ็นพระครูวิมลธรรมวิเทศ"
                  className="flex-1 text-xs p-1.5 border border-admin-control-border bg-admin-surface text-admin-foreground"
                />
                <button
                  type="button"
                  disabled={!presetName.trim() || isSaving}
                  onClick={() => {
                    const canvas = canvasRef.current;
                    const dataUrl = value || canvas?.toDataURL("image/png");
                    if (dataUrl && presetName.trim()) {
                      onSaveToPresets(presetName.trim(), dataUrl);
                      setPresetName("");
                      setShowPresetInput(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-admin-focus text-white hover:bg-admin-focus/90 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Check size={13} />
                  <span>บันทึก</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-admin-muted leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
}
