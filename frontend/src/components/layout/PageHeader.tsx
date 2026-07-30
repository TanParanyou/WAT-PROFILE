import type { ReactNode } from "react";
import { PublicImage } from "@/components/public/media/PublicImage";

export type PageHeaderVariant = "image" | "color" | "reading";
export type PageHeaderAlign = "left" | "center";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: PageHeaderVariant;
  align?: PageHeaderAlign;
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
  imageSrc,
  imageAlt,
}: PageHeaderProps) {
  const isReading = variant === "reading";
  const heightClass = isReading
    ? "pb-12 pt-32 md:pb-16 md:pt-36"
    : "pb-16 pt-36 md:pb-20 md:pt-44";
  const alignmentClass = align === "center" ? "mx-auto text-center" : "text-left";
  const textClass = isReading ? "text-text-900" : "text-white";

  return (
    <header
      className={`relative overflow-hidden ${heightClass} ${
        isReading ? "border-b border-primary/15 bg-white" : "bg-secondary-800"
      }`}
    >
      {variant === "image" ? (
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
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
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
              } ${isReading ? "text-text-800" : "text-white/85"}`}
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
