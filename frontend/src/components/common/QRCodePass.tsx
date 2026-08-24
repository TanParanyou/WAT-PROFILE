"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Loader2 } from "lucide-react";
import { CopyButton } from "./CopyButton";

export interface QRCodePassProps {
  value: string;
  title?: string;
  codeLabel?: string;
  instructions?: string;
  downloadLabel?: string;
  downloadFileName?: string;
  copyLabel?: string;
  copiedLabel?: string;
  size?: number;
  className?: string;
}

export function QRCodePass({
  value,
  title,
  codeLabel,
  instructions,
  downloadLabel = "Save QR Code Image",
  downloadFileName,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  size = 140,
  className = "",
}: QRCodePassProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, {
      width: 240,
      margin: 2,
      color: {
        dark: "#333333",
        light: "#FFFFFF",
      },
    })
      .then(setQrDataUrl)
      .catch(() => setError(true));
  }, [value]);

  if (!value) return null;

  return (
    <div
      className={`border border-site-border bg-site-surface/40 p-4 sm:p-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="border border-site-border bg-white p-2">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code: ${value}`}
                style={{ width: size, height: size }}
                className="object-contain"
              />
            ) : error ? (
              <div
                style={{ width: size, height: size }}
                className="flex items-center justify-center text-xs text-red-700 font-mono"
              >
                QR Error
              </div>
            ) : (
              <div
                style={{ width: size, height: size }}
                className="flex items-center justify-center text-site-muted"
              >
                <Loader2 className="size-6 animate-spin text-site-accent" />
              </div>
            )}
          </div>

          {qrDataUrl ? (
            <a
              href={qrDataUrl}
              download={downloadFileName || `qr_${value}.png`}
              className="inline-flex items-center gap-1.5 text-xs text-site-muted hover:text-site-foreground transition-colors"
            >
              <Download size={13} aria-hidden />
              <span>{downloadLabel}</span>
            </a>
          ) : null}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          {title ? (
            <h4 className="font-heading text-sm font-bold text-site-foreground">
              {title}
            </h4>
          ) : null}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {codeLabel ? (
              <span className="text-xs text-site-muted">{codeLabel}:</span>
            ) : null}
            <span className="font-mono text-sm font-bold text-site-foreground break-all">
              {value}
            </span>
            <CopyButton
              text={value}
              label={copyLabel}
              copiedLabel={copiedLabel}
              variant="inline"
            />
          </div>

          {instructions ? (
            <p className="text-xs text-site-muted max-w-sm">
              {instructions}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
