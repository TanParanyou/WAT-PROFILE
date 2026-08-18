"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/navigation";
import PageBreadcrumbs from "@/components/common/PageBreadcrumbs";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface DetailNavigationProps {
  breadcrumbs: BreadcrumbItem[];
  backHref: string;
  backLabel: string;
  actions?: ReactNode;
}

export default function DetailNavigation({
  breadcrumbs,
  backHref,
  backLabel,
  actions,
}: DetailNavigationProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-site-border pb-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <PageBreadcrumbs items={breadcrumbs} />
        <Link
          href={backHref}
          className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-site-foreground transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
        >
          <ArrowLeft
            size={18}
            aria-hidden="true"
            className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
          {backLabel}
        </Link>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
