"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { SiteModalPortal } from "./SiteModalPortal";

type SiteModalSize = "sm" | "md";
type SiteModalTone = "neutral" | "danger";

interface SiteModalProps {
  open: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  size?: SiteModalSize;
  tone?: SiteModalTone;
  busy?: boolean;
  closeOnOverlayClick?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

const focusableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const sizeClasses: Record<SiteModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
};

const toneClasses: Record<SiteModalTone, string> = {
  neutral: "border-t-site-accent",
  danger: "border-t-site-danger",
};

export function SiteModal({
  open,
  eyebrow,
  title,
  description,
  onClose,
  children,
  closeLabel = "Close",
  size = "sm",
  tone = "neutral",
  busy = false,
  closeOnOverlayClick = true,
  initialFocusRef,
}: SiteModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirstControl = () => {
      const firstControl =
        dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
      (
        initialFocusRef?.current ??
        firstControl ??
        closeButtonRef.current
      )?.focus();
    };
    const frame = requestAnimationFrame(focusFirstControl);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!busy) onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (controls.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [busy, initialFocusRef, onClose, open]);

  if (!open) return null;

  return (
    <SiteModalPortal>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-site-overlay p-3 sm:items-center sm:p-6"
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            closeOnOverlayClick &&
            !busy
          )
            onClose();
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          aria-busy={busy || undefined}
          data-tone={tone}
          tabIndex={-1}
          className={`w-full ${sizeClasses[size]} max-h-[calc(100vh-1.5rem)] overflow-hidden border border-site-border border-t-2 ${toneClasses[tone]} bg-site-canvas text-site-foreground shadow-site-modal focus-visible:outline-3 focus-visible:outline-site-focus sm:max-h-[calc(100vh-3rem)]`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-site-border px-4 py-4 sm:px-6">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-accent">
                  {eyebrow}
                </p>
              ) : null}
              <h2
                id={titleId}
                className="mt-1 font-heading text-xl font-bold [text-wrap:balance]"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm leading-6 text-site-muted"
                >
                  {description}
                </p>
              ) : null}
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label={closeLabel}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border border-site-border text-site-muted transition-colors hover:bg-site-surface hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>
          <div className="max-h-[70vh] overflow-auto p-4 sm:max-h-[calc(70vh-1.5rem)] sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </SiteModalPortal>
  );
}

export type { SiteModalProps, SiteModalSize, SiteModalTone };
