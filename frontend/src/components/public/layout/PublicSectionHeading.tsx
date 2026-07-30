import type { ReactNode } from "react";

interface PublicSectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  id?: string;
}

export function PublicSectionHeading({
  title,
  description,
  action,
  align = "left",
  id,
}: PublicSectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={`flex flex-col gap-5 ${
        centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={centered ? "max-w-3xl" : "max-w-3xl"}>
        <h2
          id={id}
          className="font-heading text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.18] tracking-[-0.025em] text-text-900 text-balance"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-[65ch] leading-8 text-text-800 text-pretty">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
