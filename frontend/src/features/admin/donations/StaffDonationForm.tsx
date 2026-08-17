"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Controller, useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { createStaffDonationSchema, type StaffDonationFormData } from "@/schemas/donation.schema";
import type { Donation, DonationCategory } from "@/types/entities";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Icons } from "@/components/ui/Icons";
import {
  Wallet,
  User,
  Receipt,
  CreditCard,
  Banknote,
  Landmark,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  FileImage,
  FileText,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface StaffDonationFormProps {
  isOpen?: boolean;
  mode?: "create" | "view";
  viewDonation?: Donation | null;
  categories: DonationCategory[];
  onSubmit?: (data: StaffDonationFormData) => Promise<void>;
  onCancel: () => void;
  onClose?: () => void;
  onViewProof?: (id: number) => void;
  onViewReceipt?: (donation: Donation) => void;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export function StaffDonationForm({
  isOpen = true,
  mode = "create",
  viewDonation = null,
  categories,
  onSubmit,
  onCancel,
  onClose,
  onViewProof,
  onViewReceipt,
}: StaffDonationFormProps) {
  const t = useTranslations("Admin");
  const locale = useLocale() as "th" | "en" | "de";
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const isViewMode = mode === "view" && !!viewDonation;

  const getTodayDateString = () => new Date().toISOString().split("T")[0];
  const getCurrentTimeString = () => new Date().toTimeString().slice(0, 5);

  const schema = useMemo(() => createStaffDonationSchema((key: string) => {
    // Strip "donations." prefix if passed as key
    const subKey = key.startsWith("donations.") ? key.replace("donations.", "") : key;
    return t(`donations.${subKey}` as Parameters<typeof t>[0]);
  }), [t]);

  const methods = useForm<z.input<typeof schema>, unknown, StaffDonationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined as unknown as number,
      currency: "EUR",
      donation_date: getTodayDateString(),
      donation_time: getCurrentTimeString(),
      donation_method: "cash",
      donor_name: "",
      donor_email: "",
      donor_phone: "",
      donor_address: "",
      donor_type: "guest",
      is_anonymous: false,
      category_id: null,
      receipt_requested: false,
      notes: "",
    },
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = methods;

  const currentAmount = useWatch({ control, name: "amount" });
  const isAnonymous = useWatch({ control, name: "is_anonymous" });
  const receiptRequested = useWatch({ control, name: "receipt_requested" });
  const donationMethod = useWatch({ control, name: "donation_method" });

  // Reset form with fresh defaults when drawer opens in create mode
  useEffect(() => {
    if (isOpen && !isViewMode) {
      reset({
        amount: undefined as unknown as number,
        currency: "EUR",
        donation_date: getTodayDateString(),
        donation_time: getCurrentTimeString(),
        donation_method: "cash",
        donor_name: "",
        donor_email: "",
        donor_phone: "",
        donor_address: "",
        donor_type: "guest",
        is_anonymous: false,
        category_id: null,
        receipt_requested: false,
        notes: "",
      });
    }
  }, [isOpen, isViewMode, reset]);

  const handleCloseAttempt = () => {
    if (!isViewMode && isDirty) {
      setShowUnsavedModal(true);
    } else {
      (onClose || onCancel)();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedModal(false);
    reset();
    (onClose || onCancel)();
  };

  const handleFormSubmit = async (data: StaffDonationFormData) => {
    if (!onSubmit) return;
    const payload: StaffDonationFormData = {
      ...data,
      amount: Number(data.amount),
      category_id:
        data.category_id !== null && data.category_id !== undefined && String(data.category_id) !== ""
          ? Number(data.category_id)
          : null,
      receipt_requested: Boolean(data.receipt_requested),
      is_anonymous: Boolean(data.is_anonymous),
      donor_type: data.is_anonymous ? "anonymous" : "guest",
    };
    await onSubmit(payload);
    reset();
  };

  const categoryOptions: SelectOption[] = [
    { value: "", label: t("donations.generalCategory") },
    ...categories.map((category) => ({
      value: String(category.id),
      label:
        category.name?.[locale] ||
        category.name?.th ||
        category.name?.en ||
        `Category #${category.id}`,
    })),
  ];

  const getMethodLabel = (method: string) => {
    if (method === "cash") return t("donations.cash");
    if (method === "bank_transfer") return t("donations.bankTransfer");
    if (method === "paypal") return "PayPal";
    return method || "-";
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={handleCloseAttempt}
        title={
          isViewMode
            ? `${t("donations.viewDetailsTitle")} - ${viewDonation.receipt_number || `#${viewDonation.id}`}`
            : t("donations.createStaffTitle")
        }
        description={isViewMode ? t("donations.viewDetailsDesc") : t("donations.createStaffDesc")}
        size="lg"
        closeLabel={t("donations.closeDrawer")}
      >
        {isViewMode && viewDonation ? (
          /* View Details Mode */
          <div className="flex flex-col h-full justify-between">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Header Summary Card */}
              <div className="border border-admin-border bg-admin-surface-muted p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-admin-muted uppercase tracking-wider">{t("donations.receiptNumber")}</span>
                  <p className="text-lg font-bold text-admin-foreground font-mono">{viewDonation.receipt_number || `#${viewDonation.id}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 bg-admin-surface border border-admin-border text-admin-muted font-medium">
                    {viewDonation.source === "self_reported" ? t("donations.sourceSelfReported") : t("donations.sourceStaffRecorded")}
                  </span>
                  <StatusBadge label={viewDonation.status || "pending"} />
                </div>
              </div>

              {/* Section 1: Donation Info */}
              <div className="border border-admin-border bg-admin-surface p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-admin-border text-sm font-semibold text-admin-foreground">
                  <Wallet size={17} className="text-admin-action shrink-0" />
                  <span>{t("donations.donationInfo")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-admin-muted block mb-1">{t("donations.amount")}</span>
                    <p className="text-xl font-bold text-admin-success">
                      {Number(viewDonation.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-normal text-admin-foreground">{viewDonation.currency || "EUR"}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-admin-muted block mb-1">{t("donations.method")}</span>
                    <p className="text-sm font-medium text-admin-foreground flex items-center gap-1.5">
                      <CreditCard size={15} className="text-admin-muted" />
                      {getMethodLabel(viewDonation.donation_method)}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-admin-muted block mb-1">{t("donations.category")}</span>
                    <p className="text-sm font-medium text-admin-foreground">
                      {viewDonation.category?.name?.[locale] || viewDonation.category?.name?.th || viewDonation.category?.name?.en || t("donations.generalCategory")}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-admin-muted block mb-1">{t("donations.date")}</span>
                    <p className="text-sm font-medium text-admin-foreground flex items-center gap-1.5">
                      <Calendar size={15} className="text-admin-muted" />
                      {viewDonation.donation_date ? new Date(viewDonation.donation_date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                      {viewDonation.donation_time && <span className="text-admin-muted text-xs">({viewDonation.donation_time})</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Donor Info */}
              <div className="border border-admin-border bg-admin-surface p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-admin-border text-sm font-semibold text-admin-foreground">
                  <User size={17} className="text-admin-action shrink-0" />
                  <span>{t("donations.donorInfo")}</span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-admin-muted block mb-0.5">{t("donations.donor")}</span>
                      <p className="font-medium text-admin-foreground">
                        {viewDonation.is_anonymous ? (
                          <span className="text-admin-muted italic">{t("donations.anonymous")}</span>
                        ) : (
                          viewDonation.donor_name || "-"
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-admin-muted block mb-0.5">{t("donations.phone")}</span>
                      <p className="text-admin-foreground flex items-center gap-1">
                        <Phone size={14} className="text-admin-muted" />
                        {viewDonation.donor_phone || "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-admin-muted block mb-0.5">{t("donations.email")}</span>
                    <p className="text-admin-foreground flex items-center gap-1">
                      <Mail size={14} className="text-admin-muted" />
                      {viewDonation.donor_email || "-"}
                    </p>
                  </div>

                  {viewDonation.donor_address && (
                    <div>
                      <span className="text-xs text-admin-muted block mb-0.5">{t("donations.donorAddress")}</span>
                      <p className="text-admin-foreground flex items-start gap-1">
                        <MapPin size={14} className="text-admin-muted shrink-0 mt-0.5" />
                        <span>{viewDonation.donor_address}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Receipt and Notes */}
              <div className="border border-admin-border bg-admin-surface p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-admin-border text-sm font-semibold text-admin-foreground">
                  <Receipt size={17} className="text-admin-action shrink-0" />
                  <span>{t("donations.receiptAndNotes")}</span>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-admin-muted block mb-0.5">{t("donations.receiptStatus")}</span>
                    <p className="font-medium text-admin-foreground flex items-center gap-1.5">
                      <FileCheck size={15} className="text-admin-action" />
                      {viewDonation.receipt_requested
                        ? viewDonation.receipt_dispatched_at
                          ? `${t("donations.receiptSent")} (${new Date(viewDonation.receipt_dispatched_at).toLocaleDateString("th-TH")})`
                          : t("donations.receiptPending")
                        : t("donations.receiptNotRequested")}
                    </p>
                  </div>

                  {viewDonation.notes && (
                    <div>
                      <span className="text-xs text-admin-muted block mb-0.5">{t("donations.notes")}</span>
                      <p className="text-admin-foreground whitespace-pre-wrap bg-admin-surface-muted p-3 border border-admin-border text-xs">
                        {viewDonation.notes}
                      </p>
                    </div>
                  )}

                  {viewDonation.source === "self_reported" && onViewProof && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onViewProof(viewDonation.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm"
                      >
                        <FileImage size={16} />
                        {t("donations.viewProof")}
                      </Button>
                    </div>
                  )}

                  {viewDonation.status === "confirmed" && onViewReceipt && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onViewReceipt(viewDonation)}
                        className="w-full flex items-center justify-center gap-2 text-sm"
                      >
                        <FileText size={16} />
                        {t("donations.viewReceipt")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* View Mode Footer */}
            <div className="sticky bottom-0 z-40 border-t border-admin-border bg-admin-surface-muted px-6 py-4 flex items-center justify-end">
              <Button type="button" variant="outline" onClick={onClose || onCancel}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        ) : (
          /* Create Mode */
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="flex flex-col h-full justify-between"
              noValidate
            >
              {/* Scrollable Form Content */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Section 1: Donation Details */}
                <div className="border border-admin-border bg-admin-surface p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-admin-border text-sm font-semibold text-admin-foreground">
                    <Wallet size={17} className="text-admin-action shrink-0" />
                    <span>{t("donations.donationInfo")}</span>
                  </div>

                  {/* Amount Input with Quick Presets */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Controller
                        control={control}
                        name="amount"
                        render={({ field }) => (
                          <Input
                            id="staff-donation-amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            label={t("donations.amount")}
                            placeholder="0.00"
                            required
                            value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? undefined : Number(val));
                            }}
                            error={errors.amount?.message}
                            className="pr-20 font-medium text-base"
                          />
                        )}
                      />
                      <div className="absolute right-3 top-[32px] pointer-events-none flex items-center gap-1 text-xs font-semibold text-admin-muted bg-admin-surface-muted px-2 py-1 border border-admin-border">
                        <span>EUR (€)</span>
                      </div>
                    </div>

                    {/* Quick Amount Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-admin-muted flex items-center gap-1 mr-1">
                        <Sparkles size={12} />
                        {t("donations.quickAmounts")}:
                      </span>
                      {QUICK_AMOUNTS.map((amt) => {
                        const isSelected = Number(currentAmount) === amt;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setValue("amount", amt, { shouldValidate: true, shouldDirty: true })}
                            className={cn(
                              "px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer",
                              isSelected
                                ? "bg-admin-action text-admin-on-action border-admin-action"
                                : "bg-admin-surface text-admin-foreground border-admin-control-border hover:bg-admin-surface-muted"
                            )}
                          >
                            €{amt}
                          </button>
                        );
                      })}
                      {currentAmount ? (
                        <button
                          type="button"
                          onClick={() => setValue("amount", undefined as unknown as number, { shouldValidate: true, shouldDirty: true })}
                          className="px-2 py-1 text-xs text-admin-muted hover:text-admin-foreground border border-transparent hover:border-admin-border cursor-pointer"
                        >
                          {t("donations.clear")}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Donation Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
                      {t("donations.method")}
                      <span className="text-admin-danger ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          value: "cash",
                          label: t("donations.cash"),
                          icon: Banknote,
                        },
                        {
                          value: "bank_transfer",
                          label: t("donations.bankTransfer"),
                          icon: Landmark,
                        },
                        {
                          value: "paypal",
                          label: "PayPal",
                          icon: CreditCard,
                        },
                      ].map((item) => {
                        const isSelected = donationMethod === item.value;
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setValue("donation_method", item.value as "cash" | "bank_transfer" | "paypal", { shouldDirty: true })}
                            className={cn(
                              "flex items-center gap-2 p-3 border text-left text-sm transition-colors cursor-pointer",
                              isSelected
                                ? "border-admin-action bg-admin-action/5 text-admin-foreground font-medium ring-1 ring-admin-action"
                                : "border-admin-control-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
                            )}
                          >
                            <IconComponent size={16} className={isSelected ? "text-admin-action" : "text-admin-muted"} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.donation_method?.message && (
                      <p className="text-sm text-admin-danger mt-1">{errors.donation_method.message}</p>
                    )}
                  </div>

                  {/* Category Selection */}
                  <Controller
                    control={control}
                    name="category_id"
                    render={({ field }) => (
                      <Select
                        id="staff-donation-category"
                        label={t("donations.category")}
                        value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? null : Number(val));
                        }}
                        options={categoryOptions}
                        error={errors.category_id?.message}
                      />
                    )}
                  />

                  {/* Date and Time Picker Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name="donation_date"
                      render={({ field }) => (
                        <DatePicker
                          id="staff-donation-date"
                          label={t("donations.date")}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.donation_date?.message}
                          required
                          variant="admin"
                          locale={locale}
                          placeholder={t("donations.datePlaceholder")}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="donation_time"
                      render={({ field }) => (
                        <TimePicker
                          id="staff-donation-time"
                          label={t("donations.time")}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.donation_time?.message}
                          required
                          variant="admin"
                          locale={locale}
                          placeholder={t("donations.timePlaceholder")}
                          timeCaption={t("donations.time")}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Section 2: Donor Details */}
                <div className="border border-admin-border bg-admin-surface p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-admin-border">
                    <div className="flex items-center gap-2 text-sm font-semibold text-admin-foreground">
                      <User size={17} className="text-admin-action shrink-0" />
                      <span>{t("donations.donorInfo")}</span>
                    </div>

                    {/* Anonymous Switch in Header */}
                    <Controller
                      control={control}
                      name="is_anonymous"
                      render={({ field }) => (
                        <Switch
                          id="staff-anonymous-toggle"
                          label={t("donations.anonymousOption")}
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (e.target.checked) {
                              setValue("donor_type", "anonymous", { shouldDirty: true });
                              setValue("donor_name", "", { shouldValidate: true, shouldDirty: true });
                            } else {
                              setValue("donor_type", "guest", { shouldDirty: true });
                            }
                          }}
                        />
                      )}
                    />
                  </div>

                  {isAnonymous ? (
                    <div className="p-3 bg-admin-surface-muted border border-admin-border text-xs text-admin-muted flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-admin-info" />
                      <span>{t("donations.anonymousHint")}</span>
                    </div>
                  ) : null}

                  {/* Donor Name and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="staff-donor-name"
                      label={t("donations.donorName")}
                      placeholder={isAnonymous ? t("donations.anonymous") : t("donations.donorNamePlaceholder")}
                      required={!isAnonymous}
                      error={errors.donor_name?.message}
                      disabled={isAnonymous}
                      {...register("donor_name")}
                    />

                    <Input
                      id="staff-donor-phone"
                      type="tel"
                      label={t("donations.phone")}
                      placeholder={t("donations.donorPhonePlaceholder")}
                      error={errors.donor_phone?.message}
                      disabled={isAnonymous}
                      {...register("donor_phone")}
                    />
                  </div>

                  {/* Donor Email */}
                  <div>
                    <Input
                      id="staff-donor-email"
                      type="email"
                      label={t("donations.email")}
                      placeholder={t("donations.donorEmailPlaceholder")}
                      required={receiptRequested}
                      error={errors.donor_email?.message}
                      disabled={isAnonymous && !receiptRequested}
                      {...register("donor_email")}
                    />
                    {receiptRequested && !isAnonymous && (
                      <p className="text-xs text-admin-info mt-1 flex items-center gap-1">
                        <AlertCircle size={13} />
                        {t("donations.emailRequiredForReceipt")}
                      </p>
                    )}
                  </div>

                  {/* Donor Address */}
                  {!isAnonymous && (
                    <Textarea
                      id="staff-donor-address"
                      label={t("donations.donorAddress")}
                      placeholder={t("donations.donorAddressPlaceholder")}
                      rows={2}
                      error={errors.donor_address?.message}
                      {...register("donor_address")}
                    />
                  )}
                </div>

                {/* Section 3: Receipt and Notes */}
                <div className="border border-admin-border bg-admin-surface p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-admin-border text-sm font-semibold text-admin-foreground">
                    <Receipt size={17} className="text-admin-action shrink-0" />
                    <span>{t("donations.receiptAndNotes")}</span>
                  </div>

                  {/* Receipt Requested Switch */}
                  <div className="p-3.5 bg-admin-surface-muted border border-admin-border space-y-1.5">
                    <Controller
                      control={control}
                      name="receipt_requested"
                      render={({ field }) => (
                        <Switch
                          id="staff-receipt-requested"
                          label={t("donations.receiptRequested")}
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (e.target.checked && isAnonymous) {
                              // If anonymous but asking for receipt, don't disallow email
                            }
                          }}
                          error={errors.receipt_requested?.message}
                        />
                      )}
                    />
                    <p className="text-xs text-admin-muted pl-12">
                      {t("donations.receiptRequestedDesc")}
                    </p>
                  </div>

                  {/* Notes */}
                  <Textarea
                    id="staff-donation-notes"
                    label={t("donations.notes")}
                    placeholder={t("donations.notesPlaceholder")}
                    rows={3}
                    error={errors.notes?.message}
                    {...register("notes")}
                  />
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="sticky bottom-0 z-40 border-t border-admin-border bg-admin-surface-muted px-6 py-4 flex items-center justify-between">
                <div>
                  {isDirty && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                      <Clock size={13} />
                      {t("common.unsaved_changes") || t("common.unsavedChanges") || "มีข้อมูลที่ยังไม่ได้บันทึก"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseAttempt}
                    disabled={isSubmitting}
                  >
                    {t("donations.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="min-w-[140px]"
                  >
                    <Icons.Save size={16} className="mr-1.5" />
                    {t("donations.save")}
                  </Button>
                </div>
              </div>
            </form>
          </FormProvider>
        )}
      </Drawer>

      {/* Unsaved Changes Confirmation Modal */}
      <ConfirmModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onConfirm={handleConfirmClose}
        title={t("donations.unsavedChangesTitle")}
        message={t("donations.unsavedChangesMessage")}
        confirmText={t("donations.confirmCancel")}
        cancelText={t("donations.cancel")}
        variant="warning"
      />
    </>
  );
}
