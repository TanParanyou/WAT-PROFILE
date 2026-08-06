"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";

type AccountBackHref = "/" | "/account" | "/account/login";

export function getAccountBackHref(pathname: string): AccountBackHref {
  if (pathname === "/account") return "/";
  if (pathname === "/account/sessions") return "/account";
  if (pathname === "/account/login") return "/";
  return "/account/login";
}

export function AccountBackButton() {
  const t = useTranslations("Account");
  const pathname = usePathname();
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(getAccountBackHref(pathname));
  };

  return (
    <button
      data-slot="account-back-button"
      type="button"
      onClick={handleBack}
      aria-label={t("back")}
      className="group inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 py-2.5 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus motion-reduce:transition-none"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
      {t("back")}
    </button>
  );
}
