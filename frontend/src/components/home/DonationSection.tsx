"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { QrCode, Building2 } from "lucide-react";
import { usePublicContactQuery } from "@/features/public/content/queries";
import { getLocalizedText } from "@/utils/localizedText";
import { PublicImage } from "@/components/public/media/PublicImage";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { EmptyState } from "@/components/public/states/EmptyState";

const donationFallbackImage = "/images/og-image.jpg";

export default function DonationSection() {
  const t = useTranslations("DonationSection");
  const locale = useLocale();
  const contactQuery = usePublicContactQuery();
  const [showQrModal, setShowQrModal] = useState(false);
  const bank = contactQuery.data?.body.bank;
  const hasBankTransfer = Boolean(bank && (bank.bank_name || bank.account_name || bank.account_number || bank.iban || bank.bic));
  const hasQr = Boolean(bank?.qr_image_url);
  const hasPaymentData = hasBankTransfer || hasQr;

  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <p className="mb-4 font-sans text-sm font-semibold text-secondary">{t("subtitle")}</p>
            <h2 className="text-balance mb-6 font-heading text-3xl font-bold leading-tight text-primary md:text-5xl">{t("title")}</h2>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400">{t("description")}</p>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{t("channelHint")}</p>
          </motion.div>
        </div>

        {contactQuery.isLoading ? (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2" aria-label={t("loading")}>
              <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-zinc-950" />
              <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-zinc-950" />
          </div>
        ) : contactQuery.isError ? (
          <div className="mx-auto max-w-4xl"><QueryErrorState title={t("loadErrorTitle")} description={t("loadErrorDescription")} retryLabel={t("retry")} onRetry={() => contactQuery.refetch()} isRetrying={contactQuery.isFetching} /></div>
        ) : !hasPaymentData ? (
          <div className="mx-auto max-w-4xl"><EmptyState title={t("emptyTitle")} description={t("emptyDescription")} /></div>
        ) : (
          <div className={`mx-auto grid max-w-4xl grid-cols-1 gap-8 ${hasQr && hasBankTransfer ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
            {hasQr && bank?.qr_image_url ? (
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-zinc-950">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><QrCode size={32} /></div>
                <h3 className="mb-2 text-xl font-bold">{t("scanQr")}</h3>
                <p className="mb-6 text-sm text-gray-500">{t("createQrDesc")}</p>
                <button type="button" onClick={() => setShowQrModal(true)} className="relative mb-6 h-64 w-full max-w-xs overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 transition-colors hover:border-primary">
                  <PublicImage src={bank.qr_image_url} alt={t("qrAlt")} fill fallbackSrc={donationFallbackImage} className="object-contain p-4" />
                  <span className="absolute inset-x-4 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm">{t("clickToView")}</span>
                </button>
                <button type="button" onClick={() => setShowQrModal(true)} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">{t("scanQr")}</button>
              </motion.div>
            ) : null}

            {hasBankTransfer && bank ? (
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} viewport={{ once: true }} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-zinc-950">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 size={32} /></div>
                <h3 className="mb-4 text-xl font-bold">{t("bankTransfer")}</h3>
                <div className="w-full space-y-4 rounded-2xl bg-gray-50 p-6 text-left dark:bg-zinc-900/50">
                  {bank.bank_name ? <div><p className="mb-1 text-xs font-semibold uppercase text-gray-500">{t("bankLabel")}</p><p className="font-medium text-gray-900 dark:text-gray-100">{getLocalizedText(bank.bank_name, locale)}</p></div> : null}
                  {bank.account_name ? <div><p className="mb-1 text-xs font-semibold uppercase text-gray-500">{t("accountNameLabel")}</p><p className="font-medium text-gray-900 dark:text-gray-100">{getLocalizedText(bank.account_name, locale)}</p></div> : null}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {bank.iban ? <div><p className="mb-1 text-xs font-semibold uppercase text-gray-500">{t("ibanLabel")}</p><p className="break-all font-mono font-medium text-gray-900 dark:text-gray-100">{bank.iban}</p></div> : null}
                    {bank.bic ? <div><p className="mb-1 text-xs font-semibold uppercase text-gray-500">{t("bicLabel")}</p><p className="font-mono font-medium text-gray-900 dark:text-gray-100">{bank.bic}</p></div> : null}
                  </div>
                  {bank.account_number ? <div><p className="mb-1 text-xs font-semibold uppercase text-gray-500">{t("accountNumberLabel")}</p><p className="font-medium text-gray-900 dark:text-gray-100">{bank.account_number}</p></div> : null}
                </div>
              </motion.div>
            ) : null}
          </div>
        )}
      </div>

      {showQrModal && bank?.qr_image_url ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowQrModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-zinc-900">
            <h3 className="mb-4 text-center text-xl font-bold">{t("scanQr")}</h3>
            <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-gray-100 bg-white"><PublicImage src={bank.qr_image_url} alt={t("qrAlt")} fill fallbackSrc={donationFallbackImage} className="object-contain p-4" /></div>
            <button type="button" onClick={() => setShowQrModal(false)} className="mt-4 w-full rounded-xl bg-gray-100 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">{t("close")}</button>
          </motion.div>
        </div>
      ) : null}
    </section>
  );
}
