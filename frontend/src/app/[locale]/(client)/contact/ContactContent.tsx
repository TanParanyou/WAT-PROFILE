"use client";

import {
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { PublicContactPageLayout } from "@/components/public/website/PublicContactPageLayout";
import { getLocalizedText } from "@/utils/localizedText";
import { sendContactEmail } from "@/services/emailService";
import type { PublicContentPage } from "@/types/website-cms";

interface ContactContentProps {
  locale: string;
  cmsPage: PublicContentPage | null;
}

export default function ContactContent({ locale, cmsPage }: ContactContentProps) {
  const t = useTranslations("ContactPage");
  const currentLocale = useLocale();
  const activeLocale = locale || currentLocale;
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const pageTitle = cmsPage ? getLocalizedText(cmsPage.title, activeLocale) || t("title") : t("title");
  const pageSubtitle = cmsPage ? getLocalizedText(cmsPage.description, activeLocale) || t("subtitle") : t("subtitle");

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
        cmsPage || {
          id: "fallback-contact",
          page_key: "PAGE-CONTACT",
          slug: "contact",
          title: { th: pageTitle, en: pageTitle, de: pageTitle },
          description: { th: pageSubtitle, en: pageSubtitle, de: pageSubtitle },
          seo: {},
          body: {},
          settings: {},
          status: "published",
          sections: [],
          published_at: null,
        }
      }
      locale={activeLocale}
      labels={{
        infoEyebrow: "Contact",
        infoTitle: t("infoTitle"),
        messageEyebrow: "Message",
        formTitle: t("formTitle"),
        address: t("address"),
        phone: t("phone"),
        email: t("email"),
        social: "Social",
        bank: "Bank Donation",
      }}
      formSlot={
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="name" label={t("fullName")} value={formData.name} onChange={handleChange} />
            <Field id="email" label={t("email")} value={formData.email} onChange={handleChange} type="email" />
          </div>
          <Field id="subject" label={t("subject")} value={formData.subject} onChange={handleChange} />
          <Field id="message" label={t("message")} value={formData.message} onChange={handleChange} textarea />
          {errorMsg && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle size={16} />
              <span>Message sent successfully</span>
            </div>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 border border-zinc-950 bg-zinc-950 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
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
  const base = "mt-2 w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950";
  return (
    <label className="block text-sm font-medium text-zinc-700" htmlFor={id}>
      {label}
      {textarea ? (
        <textarea id={id} value={value} onChange={onChange} rows={6} className={base} />
      ) : (
        <input id={id} type={type} value={value} onChange={onChange} className={base} />
      )}
    </label>
  );
}
