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

  if (!mounted) return null;
  const root = document.getElementById("public-modal-root");
  return root ? createPortal(children, root) : null;
}
