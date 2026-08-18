"use client";

import { useState, useEffect } from "react";

/**
 * useMediaQuery: Hook to evaluate CSS media queries in React components.
 *
 * @example
 * const isWide = useMediaQuery("(min-width: 1024px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", listener);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * useIsMobile: Returns true if viewport width is less than 768px (Tailwind 'md' breakpoint).
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/**
 * useIsTablet: Returns true if viewport width is between 768px and 1023px.
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

/**
 * useIsDesktop: Returns true if viewport width is 1024px or greater (Tailwind 'lg' breakpoint).
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
