"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";

export function AccountLegalFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-site-border bg-site-canvas px-4 py-4 text-site-muted sm:px-6 lg:px-8">
      <nav
        aria-label={t("quickLinks")}
        className="mx-auto flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
      >
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
        >
          {t("privacy")}
        </Link>
        <Link
          href="/impressum"
          className="inline-flex min-h-11 items-center transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
        >
          {t("impressum")}
        </Link>
      </nav>
    </footer>
  );
}
