"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitSelfReportedDonation } from "./api";
import { selfReportedDonationSchema } from "./schema";

export function DonationForm() {
  const t = useTranslations("DonationSection");
  const locale = useLocale() as "th" | "en" | "de";
  const [method, setMethod] = useState<"bank_transfer" | "paypal">("bank_transfer");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);
    const form = new FormData(event.currentTarget);
    const parsed = selfReportedDonationSchema.safeParse({ amount: form.get("amount"), currency: form.get("currency"), donation_method: method, donor_name: form.get("donor_name"), donor_email: form.get("donor_email"), donor_phone: form.get("donor_phone") || undefined, locale, proof: form.get("proof") });
    if (!parsed.success) { setError(t("reportError")); return; }
    setPending(true);
    try { await submitSelfReportedDonation(parsed.data); setMessage(t("reportSuccess")); event.currentTarget.reset(); }
    catch { setError(t("reportError")); }
    finally { setPending(false); }
  }

  return <form onSubmit={submit} className="mt-8 grid gap-4 border border-site-border bg-site-canvas p-6 md:grid-cols-2">
    <h3 className="md:col-span-2 font-heading text-2xl">{t("reportTitle")}</h3>
    <label className="grid gap-2 text-sm"><span>{t("amountLabel")}</span><input name="amount" type="number" min="0.01" step="0.01" required className="min-h-11 border border-site-border bg-white px-3" /></label>
    <label className="grid gap-2 text-sm"><span>{t("methodLabel")}</span><select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="min-h-11 border border-site-border bg-white px-3"><option value="bank_transfer">{t("bankTransfer")}</option><option value="paypal">PayPal</option></select></label>
    <label className="grid gap-2 text-sm"><span>{t("nameLabel")}</span><input name="donor_name" required className="min-h-11 border border-site-border bg-white px-3" /></label>
    <label className="grid gap-2 text-sm"><span>{t("emailLabel")}</span><input name="donor_email" type="email" required className="min-h-11 border border-site-border bg-white px-3" /></label>
    <label className="grid gap-2 text-sm md:col-span-2"><span>{t("proofLabel")}</span><input name="proof" type="file" accept="image/*,application/pdf" required className="min-h-11 border border-site-border bg-white px-3 py-2" /></label>
    <button disabled={pending} className="min-h-11 bg-site-action px-5 py-3 text-sm font-semibold text-site-on-action disabled:opacity-50 md:col-span-2">{pending ? t("submitting") : t("submitReport")}</button>
    {message ? <p role="status" className="text-sm text-green-700 md:col-span-2">{message}</p> : null}
    {error ? <p role="alert" className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
  </form>;
}
