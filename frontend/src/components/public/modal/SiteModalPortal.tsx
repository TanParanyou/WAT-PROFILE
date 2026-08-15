"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore, type ReactNode } from "react";

interface SiteModalPortalProps {
  children: ReactNode;
}

export function SiteModalPortal({ children }: SiteModalPortalProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted || typeof document === "undefined") return null;
  const root = document.getElementById("public-modal-root") || document.body;
  return createPortal(children, root);
}
