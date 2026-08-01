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

import {
  TestLinkButton,
  TestPhoneButton,
  TestEmailButton,
  UrlImageInputWithPreview,
  MapEmbedPreview,
  GoogleSearchPreview,
  BankCardPreview,
  SocialsPreview,
  ContactDetailsPreview,
  OpeningHoursPreview,
  TravelGuidePreview,
  ContactFormPreview,
} from "@/components/admin/preview";

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

  // Watch form fields for real-time previews
  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const watchedAddress = watch("body.address");
  const watchedPhone = watch("body.phone");
  const watchedEmail = watch("body.email");
  const watchedOpeningHours = watch("body.opening_hours");
  const watchedMap = watch("body.map");
  const watchedTransport = watch("body.transport");
  const watchedSocials = watch("body.socials");
  const watchedBank = watch("body.bank");
  const watchedContactForm = watch("body.contact_form");
  const watchedSeo = watch("seo");

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
          <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-admin-foreground">{t("contact.pageTitle")}</h1>
              <p className="text-sm text-admin-muted">{t("contact.pageDesc")}</p>
            </div>
          </div>

          <FormTabs tabs={sectionTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* 1. DETAILS TAB */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Form Controls */}
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("contact.detailsHeading")}
                </h3>
                
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
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-admin-body">{t("contact.phone")}</label>
                      <TestPhoneButton phone={watchedPhone} />
                    </div>
                    <input
                      type="text"
                      {...methods.register("body.phone")}
                      placeholder="+49 160-1604486"
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-admin-body">{t("contact.email")}</label>
                      <TestEmailButton email={watchedEmail} />
                    </div>
                    <input
                      type="text"
                      {...methods.register("body.email")}
                      placeholder="info@watloungporsai.de"
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                    {errors.body?.email && <p className="text-sm text-admin-danger mt-1">{errors.body.email.message}</p>}
                  </div>
                </div>
              </div>

              {/* Right Sticky Preview Panel */}
              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <ContactDetailsPreview
                  title={watchedTitle}
                  description={watchedDescription}
                  address={watchedAddress}
                  phone={watchedPhone}
                  email={watchedEmail}
                />
              </div>
            </div>
          )}

          {/* 2. OPENING HOURS TAB */}
          {activeTab === "opening" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("contact.hoursHeadingDesc")}
                </h3>
                
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

              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <OpeningHoursPreview openingHours={watchedOpeningHours} />
              </div>
            </div>
          )}

          {/* 3. MAP TAB */}
          {activeTab === "map" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("contact.mapHeadingDesc")}
                </h3>
                
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
                  <label className="text-sm font-medium text-admin-body">{t("contact.mapEmbed")}</label>
                  <input
                    type="text"
                    {...methods.register("body.map.embed_url")}
                    placeholder="https://www.google.com/maps/embed?..."
                    className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                  />
                  {errors.body?.map?.embed_url && <p className="text-sm text-admin-danger mt-1">{errors.body.map.embed_url.message}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-admin-body">{t("contact.mapDirections")}</label>
                    <TestLinkButton href={watchedMap?.directions_url} label="ทดสอบลิงก์นำทาง" />
                  </div>
                  <input
                    type="text"
                    {...methods.register("body.map.directions_url")}
                    placeholder="https://maps.app.goo.gl/..."
                    className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                  />
                  {errors.body?.map?.directions_url && <p className="text-sm text-admin-danger mt-1">{errors.body.map.directions_url.message}</p>}
                </div>
              </div>

              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <MapEmbedPreview
                  embedUrl={watchedMap?.embed_url}
                  directionsUrl={watchedMap?.directions_url}
                  mapName={watchedMap?.name}
                />
              </div>
            </div>
          )}

          {/* 4. TRAVEL TAB */}
          {activeTab === "travel" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("contact.travelHeadingDesc")}
                </h3>
                
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
                    <label className="text-sm font-semibold text-admin-foreground">{t("contact.publicTransport")}</label>
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
                      <div key={field.id} className="flex gap-4 items-start p-4 border border-admin-border rounded-none bg-admin-surface-muted relative">
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
                          className="mt-8 p-2 rounded-none text-admin-muted hover:text-admin-danger hover:bg-admin-border transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
                          title={t("contact.deleteTravelStep")}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}

                    {transportFields.length === 0 && (
                      <div className="text-center py-6 text-admin-muted border border-dashed border-admin-border rounded-none">
                        {t("contact.noTravelSteps")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <TravelGuidePreview transport={watchedTransport} />
              </div>
            </div>
          )}

          {/* 5. SOCIALS TAB */}
          {activeTab === "socials" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("contact.socialsHeading")}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-admin-body">Facebook URL</label>
                      <TestLinkButton href={watchedSocials?.facebook} label="ทดสอบเปิด Facebook" />
                    </div>
                    <input
                      type="text"
                      {...methods.register("body.socials.facebook")}
                      placeholder="https://facebook.com/..."
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                    {errors.body?.socials?.facebook && <p className="text-sm text-admin-danger mt-1">{errors.body.socials.facebook.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-admin-body">Instagram URL</label>
                      <TestLinkButton href={watchedSocials?.instagram} label="ทดสอบเปิด Instagram" />
                    </div>
                    <input
                      type="text"
                      {...methods.register("body.socials.instagram")}
                      placeholder="https://instagram.com/..."
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                    {errors.body?.socials?.instagram && <p className="text-sm text-admin-danger mt-1">{errors.body.socials.instagram.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-admin-body">Facebook Messenger URL</label>
                      <TestLinkButton href={watchedSocials?.messenger} label="ทดสอบเปิด Messenger" />
                    </div>
                    <input
                      type="text"
                      {...methods.register("body.socials.messenger")}
                      placeholder="https://m.me/..."
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                    {errors.body?.socials?.messenger && <p className="text-sm text-admin-danger mt-1">{errors.body.socials.messenger.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-admin-body">LINE ID / Add URL</label>
                      <TestLinkButton
                        href={watchedSocials?.line?.startsWith("http") ? watchedSocials?.line : `https://line.me/R/ti/p/${watchedSocials?.line}`}
                        label="ทดสอบเปิด LINE"
                      />
                    </div>
                    <input
                      type="text"
                      {...methods.register("body.socials.line")}
                      placeholder="@line_id"
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-admin-body">YouTube Channel URL</label>
                    <TestLinkButton href={watchedSocials?.youtube} label="ทดสอบเปิด YouTube" />
                  </div>
                  <input
                    type="text"
                    {...methods.register("body.socials.youtube")}
                    placeholder="https://youtube.com/channel/..."
                    className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                  />
                  {errors.body?.socials?.youtube && <p className="text-sm text-admin-danger mt-1">{errors.body.socials.youtube.message}</p>}
                </div>
              </div>

              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <SocialsPreview socials={watchedSocials} />
              </div>
            </div>
          )}

          {/* 6. BANK TAB */}
          {activeTab === "bank" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("contact.bankHeadingDesc")}
                </h3>
                
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
                  <label className="text-sm font-medium text-admin-body">เลขบัญชีเงินฝาก (Account Number)</label>
                  <input
                    type="text"
                    {...methods.register("body.bank.account_number")}
                    className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-admin-body">IBAN (เยอรมนี/ยุโรป)</label>
                    <input
                      type="text"
                      {...methods.register("body.bank.iban")}
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-admin-body">BIC / SWIFT Code</label>
                    <input
                      type="text"
                      {...methods.register("body.bank.bic")}
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                  </div>
                </div>

                {/* QR Image Input with MediaPicker & Lightbox Preview */}
                <Controller
                  name="body.bank.qr_image_url"
                  control={control}
                  render={({ field, fieldState }) => (
                    <UrlImageInputWithPreview
                      label={t("contact.qrImageUrl")}
                      value={field.value}
                      onChange={field.onChange}
                      description="อัปโหลดหรือระบุ URL รูปภาพ QR Code สำหรับสแกนโอนเงินบริจาค"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <BankCardPreview
                  bankName={watchedBank?.bank_name}
                  accountName={watchedBank?.account_name}
                  accountNumber={watchedBank?.account_number}
                  iban={watchedBank?.iban}
                  bic={watchedBank?.bic}
                  qrImageUrl={watchedBank?.qr_image_url}
                />
              </div>
            </div>
          )}

          {/* 7. FORM TAB */}
          {activeTab === "form" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("contact.formHeading")}
                </h3>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="form_enabled"
                    {...methods.register("body.contact_form.enabled")}
                    className="rounded text-admin-action focus-visible:outline-2 focus-visible:outline-admin-focus border-admin-control-border w-4 h-4"
                  />
                  <label htmlFor="form_enabled" className="text-sm font-medium text-admin-body select-none">
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-admin-body">ลิงก์หน้านโยบายความเป็นส่วนตัว (Privacy Page Link)</label>
                    <TestLinkButton href={watchedContactForm?.privacy_page_link} label="ทดสอบเปิดลิงก์" />
                  </div>
                  <input
                    type="text"
                    {...methods.register("body.contact_form.privacy_page_link")}
                    placeholder="/privacy"
                    className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <ContactFormPreview
                  enabled={watchedContactForm?.enabled}
                  successMessage={watchedContactForm?.success_message}
                  privacyPageLink={watchedContactForm?.privacy_page_link}
                />
              </div>
            </div>
          )}

          {/* 8. SEO TAB */}
          {activeTab === "seo" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">
                  {t("seo.title")}
                </h3>
                
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
                    <label className="text-sm font-medium text-admin-body">Canonical URL</label>
                    <input
                      type="text"
                      {...methods.register("seo.canonical_url")}
                      placeholder="/th/contact"
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="seo_noindex"
                      {...methods.register("seo.noindex")}
                      className="rounded text-admin-action focus-visible:outline-2 focus-visible:outline-admin-focus border-admin-control-border w-4 h-4"
                    />
                    <label htmlFor="seo_noindex" className="text-sm font-medium text-admin-body select-none">
                      {t("seo.noIndex")}
                    </label>
                  </div>
                </div>

                {/* OG Image Input with MediaPicker & Lightbox Preview */}
                <Controller
                  name="seo.og_image"
                  control={control}
                  render={({ field, fieldState }) => (
                    <UrlImageInputWithPreview
                      label={t("seo.ogImage")}
                      value={field.value}
                      onChange={field.onChange}
                      description="รูปภาพตัวอย่างสำหรับแสดงเมื่อแชร์ลิงก์เพจบน Facebook, LINE หรือโซเชียลมีเดีย"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className="lg:col-span-5 sticky top-6 self-start space-y-6">
                <GoogleSearchPreview
                  seoTitle={watchedSeo?.title}
                  pageTitle={watchedTitle}
                  seoDescription={watchedSeo?.description}
                  pageDescription={watchedDescription}
                  canonicalUrl={watchedSeo?.canonical_url}
                  noindex={watchedSeo?.noindex}
                  ogImage={watchedSeo?.og_image}
                />
              </div>
            </div>
          )}

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
