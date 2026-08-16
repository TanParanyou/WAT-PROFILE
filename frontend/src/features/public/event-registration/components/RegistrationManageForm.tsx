"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/navigation";
import { createRegistrationFormSchema, type RegistrationFormValues, toRegistrationApiError } from "../schema";
import { EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION } from "../form-state";
import { useCancelGuestRegistration, useUpdateGuestRegistration } from "../queries";
import type { EventRegistrationDetail, RegistrationAvailability, RegistrationLocale } from "../types";
import { ParticipantFields } from "./ParticipantFields";

export function RegistrationManageForm({ token, registration, availability }: { token: string; registration: EventRegistrationDetail; availability?: RegistrationAvailability }) {
  const localeValue = useLocale();
  const locale: RegistrationLocale = localeValue === "en" || localeValue === "de" ? localeValue : "th";
  const t = useTranslations("EventRegistration");
  const schema = useMemo(() => createRegistrationFormSchema({ required: t("required"), emailInvalid: t("emailInvalid"), nameTooLong: t("nameTooLong"), emailTooLong: t("emailTooLong"), phoneTooLong: t("phoneTooLong"), freeTextTooLong: t("freeTextTooLong"), maxParticipants: t("maxParticipants"), privacyRequired: t("privacyRequired") }), [t]);
  const defaults: RegistrationFormValues = useMemo(() => ({ locale, contact: registration.contact, participants: registration.participants.filter((participant) => participant.attendance_status !== "cancelled").map(({ id, first_name, last_name, dietary_restrictions, special_needs, additional_notes }) => ({ id, first_name, last_name, dietary_restrictions, special_needs, additional_notes })), privacy_notice_version: EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION, privacy_consent: true }), [locale, registration]);
  const { register, control, reset, handleSubmit, setError, formState: { errors } } = useForm<RegistrationFormValues>({ resolver: zodResolver(schema), defaultValues: defaults, mode: "onBlur" });
  const update = useUpdateGuestRegistration();
  const cancel = useCancelGuestRegistration();
  const [rootError, setRootError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => { reset(defaults); }, [defaults, reset]);
  const onSubmit = async (values: RegistrationFormValues) => {
    setRootError("");
    try { await update.mutateAsync({ token, locale: values.locale, contact: values.contact, participants: values.participants }); }
    catch (error: unknown) { const apiError = toRegistrationApiError(error); if (apiError.fieldErrors.length === 0) setRootError(t("updateError")); for (const item of apiError.fieldErrors) if (isRegistrationFieldPath(item.field)) setError(item.field, { type: "server", message: item.message }); }
  };
  const handleCancel = async () => {
    setRootError("");
    if (!window.confirm(t("cancelConfirm"))) return;
    try { await cancel.mutateAsync({ token }); setCancelled(true); } catch { setRootError(t("cancelError")); }
  };
  if (cancelled) return <div className="border border-site-border bg-site-surface p-6"><h1 className="font-heading text-2xl font-semibold text-site-foreground">{t("cancelledTitle")}</h1><p className="mt-2 text-sm text-site-body">{t("cancelledDescription")}</p><Link href={`/events/${registration.event.slug}`} className="mt-5 inline-flex min-h-11 items-center border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action">{t("backToEvent")}</Link></div>;
  return <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
    {rootError ? <div role="alert" className="flex gap-2 border border-site-danger bg-site-danger-surface p-3 text-sm text-site-danger"><AlertCircle size={16} aria-hidden="true" />{rootError}</div> : null}
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="contact.first_name" label={t("firstName")} registration={register("contact.first_name")} error={errors.contact?.first_name?.message} />
      <Field id="contact.last_name" label={t("lastName")} registration={register("contact.last_name")} error={errors.contact?.last_name?.message} />
      <Field id="contact.email" label={t("email")} registration={register("contact.email")} error={errors.contact?.email?.message} />
      <Field id="contact.phone" label={t("phone")} registration={register("contact.phone")} error={errors.contact?.phone?.message} />
    </div>
    <ParticipantFields control={control} register={register} errors={errors} />
    <div className="flex flex-wrap gap-3">
      <button type="submit" disabled={update.isPending || (availability ? !availability.can_register : false)} className="inline-flex min-h-11 items-center gap-2 bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover disabled:opacity-60">{update.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}{t("saveChanges")}</button>
      <button type="button" onClick={() => void handleCancel()} disabled={cancel.isPending} className="inline-flex min-h-11 items-center border border-site-danger px-5 text-sm font-semibold text-site-danger hover:bg-site-danger-surface disabled:opacity-60">{t("cancelRegistration")}</button>
    </div>
  </form>;
}

function Field({ id, label, registration, error }: { id: string; label: string; registration: ReturnType<ReturnType<typeof useForm<RegistrationFormValues>>["register"]>; error?: string }) { return <div><label htmlFor={id} className="text-sm font-medium text-site-foreground">{label}</label><input id={id} className="mt-1 min-h-11 w-full border border-site-border bg-site-canvas px-3 text-sm text-site-foreground focus-visible:outline-3 focus-visible:outline-site-focus" {...registration} />{error ? <p className="mt-1 text-xs text-site-danger">{String(error)}</p> : null}</div>; }

function isRegistrationFieldPath(value: string): value is FieldPath<RegistrationFormValues> {
  return value === "privacy_consent" || value === "privacy_notice_version" || value === "locale" || value === "contact.first_name" || value === "contact.last_name" || value === "contact.email" || value === "contact.phone" || /^participants\.\d+\.(first_name|last_name|dietary_restrictions|special_needs|additional_notes)$/.test(value);
}
