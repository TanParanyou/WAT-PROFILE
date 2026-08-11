"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "@/navigation";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { useUnsavedChanges } from "@/features/public/account/hooks/useUnsavedChanges";
import { usePublicDonationCategoriesQuery } from "./queries";
import { isPublicDonationApiError, submitSelfReportedDonation, type SelfReportedDonationPayload } from "./api";
import { DonationProofUpload } from "./DonationProofUpload";
import { createSelfReportedDonationSchema, type SelfReportedDonationValues } from "./schema";

const inputClassName = "box-border h-11 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2 text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const fieldClassName = "flex min-w-0 flex-col gap-2";
const fullWidthFieldClassName = `${fieldClassName} md:col-span-2`;
type DonationLocale = "th" | "en" | "de";
const fieldNames: readonly (keyof SelfReportedDonationValues)[] = [
  "amount",
  "currency",
  "donation_date",
  "donation_time",
  "donation_method",
  "donor_name",
  "donor_email",
  "donor_phone",
  "category_id",
  "proof",
  "receipt_requested",
  "privacy_acknowledged",
];

function localeValue(locale: string): DonationLocale {
  return locale === "th" || locale === "en" || locale === "de" ? locale : "en";
}

function defaultDonationValues(locale: DonationLocale) {
  return {
    currency: "EUR" as const,
    donation_date: "",
    donation_time: "",
    donation_method: "bank_transfer" as const,
    locale,
    receipt_requested: false,
    privacy_acknowledged: false,
    category_id: null,
  };
}

interface DonationReportFormProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

export function DonationReportForm({ onDirtyChange }: DonationReportFormProps) {
  const t = useTranslations("DonationReportPage");
  const locale = localeValue(useLocale());
  const categoryQuery = usePublicDonationCategoriesQuery();
  const [submitted, setSubmitted] = useState(false);
  const defaultValues = defaultDonationValues(locale);
  const schema = useMemo(() => createSelfReportedDonationSchema({
    amountPositive: t("amountPositive"),
    amountDecimals: t("amountDecimals"),
    currency: t("currencyError"),
    dateRequired: t("dateRequired"),
    dateInvalid: t("dateInvalid"),
    timeRequired: t("timeRequired"),
    timeInvalid: t("timeInvalid"),
    method: t("methodError"),
    nameRequired: t("nameRequired"),
    emailRequired: t("emailRequired"),
    emailInvalid: t("emailInvalid"),
    phoneInvalid: t("phoneInvalid"),
    categoryInvalid: t("categoryInvalid"),
    receiptEmail: t("receiptEmail"),
    privacyRequired: t("privacyRequired"),
    proofRequired: t("proofRequired"),
    proofType: t("proofType"),
    proofSize: t("proofSize"),
  }), [t]);
  const { control, register, handleSubmit, reset, setError, formState: { errors, isDirty, isSubmitting } } = useForm<z.input<typeof schema>, unknown, SelfReportedDonationValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues,
  });

  useUnsavedChanges({
    isDirty: isDirty && !isSubmitting,
    message: t("unsavedChangesMessage"),
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const errorMessage = (field: keyof SelfReportedDonationValues) => {
    const message = errors[field]?.message;
    return message ? String(message) : null;
  };

  const validationErrorCount = fieldNames.filter((field) => Boolean(errors[field])).length;

  function discardChanges() {
    if (typeof window !== "undefined" && !window.confirm(t("discardChangesMessage"))) return;
    reset(defaultValues);
    setSubmitted(false);
  }

  async function onSubmit(values: SelfReportedDonationValues) {
    setSubmitted(false);
    const payload: SelfReportedDonationPayload = { ...values, locale, donor_phone: values.donor_phone?.trim() || undefined };
    try {
      await submitSelfReportedDonation(payload);
      reset(defaultValues);
      setSubmitted(true);
    } catch (error: unknown) {
      if (isPublicDonationApiError(error)) {
        let mappedFields = 0;
        for (const [fieldName, message] of Object.entries(error.fields)) {
          const field = fieldNames.find((name) => name === fieldName);
          if (field) {
            mappedFields += 1;
            setError(field, { type: "server", message }, { shouldFocus: true });
          }
        }
        if (mappedFields === 0) setError("root.server", { type: "server", message: t("serverError") });
      } else {
        setError("root.server", { type: "server", message: t("serverError") });
      }
    }
  }

  if (submitted) {
    return (
      <section aria-live="polite" className="border border-site-border bg-site-canvas p-6 sm:p-8">
        <p role="status" className="text-lg leading-8 text-site-body">{t("reportSuccess")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/#donate" className="inline-flex min-h-11 items-center bg-site-action px-5 py-3 text-sm font-semibold text-site-on-action focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">{t("backToDonation")}</Link>
          <button type="button" onClick={() => setSubmitted(false)} className="min-h-11 border border-site-border px-5 py-3 text-sm font-semibold text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">{t("submitReport")}</button>
        </div>
      </section>
    );
  }

  const serverError = errors.root?.server?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="border border-site-border bg-site-canvas">
      <fieldset className="p-4 sm:p-6">
        <legend className="px-2 font-heading text-xl text-site-foreground">{t("detailsTitle")}</legend>
        <div className="grid gap-4">
          <p className="max-w-[65ch] text-sm leading-6 text-site-body">{t("detailsDescription")}</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className={fieldClassName}>
              <label htmlFor="donation-amount" className="text-sm font-semibold text-site-foreground">{t("amountLabel")}</label>
              <input id="donation-amount" type="number" min="0.01" step="0.01" inputMode="decimal" aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? "donation-amount-error donation-amount-hint" : "donation-amount-hint"} {...register("amount")} className={inputClassName} />
              <div className="grid min-h-12 content-start gap-1">
                <p id="donation-amount-hint" className="text-xs leading-5 text-site-muted">{t("amountHint")}</p>
                {errorMessage("amount") ? <p id="donation-amount-error" role="alert" className="text-sm text-site-danger">{errorMessage("amount")}</p> : null}
              </div>
            </div>
            <div className={fieldClassName}>
              <label htmlFor="donation-currency" className="text-sm font-semibold text-site-foreground">{t("currencyLabel")}</label>
              <select id="donation-currency" aria-invalid={Boolean(errors.currency)} aria-describedby={errors.currency ? "donation-currency-error" : undefined} {...register("currency")} className={inputClassName}><option value="EUR">EUR</option></select>
              <div className="min-h-5">{errorMessage("currency") ? <p id="donation-currency-error" role="alert" className="text-sm text-site-danger">{errorMessage("currency")}</p> : null}</div>
            </div>
            <Controller
              control={control}
              name="donation_date"
              render={({ field }) => (
                <DatePicker
                  id="donation-date"
                  label={t("dateLabel")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errorMessage("donation_date") ?? undefined}
                  required
                  variant="public"
                  locale={locale}
                  placeholder={t("datePlaceholder")}
                />
              )}
            />
            <Controller
              control={control}
              name="donation_time"
              render={({ field }) => (
                <TimePicker
                  id="donation-time"
                  label={t("timeLabel")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errorMessage("donation_time") ?? undefined}
                  required
                  variant="public"
                  locale={locale}
                  placeholder={t("timePlaceholder")}
                  timeCaption={t("timeLabel")}
                />
              )}
            />
            <div className={fieldClassName}>
              <label htmlFor="donation-method" className="text-sm font-semibold text-site-foreground">{t("methodLabel")}</label>
              <select id="donation-method" aria-invalid={Boolean(errors.donation_method)} aria-describedby={errors.donation_method ? "donation-method-error" : undefined} {...register("donation_method")} className={inputClassName}>
                <option value="bank_transfer">{t("bankTransfer")}</option>
                <option value="paypal">{t("paypal")}</option>
              </select>
              <div className="min-h-5">{errorMessage("donation_method") ? <p id="donation-method-error" role="alert" className="text-sm text-site-danger">{errorMessage("donation_method")}</p> : null}</div>
            </div>
            <div className={fullWidthFieldClassName}>
              <label htmlFor="donation-category" className="text-sm font-semibold text-site-foreground">{t("categoryLabel")}</label>
              <select id="donation-category" aria-busy={categoryQuery.isLoading} aria-invalid={Boolean(errors.category_id)} aria-describedby={errors.category_id ? "donation-category-error" : undefined} disabled={categoryQuery.isLoading} {...register("category_id", { setValueAs: (value: unknown) => value === "" ? null : Number(value) })} className={inputClassName}>
                <option value="">{t("generalCategory")}</option>
                {(categoryQuery.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name[locale] || category.name.en || category.name.th || category.name.de}</option>)}
              </select>
              {categoryQuery.isLoading ? <p role="status" aria-live="polite" className="text-xs leading-5 text-site-muted">{t("categoryLoading")}</p> : null}
              <div className="min-h-5">
                {categoryQuery.isError ? <p role="alert" className="text-sm text-site-danger">{t("categoryLoadError")}</p> : null}
                {errorMessage("category_id") ? <p id="donation-category-error" role="alert" className="text-sm text-site-danger">{errorMessage("category_id")}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="border-t border-site-border p-4 sm:p-6">
        <legend className="px-2 font-heading text-xl text-site-foreground">{t("contactTitle")}</legend>
        <div className="grid gap-4">
          <p className="max-w-[65ch] text-sm leading-6 text-site-body">{t("contactDescription")}</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className={fieldClassName}>
              <label htmlFor="donor-name" className="text-sm font-semibold text-site-foreground">{t("nameLabel")}</label>
              <input id="donor-name" autoComplete="name" aria-invalid={Boolean(errors.donor_name)} aria-describedby={errors.donor_name ? "donor-name-error" : undefined} {...register("donor_name")} className={inputClassName} />
              <div className="min-h-5">{errorMessage("donor_name") ? <p id="donor-name-error" role="alert" className="text-sm text-site-danger">{errorMessage("donor_name")}</p> : null}</div>
            </div>
            <div className={fieldClassName}>
              <label htmlFor="donor-email" className="text-sm font-semibold text-site-foreground">{t("emailLabel")}</label>
              <input id="donor-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.donor_email)} aria-describedby={errors.donor_email ? "donor-email-error" : undefined} {...register("donor_email")} className={inputClassName} />
              <div className="min-h-5">{errorMessage("donor_email") ? <p id="donor-email-error" role="alert" className="text-sm text-site-danger">{errorMessage("donor_email")}</p> : null}</div>
            </div>
            <div className={fullWidthFieldClassName}>
              <label htmlFor="donor-phone" className="text-sm font-semibold text-site-foreground">{t("phoneLabel")}</label>
              <input id="donor-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.donor_phone)} aria-describedby={errors.donor_phone ? "donor-phone-error" : undefined} {...register("donor_phone")} className={inputClassName} />
              <div className="min-h-5">{errorMessage("donor_phone") ? <p id="donor-phone-error" role="alert" className="text-sm text-site-danger">{errorMessage("donor_phone")}</p> : null}</div>
            </div>
          </div>
          <div className={fieldClassName}>
            <label htmlFor="donation-proof" className="text-sm font-semibold text-site-foreground">{t("proofLabel")}</label>
            <Controller
              control={control}
              name="proof"
              render={({ field }) => (
                <DonationProofUpload
                  id="donation-proof"
                  file={field.value}
                  error={errorMessage("proof") ?? undefined}
                  locale={locale}
                  onChange={(file) => field.onChange(file)}
                  messages={{
                    hint: t("proofHint"),
                    choose: t("proofChoose"),
                    drop: t("proofDrop"),
                    replace: t("proofReplace"),
                    remove: t("proofRemove"),
                    image: t("proofImage"),
                    pdf: t("proofPdf"),
                    previewAlt: t("proofPreviewAlt"),
                    preview: t("proofPreview"),
                    open: t("proofOpen"),
                    download: t("proofDownload"),
                    zoom: t("proofZoom"),
                    zoomIn: t("proofZoomIn"),
                    zoomOut: t("proofZoomOut"),
                    zoomReset: t("proofZoomReset"),
                    previewClose: t("proofPreviewClose"),
                    invalidType: t("proofSelectionInvalidType"),
                    tooLarge: t("proofSelectionTooLarge"),
                  }}
                />
              )}
            />
          </div>
          <div className="grid gap-4 border-t border-site-border pt-6">
            <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-site-body"><input type="checkbox" className="mt-1 size-5 shrink-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus" {...register("receipt_requested")} /><span>{t("receiptRequested")}</span></label>
            <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-site-body"><input type="checkbox" className="mt-1 size-5 shrink-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus" aria-invalid={Boolean(errors.privacy_acknowledged)} aria-describedby={errors.privacy_acknowledged ? "privacy-error" : undefined} {...register("privacy_acknowledged")} /><span>{t("privacyAcknowledged")}</span></label>
            <div className="min-h-5">{errorMessage("privacy_acknowledged") ? <p id="privacy-error" role="alert" className="text-sm text-site-danger">{errorMessage("privacy_acknowledged")}</p> : null}</div>
          </div>
        </div>
      </fieldset>

      <div className="grid gap-3 border-t border-site-border p-4 sm:p-6">
        {isDirty ? (
          <div role="status" aria-live="polite" className="flex flex-col gap-3 border border-site-border bg-site-surface p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-site-foreground">{t("unsavedChanges")}</p>
              <p className="mt-1 text-site-muted">{t("unsavedChangesHint")}</p>
            </div>
            <button type="button" onClick={discardChanges} className="inline-flex min-h-11 w-full items-center justify-center border border-site-border px-4 py-2 font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus sm:w-auto">{t("discardChanges")}</button>
          </div>
        ) : null}
        {validationErrorCount > 0 ? <p role="alert" className="border border-site-danger bg-site-canvas p-4 text-sm text-site-danger">{t("reportError")}</p> : null}
        {serverError ? <p role="alert" className="border border-site-danger bg-site-canvas p-4 text-sm text-site-danger">{String(serverError)}</p> : null}
        <button type="submit" disabled={isSubmitting} className="min-h-12 w-full bg-site-action px-6 py-3 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? t("submitting") : t("submitReport")}</button>
      </div>
    </form>
  );
}
