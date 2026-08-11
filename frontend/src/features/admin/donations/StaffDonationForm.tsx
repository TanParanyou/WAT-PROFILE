"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { staffDonationSchema, type StaffDonationFormData } from "@/schemas/donation.schema";
import type { DonationCategory } from "@/types/entities";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

interface StaffDonationFormProps {
  categories: DonationCategory[];
  onSubmit: (data: StaffDonationFormData) => Promise<void>;
  onCancel: () => void;
}

export function StaffDonationForm({ categories, onSubmit, onCancel }: StaffDonationFormProps) {
  const t = useTranslations("Admin");
  const locale = useLocale() as "th" | "en" | "de";
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof staffDonationSchema>, unknown, StaffDonationFormData>({
    resolver: zodResolver(staffDonationSchema),
    defaultValues: { amount: 0, currency: "EUR", donation_date: "", donation_time: "", donation_method: "cash", donor_name: "", donor_email: "", donor_phone: "", category_id: null, receipt_requested: false },
  });
  const error = (field: keyof StaffDonationFormData) => errors[field]?.message ? <p className="text-xs text-admin-danger">{String(errors[field]?.message)}</p> : null;

  return <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="mb-6 grid gap-3 border border-admin-border bg-admin-surface p-4 md:grid-cols-4" noValidate>
    <label className="grid gap-1 text-sm"><span>{t("donations.amount")}</span><input {...register("amount")} type="number" min="0.01" step="0.01" className="min-h-11 border border-admin-border px-3" />{error("amount")}</label>
    <label className="grid gap-1 text-sm"><span>{t("donations.currency")}</span><select {...register("currency")} className="min-h-11 border border-admin-border px-3"><option value="EUR">EUR</option></select>{error("currency")}</label>
    <Controller control={control} name="donation_date" render={({ field }) => <DatePicker id="staff-donation-date" label={t("donations.date")} value={field.value} onChange={field.onChange} error={errors.donation_date?.message ? String(errors.donation_date.message) : undefined} required variant="admin" locale={locale} placeholder={t("donations.datePlaceholder")} />} />
    <Controller control={control} name="donation_time" render={({ field }) => <TimePicker id="staff-donation-time" label={t("donations.time")} value={field.value} onChange={field.onChange} error={errors.donation_time?.message ? String(errors.donation_time.message) : undefined} required variant="admin" locale={locale} placeholder={t("donations.timePlaceholder")} timeCaption={t("donations.time")} />} />
    <label className="grid gap-1 text-sm"><span>{t("donations.method")}</span><select {...register("donation_method")} className="min-h-11 border border-admin-border px-3"><option value="cash">{t("donations.cash")}</option><option value="bank_transfer">{t("donations.bankTransfer")}</option><option value="paypal">PayPal</option></select>{error("donation_method")}</label>
    <label className="grid gap-1 text-sm"><span>{t("donations.donor")}</span><input {...register("donor_name")} className="min-h-11 border border-admin-border px-3" />{error("donor_name")}</label>
    <label className="grid gap-1 text-sm"><span>{t("donations.email")}</span><input {...register("donor_email")} type="email" className="min-h-11 border border-admin-border px-3" />{error("donor_email")}</label>
    <label className="grid gap-1 text-sm"><span>{t("donations.phone")}</span><input {...register("donor_phone")} type="tel" className="min-h-11 border border-admin-border px-3" />{error("donor_phone")}</label>
    <label className="grid gap-1 text-sm"><span>{t("donations.category")}</span><select {...register("category_id", { setValueAs: (value) => value === "" ? null : Number(value) })} className="min-h-11 border border-admin-border px-3"><option value="">{t("donations.generalCategory")}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name?.[locale] || category.name?.en || category.name?.th || category.id}</option>)}</select>{error("category_id")}</label>
    <label className="flex min-h-11 items-center gap-2 text-sm md:col-span-2"><input {...register("receipt_requested")} type="checkbox" className="size-5" />{t("donations.receiptRequested")}</label>
    <div className="flex gap-2 md:col-span-4"><button type="submit" disabled={isSubmitting} className="min-h-11 bg-admin-action px-4 py-2 text-sm font-semibold text-admin-on-action disabled:opacity-50">{t("donations.save")}</button><button type="button" onClick={onCancel} className="min-h-11 border border-admin-border px-4 py-2 text-sm">{t("donations.cancel")}</button></div>
  </form>;
}
