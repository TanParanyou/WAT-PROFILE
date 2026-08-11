"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { DonationReportForm } from "./DonationReportForm";

export function DonationReportPageContent() {
  const t = useTranslations("DonationReportPage");
  const [isDirty, setIsDirty] = useState(false);
  const handleBackClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (!isDirty || typeof window === "undefined") return;
    if (!window.confirm(t("unsavedChangesMessage"))) event.preventDefault();
  }, [isDirty, t]);

  return (
    <>
      <div className="mb-10 grid gap-5">
        <Link href="/#donate" onClick={handleBackClick} className="inline-flex min-h-11 w-fit items-center px-2 py-2 text-sm font-semibold text-site-accent underline decoration-site-accent/40 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t("backToDonation")}</Link>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-site-muted">{t("afterTransfer")}</p>
        <h1 className="max-w-[18ch] text-balance font-heading text-[clamp(2.5rem,6vw,5.5rem)] font-normal leading-[1.08]">{t("title")}</h1>
        <p className="max-w-[65ch] text-lg leading-8 text-site-body">{t("subtitle")}</p>
      </div>
      <div className="mb-10 grid gap-4 border-y border-site-border py-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
        <span className="h-2 w-2 bg-site-action sm:ml-1" aria-hidden="true" />
        <p className="text-sm leading-6 text-site-body">{t("afterTransferHint")}</p>
      </div>
      <DonationReportForm onDirtyChange={setIsDirty} />
    </>
  );
}
