"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}

export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  closeLabel,
  children,
  className,
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const previousOverflowRef = useRef("");
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
      closeButtonRef.current?.focus();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      document.body.style.overflow = previousOverflowRef.current;
      returnFocusRef.current?.focus();
    }

    return () => {
      if (!dialog.open) return;
      dialog.close();
      document.body.style.overflow = previousOverflowRef.current;
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-black/70 dark:bg-zinc-900 dark:text-white"
    >
      <div className={cn("relative", className)}>
        <div className="sr-only">
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors duration-150 hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X aria-hidden="true" size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
