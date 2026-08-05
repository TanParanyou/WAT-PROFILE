"use client";

import { useCallback, useEffect, useState } from "react";

export function subscribeToPageShow(onPageShow: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handlePageShow = () => onPageShow();
  window.addEventListener("pageshow", handlePageShow);
  return () => window.removeEventListener("pageshow", handlePageShow);
}

export function useGoogleRedirect() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => subscribeToPageShow(() => setRedirecting(false)), []);

  const markRedirecting = useCallback(() => {
    setRedirecting(true);
  }, []);

  return { redirecting, markRedirecting };
}
