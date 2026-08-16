"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/navigation";
import { createRegistrationFormSchema, type RegistrationFormValues } from "../schema";
import { applyRegistrationAccountDefaults, createRegistrationDefaults, EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION } from "../form-state";
import { useCreateEventRegistration } from "../queries";
import { toRegistrationApiError } from "../schema";
import type { EventRegistrationDetail, RegistrationAvailability, RegistrationLocale } from "../types";
import { ParticipantFields } from "./ParticipantFields";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";

interface RegistrationFormProps {
  eventId: number;
  availability?: RegistrationAvailability;
}

export function RegistrationForm({ eventId, availability }: RegistrationFormProps) {
  const localeValue = useLocale();
  const locale: RegistrationLocale = localeValue === "en" || localeValue === "de" ? localeValue : "th";
  const t = useTranslations("EventRegistration");
  const session = useAccountSession();
  const schema = useMemo(() => createRegistrationFormSchema({
    required: t("required"),
    emailInvalid: t("emailInvalid"),
    nameTooLong: t("nameTooLong"),
    emailTooLong: t("emailTooLong"),
    phoneTooLong: t("phoneTooLong"),
    freeTextTooLong: t("freeTextTooLong"),
    maxParticipants: t("maxParticipants"),
    privacyRequired: t("privacyRequired"),
  }), [t]);
  const { register, control, handleSubmit, reset, setError, formState: { errors, isDirty } } = useForm<RegistrationFormValues>({ resolver: zodResolver(schema), defaultValues: createRegistrationDefaults(locale), mode: "onBlur", shouldFocusError: true });
  const mutation = useCreateEventRegistration();
  const [success, setSuccess] = useState<EventRegistrationDetail | null>(null);
  const [rootError, setRootError] = useState("");
  const accountDefaultsApplied = useRef(false);

  useEffect(() => {
    const account = session.account;
    if (accountDefaultsApplied.current || session.status !== "authenticated" || !account) return;
    if (isDirty) {
      accountDefaultsApplied.current = true;
      return;
    }
    reset((values) => applyRegistrationAccountDefaults(values, account));
    accountDefaultsApplied.current = true;
  }, [isDirty, reset, session.account, session.status]);

  if (success) return <RegistrationSuccess registration={success} />;

  const onSubmit = async (values: RegistrationFormValues) => {
    setRootError("");
    try {
      const detail = await mutation.mutateAsync({ eventId, input: { ...values, participants: values.participants } });
      setSuccess(detail);
    } catch (error: unknown) {
      const apiError = toRegistrationApiError(error);
      let mapped = 0;
      for (const fieldError of apiError.fieldErrors) {
        if (isRegistrationFieldPath(fieldError.field)) {
          setError(fieldError.field, { type: "server", message: fieldError.message });
          mapped += 1;
        }
      }
      if (mapped === 0) {
        const localizedCodes = ["REGISTRATION_DISABLED", "REGISTRATION_CLOSED", "EVENT_FULL", "ALREADY_REGISTERED", "GROUP_LIMIT_EXCEEDED", "REGISTRATION_CONFLICT", "REGISTRATION_RATE_LIMITED"] as const;
        setRootError(localizedCodes.includes(apiError.code as (typeof localizedCodes)[number]) ? t(`errors.${apiError.code}`) : t("submitError"));
      }
    }
  };

  const onInvalid = () => setRootError(t("validationSummary"));

  const unavailable = availability && !availability.can_register;
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)} aria-busy={mutation.isPending} aria-describedby={rootError ? "registration-form-error" : undefined}>
      {unavailable ? <div className="border border-site-border bg-site-surface p-4 text-sm text-site-body">{t(`availability.${availability.availability}`)}</div> : null}
      {rootError ? <div id="registration-form-error" role="alert" aria-live="polite" className="flex items-start gap-2 border border-site-danger bg-site-danger-surface p-3 text-sm text-site-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{rootError}</div> : null}
      <fieldset className="space-y-4" disabled={Boolean(unavailable)}>
        <legend className="text-base font-semibold text-site-foreground">{t("contactTitle")}</legend>
        <p className="text-sm leading-6 text-site-muted">{t("contactDescription")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contact.first_name" label={t("firstName")} registration={register("contact.first_name")} error={errors.contact?.first_name?.message} required autoComplete="given-name" maxLength={100} />
          <Field id="contact.last_name" label={t("lastName")} registration={register("contact.last_name")} error={errors.contact?.last_name?.message} required autoComplete="family-name" maxLength={100} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contact.email" label={t("email")} type="email" registration={register("contact.email")} error={errors.contact?.email?.message} required autoComplete="email" maxLength={255} />
          <Field id="contact.phone" label={t("phone")} type="tel" registration={register("contact.phone")} error={errors.contact?.phone?.message} autoComplete="tel" maxLength={20} />
        </div>
      </fieldset>
      <ParticipantFields control={control} register={register} errors={errors} disabled={Boolean(unavailable)} />
      <fieldset className="border-t border-site-border pt-5" disabled={Boolean(unavailable)}>
        <legend className="sr-only">{t("privacyTitle")}</legend>
        <label className="flex items-start gap-3 text-sm leading-6 text-site-body">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-site-accent" aria-invalid={Boolean(errors.privacy_consent)} aria-describedby={errors.privacy_consent ? "privacy-consent-error" : undefined} {...register("privacy_consent")} />
          <span>{t("privacyConsent")} <Link href="/privacy" className="underline underline-offset-4">{t("privacyLink")}</Link> ({EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION})</span>
        </label>
        {errors.privacy_consent?.message ? <p id="privacy-consent-error" className="mt-1 text-xs text-site-danger" role="alert">{String(errors.privacy_consent.message)}</p> : null}
      </fieldset>
      <button type="submit" disabled={mutation.isPending || unavailable} className="inline-flex min-h-11 items-center gap-2 bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover disabled:cursor-not-allowed disabled:opacity-60">
        {mutation.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}{mutation.isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function isRegistrationFieldPath(value: string): value is FieldPath<RegistrationFormValues> {
  return value === "privacy_consent" || value === "privacy_notice_version" || value === "locale" || value === "contact.first_name" || value === "contact.last_name" || value === "contact.email" || value === "contact.phone" || /^participants\.\d+\.(first_name|last_name|dietary_restrictions|special_needs|additional_notes)$/.test(value);
}

function Field({ id, label, registration, error, type = "text", required = false, autoComplete, maxLength }: { id: string; label: string; registration: ReturnType<ReturnType<typeof useForm<RegistrationFormValues>>["register"]>; error?: string; type?: string; required?: boolean; autoComplete?: string; maxLength?: number }) {
  const errorId = `${id.replaceAll(".", "-")}-error`;
  return <div><label htmlFor={id} className="text-sm font-medium text-site-foreground">{label}{required ? <span aria-hidden="true"> *</span> : null}</label><input id={id} type={type} autoComplete={autoComplete} maxLength={maxLength} aria-required={required || undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className="mt-1 min-h-11 w-full border border-site-border bg-site-canvas px-3 text-sm text-site-foreground outline-none focus:border-site-focus focus-visible:outline-3 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60" {...registration} />{error ? <p id={errorId} className="mt-1 text-xs text-site-danger" role="alert">{String(error)}</p> : null}</div>;
}
