"use client";

import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

const linkClass =
  "inline-flex min-h-11 items-center rounded text-text-700 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  const t = useTranslations("EventDetailPage.breadcrumbs");

  return (
    <nav className="overflow-x-auto text-sm" aria-label="Breadcrumb">
      <ol className="inline-flex min-w-max items-center gap-1">
        <li className="inline-flex items-center">
          <Link href="/" className={linkClass}>
            <Home size={16} className="mr-2" aria-hidden="true" />
            {t("home")}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            <ChevronRight size={16} className="mx-1 text-text-600" aria-hidden="true" />
            {item.href && !item.active ? (
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ) : (
              <span aria-current={item.active ? "page" : undefined} className="font-medium text-text-900">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
