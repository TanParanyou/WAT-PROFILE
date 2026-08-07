"use client";

import { ArrowLeft } from "lucide-react";
import { Link } from "@/navigation";
import type { AccountDestination } from "../accountNavigation";

export interface AccountBackButtonProps {
  href: AccountDestination;
  label: string;
}

export function AccountBackButton({ href, label }: AccountBackButtonProps) {
  return (
    <Link
      data-slot="account-back-button"
      href={href}
      aria-label={label}
      className="group inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 py-2.5 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus motion-reduce:transition-none"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}
