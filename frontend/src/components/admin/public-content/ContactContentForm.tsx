"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Clock, MapPin, Navigation, Share2, Landmark, ToggleLeft, Search, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { FormTabs, TabConfig } from "@/components/admin/FormTabs";
import { PublicContentSaveBar } from "./PublicContentSaveBar";
import { contactContentFormSchema } from "@/schemas/public-content.schema";
import { useContactContentQuery, useUpdateContactContentMutation } from "@/hooks/public-content";
import type { ContactContentFormData } from "@/types/public-content";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";

export function ContactContentForm() {
  const t = useTranslations("Admin.publicContent");
  const { data: contactData, isLoading } = useContactContentQuery();
  const updateMutation = useUpdateContactContentMutation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"details" | "opening" | "map" | "travel" | "socials" | "bank" | "form" | "seo">("details");

  const methods = useForm<ContactContentFormData>({
    resolver: zodResolver(contactContentFormSchema),
    mode: "all",
    defaultValues: {
      title: { th: "", en: "", de: "" },
      description: { th: "", en: "", de: "" },
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
          qr_image_url: "",
        },
        contact_form: {
          enabled: true,
          success_message: { th: "", en: "", de: "" },
          privacy_page_link: "/privacy",
        },
      },
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty, errors } } = methods;

  const { fields: transportFields, append: appendTransport, remove: removeTransport } = useFieldArray({
    control,
    name: "body.transport.public_transport",
  });

  useEffect(() => {
    if (contactData) {
      reset(contactData);
      methods.trigger();
    }
  }, [contactData, reset, methods]);

  if (isLoading) {
    return <PageLoading text={t("loading")} />;
  }

  const onSubmit = (values: ContactContentFormData) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success(t("saveSuccess"));
      },
      onError: (err) => {
        toast.error(t("saveError", { error: err.message }));
      },
    });
  };

  const onInvalid = (errs: typeof errors) => {
    if (errs.body?.address || errs.body?.phone || errs.body?.email || errs.title || errs.description) {
      setActiveTab("details");
    } else if (errs.body?.opening_hours) {
      setActiveTab("opening");
    } else if (errs.body?.map) {
      setActiveTab("map");
    } else if (errs.body?.transport) {
      setActiveTab("travel");
    } else if (errs.body?.socials) {
      setActiveTab("socials");
    } else if (errs.body?.bank) {
      setActiveTab("bank");
    } else if (errs.body?.contact_form) {
      setActiveTab("form");
    } else if (errs.seo) {
      setActiveTab("seo");
    }

    toast.error(t("validationError"));
  };

  // Section error flags
  const hasDetailsError = !!(errors.body?.address || errors.body?.phone || errors.body?.email || errors.title || errors.description);
  const hasOpeningError = !!errors.body?.opening_hours;
  const hasMapError = !!errors.body?.map;
  const hasTravelError = !!errors.body?.transport;
  const hasSocialsError = !!errors.body?.socials;
  const hasBankError = !!errors.body?.bank;
  const hasFormError = !!errors.body?.contact_form;
  const hasSeoError = !!errors.seo;

  const sectionTabs: TabConfig<"details" | "opening" | "map" | "travel" | "socials" | "bank" | "form" | "seo">[] = [
    { id: "details", label: t("contact.detailsHeading"), icon: <Mail size={14} />, hasError: hasDetailsError },
    { id: "opening", label: t("contact.hoursTab"), icon: <Clock size={14} />, hasError: hasOpeningError },
    { id: "map", label: t("contact.mapTab"), icon: <MapPin size={14} />, hasError: hasMapError },
    { id: "travel", label: t("contact.travelTab"), icon: <Navigation size={14} />, hasError: hasTravelError },
    { id: "socials", label: t("contact.socialTab"), icon: <Share2 size={14} />, hasError: hasSocialsError },
    { id: "bank", label: t("contact.bankTab"), icon: <Landmark size={14} />, hasError: hasBankError },
    { id: "form", label: t("contact.formTab"), icon: <ToggleLeft size={14} />, hasError: hasFormError },
    { id: "seo", label: t("contact.seoTab"), icon: <Search size={14} />, hasError: hasSeoError },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-h-[calc(100vh-7rem)] flex flex-col justify-between space-y-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-950">{t("contact.pageTitle")}</h1>
              <p className="text-sm text-zinc-500">{t("contact.pageDesc")}</p>
            </div>
          </div>

          <FormTabs tabs={sectionTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Form Content per tab */}
          <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm space-y-6">
            
            {activeTab === "details" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("contact.detailsHeading")}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.fields.title")}
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.fields.description")}
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="body.address"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("contact.address")}
                      value={field.value}
                      onChange={field.onChange}
                      type="textarea"
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("contact.phone")}</label>
                    <input
                      type="text"
                      {...methods.register("body.phone")}
                      placeholder="+49 160-1604486"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("contact.email")}</label>
                    <input
                      type="text"
                      {...methods.register("body.email")}
                      placeholder="info@watloungporsai.de"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                    {errors.body?.email && <p className="text-sm text-red-600 mt-1">{errors.body.email.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "opening" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("contact.hoursHeadingDesc")}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.opening_hours.days"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.hoursDays")}
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.opening_hours.time"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.hoursHeading")}
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="body.opening_hours.notice"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("contact.hoursNotice")}
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            )}

            {activeTab === "map" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("contact.mapHeadingDesc")}</h3>
                
                <Controller
                  name="body.map.name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("contact.mapHeading")}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("contact.mapEmbed")}</label>
                  <input
                    type="text"
                    {...methods.register("body.map.embed_url")}
                    placeholder="https://www.google.com/maps/embed?..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                  {errors.body?.map?.embed_url && <p className="text-sm text-red-600 mt-1">{errors.body.map.embed_url.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("contact.mapDirections")}</label>
                  <input
                    type="text"
                    {...methods.register("body.map.directions_url")}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                  {errors.body?.map?.directions_url && <p className="text-sm text-red-600 mt-1">{errors.body.map.directions_url.message}</p>}
                </div>
              </div>
            )}

            {activeTab === "travel" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("contact.travelHeadingDesc")}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.transport.parking"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.parking")}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.transport.driving"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.driving")}
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-800">{t("contact.publicTransport")}</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={<Plus size={14} />}
                      onClick={() => appendTransport({ th: "", en: "", de: "" })}
                    >
                      {t("contact.addTravelStep")}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {transportFields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-start p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 relative">
                        <div className="flex-1">
                          <Controller
                            name={`body.transport.public_transport.${index}`}
                            control={control}
                            render={({ field: f, fieldState: fs }) => (
                              <MultiLangInput
                                label={t("contact.travelStep", { number: index + 1 })}
                                value={f.value || { th: "", en: "", de: "" }}
                                onChange={f.onChange}
                                required
                                error={fs.error?.message}
                              />
                            )}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTransport(index)}
                          className="mt-8 p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition-colors"
                          title={t("contact.deleteTravelStep")}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}

                    {transportFields.length === 0 && (
                      <div className="text-center py-6 text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                        {t("contact.noTravelSteps")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "socials" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("contact.socialsHeading")}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                    <input
                      type="text"
                      {...methods.register("body.socials.facebook")}
                      placeholder="https://facebook.com/..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                    {errors.body?.socials?.facebook && <p className="text-sm text-red-600 mt-1">{errors.body.socials.facebook.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                    <input
                      type="text"
                      {...methods.register("body.socials.instagram")}
                      placeholder="https://instagram.com/..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                    {errors.body?.socials?.instagram && <p className="text-sm text-red-600 mt-1">{errors.body.socials.instagram.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Facebook Messenger URL</label>
                    <input
                      type="text"
                      {...methods.register("body.socials.messenger")}
                      placeholder="https://m.me/..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                    {errors.body?.socials?.messenger && <p className="text-sm text-red-600 mt-1">{errors.body.socials.messenger.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">LINE ID / Add URL</label>
                    <input
                      type="text"
                      {...methods.register("body.socials.line")}
                      placeholder="@line_id"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">YouTube Channel URL</label>
                  <input
                    type="text"
                    {...methods.register("body.socials.youtube")}
                    placeholder="https://youtube.com/channel/..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                  {errors.body?.socials?.youtube && <p className="text-sm text-red-600 mt-1">{errors.body.socials.youtube.message}</p>}
                </div>
              </div>
            )}

            {activeTab === "bank" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("contact.bankHeadingDesc")}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.bank.bank_name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.bankName")}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.bank.account_name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("contact.bankAccount")}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">เลขบัญชีเงินฝาก (Account Number)</label>
                  <input
                    type="text"
                    {...methods.register("body.bank.account_number")}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">IBAN (เยอรมนี/ยุโรป)</label>
                    <input
                      type="text"
                      {...methods.register("body.bank.iban")}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">BIC / SWIFT Code</label>
                    <input
                      type="text"
                      {...methods.register("body.bank.bic")}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("contact.qrImageUrl")}</label>
                  <input type="url" {...methods.register("body.bank.qr_image_url")} placeholder="https://..." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                  {errors.body?.bank?.qr_image_url && <p className="mt-1 text-sm text-red-600">{errors.body.bank.qr_image_url.message}</p>}
                </div>
              </div>
            )}

            {activeTab === "form" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("contact.formHeading")}</h3>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="form_enabled"
                    {...methods.register("body.contact_form.enabled")}
                    className="rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-4 h-4"
                  />
                  <label htmlFor="form_enabled" className="text-sm font-medium text-gray-700 select-none">
                    {t("contact.formEnabledLabel")}
                  </label>
                </div>

                <Controller
                  name="body.contact_form.success_message"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("contact.formSuccess")}
                      value={field.value}
                      onChange={field.onChange}
                      type="textarea"
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">ลิงก์หน้านโยบายความเป็นส่วนตัว (Privacy Page Link)</label>
                  <input
                    type="text"
                    {...methods.register("body.contact_form.privacy_page_link")}
                    placeholder="/privacy"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">{t("seo.title")}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="seo.title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("seo.titleLabel")}
                        value={field.value as MultiLangText}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="seo.description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("seo.descLabel")}
                        value={field.value as MultiLangText}
                        onChange={field.onChange}
                        type="textarea"
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Canonical URL</label>
                    <input
                      type="text"
                      {...methods.register("seo.canonical_url")}
                      placeholder="/th/contact"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="seo_noindex"
                      {...methods.register("seo.noindex")}
                      className="rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-4 h-4"
                    />
                    <label htmlFor="seo_noindex" className="text-sm font-medium text-gray-700 select-none">
                      {t("seo.noIndex")}
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("seo.ogImage")}</label>
                  <input
                    type="text"
                    {...methods.register("seo.og_image")}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        <PublicContentSaveBar
          isDirty={isDirty}
          isPending={updateMutation.isPending}
          updatedAt={contactData?.updated_at}
          publicUrl="/contact"
        />
      </form>
    </FormProvider>
  );
}
export default ContactContentForm;
