import React from "react";

interface SectionLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionLayout({
  title,
  subtitle,
  children,
  className = "",
  action,
}: SectionLayoutProps) {
  return (
    <section className={`bg-[#fffef2] py-16 md:py-24 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            {subtitle && (
              <p className="mb-2 text-sm font-medium tracking-wide text-[#945c26]">
                {subtitle}
              </p>
            )}
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#333] md:text-4xl">
              {title}
            </h2>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
