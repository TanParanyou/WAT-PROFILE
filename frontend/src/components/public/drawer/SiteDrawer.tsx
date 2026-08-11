"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { SiteModalPortal } from "@/components/public/modal/SiteModalPortal";

type SiteDrawerSize = "md" | "lg" | "full";

interface SiteDrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  size?: SiteDrawerSize;
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

const sizeClasses: Record<SiteDrawerSize, string> = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  full: "sm:max-w-full",
};

export function SiteDrawer({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  closeLabel = "Close drawer",
  size = "lg",
  closeOnOverlayClick = true,
  initialFocusRef,
}: SiteDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      const firstControl = drawerRef.current?.querySelector<HTMLElement>(focusableSelector);
      (initialFocusRef?.current ?? firstControl ?? closeButtonRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const controls = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (controls.length === 0) {
        event.preventDefault();
        drawerRef.current.focus();
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
  }, [initialFocusRef, onClose, open]);

  if (!open) return null;

  return (
    <SiteModalPortal>
      <div
        className="fixed inset-0 z-[70] bg-site-overlay"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && closeOnOverlayClick) onClose();
        }}
      >
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={`absolute inset-x-0 bottom-0 flex max-h-[calc(100vh-1rem)] w-full flex-col border-t border-site-border bg-site-canvas text-site-foreground shadow-site-modal focus-visible:outline-3 focus-visible:outline-site-focus sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:border-t-0 sm:border-l ${sizeClasses[size]}`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-site-border px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={titleId} className="font-heading text-xl font-bold [text-wrap:balance]">{title}</h2>
              {description ? <p id={descriptionId} className="mt-1 break-words text-sm leading-6 text-site-muted">{description}</p> : null}
            </div>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label={closeLabel} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border border-site-border text-site-muted transition-colors hover:bg-site-surface hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">{children}</div>
          {footer ? <footer className="shrink-0 border-t border-site-border bg-site-canvas px-4 py-4 sm:px-6">{footer}</footer> : null}
        </div>
      </div>
    </SiteModalPortal>
  );
}

export type { SiteDrawerProps, SiteDrawerSize };
