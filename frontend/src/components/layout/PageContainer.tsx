import type { ReactNode } from "react";

type PageContainerWidth = "wide" | "content" | "reading";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  width?: PageContainerWidth;
  overlap?: boolean;
}

const widths: Record<PageContainerWidth, string> = {
  wide: "max-w-7xl",
  content: "max-w-6xl",
  reading: "max-w-3xl",
};

export default function PageContainer({
  children,
  className = "",
  width = "wide",
  overlap = false,
}: PageContainerProps) {
  return (
    <div
      className={`relative z-20 mx-auto w-full bg-[#fffef2] px-6 pb-20 pt-12 text-[#333] sm:px-10 md:pb-28 md:pt-16 lg:px-[8vw] ${
        widths[width]
      } ${overlap ? "-mt-10 md:-mt-12" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
