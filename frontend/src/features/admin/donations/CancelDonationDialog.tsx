"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

interface CancelDonationDialogProps {
  open: boolean;
  onSubmit: (reason: string) => Promise<void>;
  onClose: () => void;
}

export function CancelDonationDialog({ open, onSubmit, onClose }: CancelDonationDialogProps) {
  const t = useTranslations("Admin");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ reason: string }>({ defaultValues: { reason: "" } });
  if (!open) return null;
  const close = () => { reset(); onClose(); };
  return <div role="dialog" aria-modal="true" aria-labelledby="cancel-donation-title" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
    <form onSubmit={(event) => void handleSubmit(async ({ reason }) => { await onSubmit(reason.trim()); reset(); })(event)} className="grid w-full max-w-md gap-4 border border-admin-border bg-admin-surface p-5 shadow-xl">
      <h2 id="cancel-donation-title" className="text-lg font-semibold">{t("donations.cancelTitle")}</h2>
      <label className="grid gap-2 text-sm"><span>{t("donations.cancelReason")}</span><textarea {...register("reason", { required: t("donations.cancelReasonRequired") })} rows={4} className="border border-admin-border p-3" aria-invalid={Boolean(errors.reason)} />{errors.reason ? <span className="text-xs text-admin-danger">{errors.reason.message}</span> : null}</label>
      <div className="flex justify-end gap-2"><button type="button" onClick={close} className="min-h-11 border border-admin-border px-4">{t("donations.cancel")}</button><button type="submit" disabled={isSubmitting} className="min-h-11 bg-admin-danger px-4 text-white disabled:opacity-50">{t("donations.confirmCancel")}</button></div>
    </form>
  </div>;
}
