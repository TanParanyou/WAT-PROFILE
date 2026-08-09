"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { QrCode, Building2 } from "lucide-react";
import { usePublicContactQuery } from "@/features/public/content/queries";
import { getLocalizedText } from "@/utils/localizedText";
import { PublicImage } from "@/components/public/media/PublicImage";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { EmptyState } from "@/components/public/states/EmptyState";
import { STATIC_ASSETS } from "@/constants/assets";

const donationFallbackImage = STATIC_ASSETS.DONATION.FALLBACK;

export default function DonationSection() {
  const t = useTranslations("DonationSection");
  const locale = useLocale();
  const contactQuery = usePublicContactQuery();
  const [showQrModal, setShowQrModal] = useState(false);
  const bank = contactQuery.data?.body.bank;
  const hasBankTransfer = Boolean(bank && (bank.bank_name || bank.account_name || bank.account_number || bank.iban || bank.bic));
  const hasQr = Boolean(bank?.qr_image_url);
  const hasPaymentData = hasBankTransfer || hasQr;

  useEffect(() => {
    if (!showQrModal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowQrModal(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showQrModal]);

  return (
    <section id="donate" className="border-t border-site-border bg-site-surface px-6 py-[clamp(4rem,9vw,8rem)] text-site-foreground sm:px-10 lg:px-[8vw]">
      <div>
        <div className="mb-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <p className="text-sm text-site-muted">{t("subtitle")}</p>
          </motion.div>
          <div><h2 className="max-w-[16ch] text-balance font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14]">{t("title")}</h2><p className="mt-6 max-w-[65ch] text-lg leading-8 text-site-body">{t("description")}</p></div>
        </div>

        {contactQuery.isLoading ? (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2" aria-label={t("loading")}>
            <div className="h-96 animate-pulse bg-white" />
            <div className="h-96 animate-pulse bg-white" />
          </div>
        ) : contactQuery.isError ? (
          <div className="mx-auto max-w-4xl"><QueryErrorState title={t("loadErrorTitle")} description={t("loadErrorDescription")} retryLabel={t("retry")} onRetry={() => contactQuery.refetch()} isRetrying={contactQuery.isFetching} /></div>
        ) : !hasPaymentData ? (
          <div className="mx-auto max-w-4xl"><EmptyState title={t("emptyTitle")} description={t("emptyDescription")} /></div>
        ) : (
          <>
            <div className={`grid grid-cols-1 border-y border-site-border ${hasQr && hasBankTransfer ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
            {hasQr && bank?.qr_image_url ? (
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.1 }} viewport={{ once: true }} className="flex flex-col items-center bg-site-canvas p-8 text-center md:border-r md:border-site-border">
                <div className="mb-6 text-site-accent"><QrCode size={28} /></div>
                <h3 className="mb-2 font-heading text-2xl font-medium text-site-foreground">{t("scanQr")}</h3>
                <p className="mb-6 text-sm leading-7 text-site-body">{t("createQrDesc")}</p>
                <button type="button" onClick={() => setShowQrModal(true)} className="relative mb-6 h-64 w-full max-w-xs overflow-hidden border border-site-border bg-site-canvas p-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">
                  <PublicImage src={bank.qr_image_url} alt={t("qrAlt")} fill fallbackSrc={donationFallbackImage} className="object-contain p-4" />
                  <span className="absolute inset-x-4 bottom-4 bg-site-canvas/95 px-3 py-2 text-xs font-semibold text-site-foreground">{t("clickToView")}</span>
                </button>
                <button type="button" onClick={() => setShowQrModal(true)} className="min-h-11 bg-site-action px-6 py-[13px] text-sm font-medium text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t("scanQr")}</button>
              </motion.div>
            ) : null}

            {hasBankTransfer && bank ? (
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.2 }} viewport={{ once: true }} className="flex flex-col items-center bg-site-canvas p-8 text-center">
                <div className="mb-6 text-site-accent"><Building2 size={28} /></div>
                <h3 className="mb-4 font-heading text-2xl font-medium text-site-foreground">{t("bankTransfer")}</h3>
                <div className="w-full space-y-4 border border-site-border bg-site-canvas p-6 text-left">
                  {bank.bank_name ? <div><p className="mb-1 text-xs font-semibold text-site-accent">{t("bankLabel")}</p><p className="font-medium text-site-foreground">{getLocalizedText(bank.bank_name, locale)}</p></div> : null}
                  {bank.account_name ? <div><p className="mb-1 text-xs font-semibold text-site-accent">{t("accountNameLabel")}</p><p className="font-medium text-site-foreground">{getLocalizedText(bank.account_name, locale)}</p></div> : null}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {bank.iban ? <div><p className="mb-1 text-xs font-semibold text-site-accent">{t("ibanLabel")}</p><p className="break-all font-mono font-medium text-site-foreground">{bank.iban}</p></div> : null}
                    {bank.bic ? <div><p className="mb-1 text-xs font-semibold text-site-accent">{t("bicLabel")}</p><p className="font-mono font-medium text-site-foreground">{bank.bic}</p></div> : null}
                  </div>
                  {bank.account_number ? <div><p className="mb-1 text-xs font-semibold text-site-accent">{t("accountNumberLabel")}</p><p className="font-medium text-site-foreground">{bank.account_number}</p></div> : null}
                </div>
              </motion.div>
            ) : null}
            </div>
            <div className="mt-8 flex flex-col gap-4 border-t border-site-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[52ch] text-sm leading-6 text-site-body">{t("reportPrompt")}</p>
              <Link href="/donate/report" className="inline-flex min-h-11 shrink-0 items-center justify-center bg-site-action px-6 py-3 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t("reportDonation")}</Link>
            </div>
          </>
        )}
      </div>

      {showQrModal && bank?.qr_image_url ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowQrModal(false)}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="donation-qr-title" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-sm bg-white p-6">
            <h3 id="donation-qr-title" className="mb-4 text-center font-heading text-2xl font-bold text-site-foreground">{t("scanQr")}</h3>
            <div className="relative aspect-square overflow-hidden border border-site-border/15 bg-site-canvas"><PublicImage src={bank.qr_image_url} alt={t("qrAlt")} fill fallbackSrc={donationFallbackImage} className="object-contain p-4" /></div>
            <button type="button" onClick={() => setShowQrModal(false)} className="mt-4 min-h-11 w-full bg-site-action py-3 font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t("close")}</button>
          </motion.div>
        </div>
      ) : null}
    </section>
  );
}
