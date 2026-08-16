"use client";

import React, { useMemo } from "react";
import { generateQRCodeMatrix } from "@/utils/qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  value,
  size = 220,
  className = "",
}: QRCodeDisplayProps) {
  const matrix = useMemo(() => {
    try {
      return generateQRCodeMatrix(value);
    } catch {
      return [];
    }
  }, [value]);

  if (!matrix.length) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-white text-admin-danger text-xs font-mono p-4 border border-admin-border"
      >
        QR Error
      </div>
    );
  }

  const matrixSize = matrix.length;
  const cellSize = 8;
  const quietZone = 4; // 4 modules quiet zone required by ISO/IEC 18004
  const totalCells = matrixSize + quietZone * 2;
  const svgDimension = totalCells * cellSize;

  return (
    <div
      className={`inline-flex items-center justify-center bg-white p-3 border border-admin-border/80 shadow-sm rounded-none ${className}`}
    >
      <svg
        viewBox={`0 0 ${svgDimension} ${svgDimension}`}
        width={size}
        height={size}
        className="w-full h-auto block select-none"
        shapeRendering="crispEdges"
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((isDark, c) => {
            if (!isDark) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={(c + quietZone) * cellSize}
                y={(r + quietZone) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#000000"
              />
            );
          }),
        )}
      </svg>
    </div>
  );
}
