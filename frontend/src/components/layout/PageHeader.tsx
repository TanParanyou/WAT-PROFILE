import type { ReactNode } from "react";
import { PublicImage } from "@/components/public/media/PublicImage";

export type PageHeaderVariant = "image" | "color" | "reading";
export type PageHeaderAlign = "left" | "center";
export type PageHeaderDensity = "default" | "compact";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: PageHeaderVariant;
  align?: PageHeaderAlign;
  density?: PageHeaderDensity;
  imageSrc?: string | null;
  imageAlt?: string;
}

const fallbackImage = "/images/hero-bg.png";

export default function PageHeader({
  title,
  subtitle,
  children,
  variant = "color",
  align = "center",
  density = "default",
  imageSrc,
  imageAlt,
}: PageHeaderProps) {
  const isReading = variant === "reading";
  const isImage = variant === "image";
  const heightClass = isReading
    ? "pb-12 pt-32 md:pb-16 md:pt-36"
    : density === "compact"
      ? "pb-12 pt-24 md:pb-14 md:pt-28"
      : "pb-16 pt-36 md:pb-20 md:pt-44";
  const alignmentClass = align === "center" ? "mx-auto text-center" : "text-left";
  const textClass = isImage ? "text-site-on-action" : "text-site-foreground";
  const subtitleClass = isImage ? "text-site-on-action/90" : "text-site-body";

  return (
    <header
      className={`relative overflow-hidden border-b border-site-border ${heightClass} ${
        isReading ? "bg-site-canvas" : isImage ? "bg-site-action" : "bg-site-surface"
      }`}
    >
      {isReading ? (
        <div
          className="absolute inset-x-0 top-0 h-24 bg-site-action"
          aria-hidden="true"
        />
      ) : null}

      {isImage ? (
        <>
          <PublicImage
            src={imageSrc}
            alt={imageAlt || title}
            fill
            priority
            fallbackSrc={fallbackImage}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-site-action/70" aria-hidden="true" />
        </>
      ) : null}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`max-w-4xl ${alignmentClass} ${textClass}`}>
          <h1 className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.12] tracking-[-0.03em] text-balance">
            {title}
          </h1>
          {subtitle ? (
            <p
              className={`mt-5 max-w-[65ch] text-lg leading-8 text-pretty ${
                align === "center" ? "mx-auto" : ""
              } ${subtitleClass}`}
            >
              {subtitle}
            </p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </header>
  );
}
