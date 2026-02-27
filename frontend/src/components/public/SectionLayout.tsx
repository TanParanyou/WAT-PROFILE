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
    <section className={`py-16 md:py-24 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-3xl">
            {subtitle && (
              <p className="text-amber-600 font-medium tracking-wide text-sm uppercase mb-2">
                {subtitle}
              </p>
            )}
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
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
