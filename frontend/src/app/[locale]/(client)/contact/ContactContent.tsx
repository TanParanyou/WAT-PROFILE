"use client";

import {
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Link } from "@/navigation";
import { PublicContactPageLayout } from "@/components/public/website/PublicContactPageLayout";
import { getLocalizedText } from "@/utils/localizedText";
import type { ContactContentFormData } from "@/types/public-content";
import { usePublicContactQuery } from "@/features/public/content/queries";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { createContactSchema, type ContactFormValues } from "@/features/public/contact/schema";
import { useSubmitPublicContact } from "@/features/public/contact/queries";
import { isPublicContactApiError } from "@/features/public/contact/types";
import type { ContactField, ContactLocale } from "@/features/public/contact/types";

interface ContactContentProps {
  locale: string;
  cmsPage?: ContactContentFormData | null;
}

export default function ContactContent({ locale, cmsPage }: ContactContentProps) {
  const t = useTranslations("ContactPage");
  const currentLocale = useLocale();
  const activeLocale = locale || currentLocale;
  const communicationLocale: ContactLocale = activeLocale === "en" || activeLocale === "de" ? activeLocale : "th";
  const query = usePublicContactQuery();
  const resolvedPage = query.data ?? cmsPage;
  const successMessage = resolvedPage
    ? getLocalizedText(resolvedPage.body.contact_form.success_message, activeLocale) || t("messageSent")
    : t("messageSent");
  const privacyLink = resolvedPage?.body.contact_form.privacy_page_link || "/privacy";
  const schema = useMemo(() => createContactSchema({
    required: t("errorRequired"),
    invalidEmail: t("errorEmail"),
    nameLimit: t("errorNameLength"),
    emailLimit: t("errorEmailLength"),
    subjectLimit: t("errorSubjectLength"),
    messageLimit: t("errorMessageLength"),
  }), [t]);
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });
  const submitMutation = useSubmitPublicContact();
  const [submitted, setSubmitted] = useState(false);
  const [rootError, setRootError] = useState("");

  const pageTitle = resolvedPage ? getLocalizedText(resolvedPage.title, activeLocale) || t("title") : t("title");
  const pageSubtitle = resolvedPage ? getLocalizedText(resolvedPage.description, activeLocale) || t("subtitle") : t("subtitle");

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitted(false);
    setRootError("");
    try {
      await submitMutation.mutateAsync({
        ...values,
        locale: communicationLocale,
      });
      reset();
      setSubmitted(true);
    } catch (error: unknown) {
      if (isPublicContactApiError(error)) {
        let mappedFields = 0;
        for (const [fieldName, message] of Object.entries(error.fields)) {
          if (isVisibleContactField(fieldName)) {
            mappedFields += 1;
            setError(fieldName, { type: "server", message }, { shouldFocus: mappedFields === 1 });
          }
        }
        if (error.code === "CONTACT_RATE_LIMITED") {
          setRootError(t("errorRateLimit", { seconds: Math.max(1, error.retryAfterSeconds) }));
        } else if (mappedFields === 0) {
          setRootError(t("errorSend"));
        }
        return;
      }
      setRootError(t("errorSend"));
    }
  };

  const fieldError = (field: Exclude<ContactField, "locale">) => {
    const message = errors[field]?.message;
    return message ? String(message) : undefined;
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
          onSubmit={handleSubmit(onSubmit)}
          aria-describedby={rootError ? "contact-form-error" : undefined}
        >
          {query.isError ? <QueryErrorState title={t("contentErrorTitle")} description={t("contentErrorDescription")} retryLabel={t("retryContent")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="name" label={t("fullName")} registration={register("name")} error={fieldError("name")} maxLength={120} autoComplete="name" />
            <Field id="email" label={t("email")} registration={register("email")} error={fieldError("email")} type="email" maxLength={254} autoComplete="email" />
          </div>
          <Field id="subject" label={t("subject")} registration={register("subject")} error={fieldError("subject")} maxLength={200} />
          <Field id="message" label={t("message")} registration={register("message")} error={fieldError("message")} maxLength={5000} textarea />
          <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" tabIndex={-1} autoComplete="off" {...register("website")} />
          </div>
          {rootError && (
            <div id="contact-form-error" role="alert" className="flex items-start gap-2 border border-site-danger bg-site-danger-surface p-3 text-sm text-site-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{rootError}</span>
            </div>
          )}
          {submitted && (
            <div role="status" aria-live="polite" className="flex items-center gap-2 border border-site-border bg-site-surface p-3 text-sm text-site-foreground">
              <CheckCircle size={16} aria-hidden="true" />
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
            disabled={submitMutation.isPending}
            className="inline-flex min-h-11 items-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            {submitMutation.isPending ? t("sending") : t("sendMessage")}
          </button>
        </form>
      }
    />
  );
}

function Field({
  id,
  label,
  registration,
  error,
  type = "text",
  textarea = false,
  maxLength,
  autoComplete,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: "text" | "email";
  textarea?: boolean;
  maxLength: number;
  autoComplete?: string;
}) {
  const base = "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
  const errorId = `${id}-error`;
  return (
    <div>
      <label className="block text-sm font-semibold text-text-800" htmlFor={id}>
      {label}
      {textarea ? (
        <textarea id={id} rows={6} className={base} required maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...registration} />
      ) : (
        <input id={id} type={type} className={base} required maxLength={maxLength} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...registration} />
      )}
      </label>
      {error ? <p id={errorId} role="alert" className="mt-1 text-sm text-site-danger">{error}</p> : null}
    </div>
  );
}

function isVisibleContactField(value: string): value is Exclude<ContactField, "locale"> {
  return value === "name" || value === "email" || value === "subject" || value === "message";
}
