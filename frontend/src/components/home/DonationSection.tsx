"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!showQrModal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowQrModal(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showQrModal]);

  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="mb-4 font-sans font-medium tracking-wider text-secondary uppercase">{t("subtitle")}</h2>
            <h1 className="mb-6 font-heading text-3xl font-bold leading-relaxed text-primary md:text-5xl">{t("title")}</h1>
            <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400">{t("description")}</p>
          </motion.div>
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
          <div className={`mx-auto grid max-w-4xl grid-cols-1 gap-8 ${hasQr && hasBankTransfer ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
            {hasQr && bank?.qr_image_url ? (
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.1 }} viewport={{ once: true }} className="flex flex-col items-center border border-[#20382b]/15 bg-white p-8 text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#20382b] text-white"><QrCode size={26} /></div>
                <h3 className="mb-2 font-heading text-2xl font-bold text-[#20382b]">{t("scanQr")}</h3>
                <p className="mb-6 text-sm leading-7 text-[#5d5b53]">{t("createQrDesc")}</p>
                <button type="button" onClick={() => setShowQrModal(true)} className="relative mb-6 h-64 w-full max-w-xs overflow-hidden rounded-xl border border-[#20382b]/20 bg-white p-4 transition-colors hover:border-[#8a5a10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#20382b]">
                  <PublicImage src={bank.qr_image_url} alt={t("qrAlt")} fill fallbackSrc={donationFallbackImage} className="object-contain p-4" />
                  <span className="absolute inset-x-4 bottom-4 bg-white/95 px-3 py-2 text-xs font-semibold text-[#25231e]">{t("clickToView")}</span>
                </button>
                <button type="button" onClick={() => setShowQrModal(true)} className="min-h-11 rounded-full bg-[#8a5a10] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#70470b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#20382b]">{t("scanQr")}</button>
              </motion.div>
            ) : null}

            {hasBankTransfer && bank ? (
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.2 }} viewport={{ once: true }} className="flex flex-col items-center border border-[#20382b]/15 bg-white p-8 text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#20382b] text-white"><Building2 size={26} /></div>
                <h3 className="mb-4 font-heading text-2xl font-bold text-[#20382b]">{t("bankTransfer")}</h3>
                <div className="w-full space-y-4 bg-[#f7f8f6] p-6 text-left">
                  {bank.bank_name ? <div><p className="mb-1 text-xs font-semibold text-[#4a6741]">{t("bankLabel")}</p><p className="font-medium text-[#25231e]">{getLocalizedText(bank.bank_name, locale)}</p></div> : null}
                  {bank.account_name ? <div><p className="mb-1 text-xs font-semibold text-[#4a6741]">{t("accountNameLabel")}</p><p className="font-medium text-[#25231e]">{getLocalizedText(bank.account_name, locale)}</p></div> : null}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {bank.iban ? <div><p className="mb-1 text-xs font-semibold text-[#4a6741]">{t("ibanLabel")}</p><p className="break-all font-mono font-medium text-[#25231e]">{bank.iban}</p></div> : null}
                    {bank.bic ? <div><p className="mb-1 text-xs font-semibold text-[#4a6741]">{t("bicLabel")}</p><p className="font-mono font-medium text-[#25231e]">{bank.bic}</p></div> : null}
                  </div>
                  {bank.account_number ? <div><p className="mb-1 text-xs font-semibold text-[#4a6741]">{t("accountNumberLabel")}</p><p className="font-medium text-[#25231e]">{bank.account_number}</p></div> : null}
                </div>
              </motion.div>
            ) : null}
          </div>
        )}
      </div>

      {showQrModal && bank?.qr_image_url ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowQrModal(false)}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="donation-qr-title" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-sm bg-white p-6">
            <h3 id="donation-qr-title" className="mb-4 text-center font-heading text-2xl font-bold text-[#20382b]">{t("scanQr")}</h3>
            <div className="relative aspect-square overflow-hidden border border-[#20382b]/15 bg-white"><PublicImage src={bank.qr_image_url} alt={t("qrAlt")} fill fallbackSrc={donationFallbackImage} className="object-contain p-4" /></div>
            <button type="button" onClick={() => setShowQrModal(false)} className="mt-4 min-h-11 w-full rounded-full bg-[#20382b] py-3 font-semibold text-white transition-colors hover:bg-[#4a6741] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#20382b]">{t("close")}</button>
          </motion.div>
        </div>
      ) : null}
    </section>
  );
}
