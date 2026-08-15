"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/navigation";
import { createRegistrationFormSchema, type RegistrationFormValues } from "../schema";
import { createRegistrationDefaults, EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION } from "../form-state";
import { useCreateEventRegistration } from "../queries";
import { toRegistrationApiError } from "../schema";
import type { EventRegistrationDetail, RegistrationAvailability, RegistrationLocale } from "../types";
import { ParticipantFields } from "./ParticipantFields";
import { RegistrationSuccess } from "./RegistrationSuccess";

interface RegistrationFormProps {
  eventId: number;
  availability?: RegistrationAvailability;
}

export function RegistrationForm({ eventId, availability }: RegistrationFormProps) {
  const localeValue = useLocale();
  const locale: RegistrationLocale = localeValue === "en" || localeValue === "de" ? localeValue : "th";
  const t = useTranslations("EventRegistration");
  const schema = useMemo(() => createRegistrationFormSchema({ required: t("required"), emailInvalid: t("emailInvalid"), maxParticipants: t("maxParticipants"), privacyRequired: t("privacyRequired") }), [t]);
  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<RegistrationFormValues>({ resolver: zodResolver(schema), defaultValues: createRegistrationDefaults(locale), mode: "onBlur", shouldFocusError: true });
  const mutation = useCreateEventRegistration();
  const [success, setSuccess] = useState<EventRegistrationDetail | null>(null);
  const [rootError, setRootError] = useState("");

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

  const unavailable = availability && !availability.can_register;
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} aria-describedby={rootError ? "registration-form-error" : undefined}>
      {unavailable ? <div className="border border-site-border bg-site-surface p-4 text-sm text-site-body">{t(`availability.${availability.availability}`)}</div> : null}
      {rootError ? <div id="registration-form-error" role="alert" className="flex items-start gap-2 border border-site-danger bg-site-danger-surface p-3 text-sm text-site-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{rootError}</div> : null}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-site-foreground">{t("contactTitle")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contact.first_name" label={t("firstName")} registration={register("contact.first_name")} error={errors.contact?.first_name?.message} />
          <Field id="contact.last_name" label={t("lastName")} registration={register("contact.last_name")} error={errors.contact?.last_name?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contact.email" label={t("email")} type="email" registration={register("contact.email")} error={errors.contact?.email?.message} />
          <Field id="contact.phone" label={t("phone")} type="tel" registration={register("contact.phone")} error={errors.contact?.phone?.message} />
        </div>
      </fieldset>
      <ParticipantFields control={control} register={register} errors={errors} />
      <div className="border-t border-site-border pt-5">
        <label className="flex items-start gap-3 text-sm leading-6 text-site-body">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-site-accent" {...register("privacy_consent")} />
          <span>{t("privacyConsent")} <Link href="/privacy" className="underline underline-offset-4">{t("privacyLink")}</Link> ({EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION})</span>
        </label>
        {errors.privacy_consent?.message ? <p className="mt-1 text-xs text-site-danger" role="alert">{String(errors.privacy_consent.message)}</p> : null}
      </div>
      <button type="submit" disabled={mutation.isPending || unavailable} className="inline-flex min-h-11 items-center gap-2 bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover disabled:cursor-not-allowed disabled:opacity-60">
        {mutation.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}{mutation.isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function isRegistrationFieldPath(value: string): value is FieldPath<RegistrationFormValues> {
  return value === "privacy_consent" || value === "privacy_notice_version" || value === "locale" || value === "contact.first_name" || value === "contact.last_name" || value === "contact.email" || value === "contact.phone" || /^participants\.\d+\.(first_name|last_name|dietary_restrictions|special_needs|additional_notes)$/.test(value);
}

function Field({ id, label, registration, error, type = "text" }: { id: string; label: string; registration: ReturnType<ReturnType<typeof useForm<RegistrationFormValues>>["register"]>; error?: string; type?: string }) {
  return <div><label htmlFor={id} className="text-sm font-medium text-site-foreground">{label}</label><input id={id} type={type} className="mt-1 min-h-11 w-full border border-site-border bg-site-canvas px-3 text-sm text-site-foreground outline-none focus:border-site-focus focus-visible:outline-3 focus-visible:outline-site-focus" {...registration} />{error ? <p className="mt-1 text-xs text-site-danger" role="alert">{String(error)}</p> : null}</div>;
}
