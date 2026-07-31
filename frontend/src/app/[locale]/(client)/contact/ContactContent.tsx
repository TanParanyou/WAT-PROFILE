"use client";

import {
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/navigation";
import { PublicContactPageLayout } from "@/components/public/website/PublicContactPageLayout";
import { getLocalizedText } from "@/utils/localizedText";
import { sendContactEmail } from "@/services/emailService";
import type { ContactContentFormData } from "@/types/public-content";
import { usePublicContactQuery } from "@/features/public/content/queries";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";

interface ContactContentProps {
  locale: string;
  cmsPage?: ContactContentFormData | null;
}

export default function ContactContent({ locale, cmsPage }: ContactContentProps) {
  const t = useTranslations("ContactPage");
  const currentLocale = useLocale();
  const activeLocale = locale || currentLocale;
  const query = usePublicContactQuery();
  const resolvedPage = query.data ?? cmsPage;
  const successMessage = resolvedPage
    ? getLocalizedText(resolvedPage.body.contact_form.success_message, activeLocale) || t("messageSent")
    : t("messageSent");
  const privacyLink = resolvedPage?.body.contact_form.privacy_page_link || "/privacy";
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const pageTitle = resolvedPage ? getLocalizedText(resolvedPage.title, activeLocale) || t("title") : t("title");
  const pageSubtitle = resolvedPage ? getLocalizedText(resolvedPage.description, activeLocale) || t("subtitle") : t("subtitle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (status === "error") setStatus("idle");
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      return t("errorRequired");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return t("errorEmail");
    if (formData.message.length > 5000) return t("errorMessageLength");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await sendContactEmail(formData);
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setErrorMsg(t("errorSend"));
      setStatus("error");
    }
  };

  return (
    <PublicContactPageLayout
      page={
        resolvedPage || {
          title: { th: pageTitle, en: pageTitle, de: pageTitle },
          description: { th: pageSubtitle, en: pageSubtitle, de: pageSubtitle },
          seo: {
            title: { th: "", en: "", de: "" },
            description: { th: "", en: "", de: "" },
            keywords: { th: "", en: "", de: "" },
            og_image: "",
            canonical_url: "",
          },
          body: {
            address: { th: "", en: "", de: "" },
            phone: "",
            email: "",
            opening_hours: {
              days: { th: "", en: "", de: "" },
              time: { th: "", en: "", de: "" },
              notice: { th: "", en: "", de: "" },
            },
            map: {
              name: { th: "", en: "", de: "" },
              embed_url: "",
              directions_url: "",
            },
            transport: {
              parking: { th: "", en: "", de: "" },
              public_transport: [],
              driving: { th: "", en: "", de: "" },
            },
            socials: {
              facebook: "",
              instagram: "",
              messenger: "",
              line: "",
              youtube: "",
            },
            bank: {
              bank_name: { th: "", en: "", de: "" },
              account_name: { th: "", en: "", de: "" },
              account_number: "",
              iban: "",
              bic: "",
            },
            contact_form: {
              enabled: true,
              success_message: { th: "", en: "", de: "" },
              privacy_page_link: "/privacy",
            },
          },
        }
      }
      locale={activeLocale}
      labels={{
        infoEyebrow: t("subtitle"),
        infoTitle: t("infoTitle"),
        messageEyebrow: t("subtitle"),
        formTitle: t("formTitle"),
        address: t("address"),
        phone: t("phone"),
        email: t("email"),
        social: t("social"),
        bank: t("bank"),
      }}
      formSlot={
        <form
          className="space-y-5"
          onSubmit={handleSubmit}
          aria-describedby={status === "error" ? "contact-form-error" : undefined}
        >
          {query.isError ? <QueryErrorState title={t("contentErrorTitle")} description={t("contentErrorDescription")} retryLabel={t("retryContent")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="name" label={t("fullName")} value={formData.name} onChange={handleChange} />
            <Field id="email" label={t("email")} value={formData.email} onChange={handleChange} type="email" />
          </div>
          <Field id="subject" label={t("subject")} value={formData.subject} onChange={handleChange} />
          <Field id="message" label={t("message")} value={formData.message} onChange={handleChange} textarea />
          {errorMsg && (
            <div id="contact-form-error" role="alert" className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {status === "success" && (
            <div role="status" aria-live="polite" className="flex items-center gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}
          <p className="text-sm leading-6 text-text-700">
            {t("privacyNotice")}{" "}
            <Link href={privacyLink} className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              {t("privacyLink")}
            </Link>
          </p>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex min-h-11 items-center gap-2 bg-[#333] px-6 py-[13px] font-semibold text-[#fffef2] transition-colors hover:bg-[#242424] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#945c26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {t("sendMessage")}
          </button>
        </form>
      }
    />
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  textarea?: boolean;
}) {
  const base = "mt-2 min-h-11 w-full border border-[#333] bg-[#fffef2] px-3 py-2.5 text-base text-[#333] outline-none transition-colors placeholder:text-[#666] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#945c26]";
  return (
    <label className="block text-sm font-semibold text-text-800" htmlFor={id}>
      {label}
      {textarea ? (
        <textarea id={id} value={value} onChange={onChange} rows={6} className={base} required />
      ) : (
        <input id={id} type={type} value={value} onChange={onChange} className={base} required />
      )}
    </label>
  );
}
