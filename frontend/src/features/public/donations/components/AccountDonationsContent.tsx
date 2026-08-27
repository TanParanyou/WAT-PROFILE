"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import {
  Download,
  Heart,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  useAccountDonationsQuery,
  downloadDonationReceipt,
  type AccountDonationItem,
} from "../accountDonationsApi";
import type { AccountLocale } from "../../account/types";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { CopyButton } from "@/components/common/CopyButton";
import { formatCurrency } from "@/utils/formatters";

const PAGE_SIZE = 10;

const primaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";
const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function DonationStatusBadge({
  status,
}: {
  status: AccountDonationItem["status"];
}) {
  const t = useTranslations("Account");

  let colorClasses = "border-site-border bg-site-surface text-site-foreground";
  let labelKey = "account.donationStatusPending";

  if (status === "confirmed") {
    colorClasses = "border-emerald-700 bg-emerald-50 text-emerald-800";
    labelKey = "account.donationStatusConfirmed";
  } else if (status === "cancelled") {
    colorClasses = "border-red-700 bg-red-50 text-red-800";
    labelKey = "account.donationStatusCancelled";
  }

  return (
    <span
      className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${colorClasses}`}
    >
      {t(labelKey)}
    </span>
  );
}

function DonationRow({
  donation,
  locale,
}: {
  donation: AccountDonationItem;
  locale: AccountLocale;
}) {
  const t = useTranslations("Account");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const categoryName =
    donation.category?.name?.[locale] ||
    donation.category?.name?.th ||
    donation.category?.name?.en ||
    donation.purpose?.[locale] ||
    donation.purpose?.th ||
    donation.purpose?.en ||
    t("account.generalDonation");

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);
      await downloadDonationReceipt(donation.id, donation.receipt_number);
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setDownloadError(err.message);
      } else {
        setDownloadError(t("account.receiptDownloadError"));
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="border border-site-border bg-site-canvas p-5 sm:p-6 transition-colors hover:border-site-border/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-site-foreground">
            {categoryName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-site-muted">
            <span>
              {t("account.donationDate")}:{" "}
              <strong className="text-site-foreground">
                {formatDate(donation.donation_date, locale)}
              </strong>
            </span>
            {donation.receipt_number ? (
              <div className="flex items-center gap-1.5 font-mono">
                <span>{t("account.donationReceipt")}:</span>
                <strong className="text-site-foreground">
                  {donation.receipt_number}
                </strong>
                <CopyButton
                  text={donation.receipt_number}
                  label={t("account.copyCode") || "Copy"}
                  copiedLabel={t("account.codeCopied") || "Copied"}
                  variant="inline"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="font-heading text-lg font-bold text-site-foreground">
            {formatCurrency(donation.amount, donation.currency, locale)}
          </span>
          <DonationStatusBadge status={donation.status} />
        </div>
      </div>

      {donation.cancellation_reason ? (
        <p className="mt-3 text-xs text-red-700">
          {donation.cancellation_reason}
        </p>
      ) : null}

      {donation.receipt_available ? (
        <div className="mt-4 border-t border-site-border pt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-surface px-4 py-2 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin text-site-accent" aria-hidden />
            ) : (
              <Download className="size-4 text-site-accent" aria-hidden />
            )}
            {t("account.downloadReceipt")}
          </button>

          {downloadError ? (
            <span role="alert" className="text-xs text-red-700">
              {downloadError}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function AccountDonationsContent() {
  const t = useTranslations("Account");
  const rawLocale = useLocale();
  const locale: AccountLocale =
    rawLocale === "th" || rawLocale === "en" || rawLocale === "de"
      ? rawLocale
      : "en";
  const [page, setPage] = useState(1);
  const session = useAccountSession();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAccountDonationsQuery(
      {
        page,
        limit: PAGE_SIZE,
      },
      session.status === "authenticated",
    );

  if (session.status === "loading" || isLoading) {
    return (
      <div className="space-y-4">
        <div className="border border-site-border bg-site-surface/40 p-6">
          <div className="flex items-center gap-3 text-site-muted">
            <Loader2 className="size-5 animate-spin text-site-accent" aria-hidden />
            <span className="text-sm font-medium">
              {t("account.loadingDonations")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (session.status !== "authenticated") {
    return (
      <div className="border border-site-border bg-site-surface p-6">
        <h2 className="font-heading text-xl font-semibold text-site-foreground">
          {t("account.donationsSection")}
        </h2>
        <p className="mt-2 text-sm text-site-muted">
          {t("account.donationsSubtitle")}
        </p>
        <Link
          href="/account/login"
          className={`mt-4 ${primaryActionClass}`}
        >
          {t("account.loginAction")}
        </Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="space-y-4 border border-red-700 bg-red-50 p-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-red-700 shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-red-800">
              {t("account.donationsLoadError")}
            </h3>
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex min-h-11 items-center gap-2 border border-red-700 bg-white px-6 py-[13px] font-semibold text-red-800 hover:bg-red-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
        >
          <RefreshCw className="size-4" aria-hidden />
          {t("account.retryDonations")}
        </button>
      </div>
    );
  }

  const items = data?.items || [];
  const pagination = data?.pagination;

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-site-foreground">
            {t("account.donationsSection")}
          </h2>
          <p className="mt-1 text-sm text-site-muted">
            {t("account.donationsSubtitle")}
          </p>
        </div>

        <div className="border border-site-border bg-site-canvas p-8 text-center sm:p-12">
          <div className="mx-auto flex size-12 items-center justify-center bg-site-surface text-site-accent">
            <Heart className="size-6" aria-hidden />
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-site-foreground">
            {t("account.noDonations")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-site-muted">
            {t("account.noDonationsDescription")}
          </p>
          <div className="mt-6">
            <Link href="/#donate" className={primaryActionClass}>
              <Heart className="size-4 shrink-0" aria-hidden />
              {t("account.makeDonationButton")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-site-foreground">
            {t("account.donationsSection")}
          </h2>
          <p className="mt-1 text-sm text-site-muted">
            {t("account.donationsSubtitle")}
          </p>
        </div>
        <Link href="/#donate" className={secondaryActionClass}>
          <Heart className="size-4 shrink-0" aria-hidden />
          {t("account.makeDonationButton")}
        </Link>
      </div>

      <div className="space-y-4">
        {items.map((donation) => (
          <DonationRow
            key={donation.id}
            donation={donation}
            locale={locale}
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <nav
          aria-label={t("account.donationsSection")}
          className="flex items-center justify-between border-t border-site-border pt-4"
        >
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex min-h-11 items-center gap-1 border border-site-border bg-site-canvas px-4 py-2 text-sm font-semibold text-site-foreground hover:bg-site-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden />
            <span>Prev</span>
          </button>

          <span className="text-xs font-medium text-site-muted">
            {page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={page >= pagination.totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="inline-flex min-h-11 items-center gap-1 border border-site-border bg-site-canvas px-4 py-2 text-sm font-semibold text-site-foreground hover:bg-site-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
