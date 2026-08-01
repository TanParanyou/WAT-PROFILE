"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scale, FileText, UserCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { FormTabs, TabConfig } from "@/components/admin/FormTabs";
import { PublicContentSaveBar } from "./PublicContentSaveBar";
import { impressumContentFormSchema } from "@/schemas/public-content.schema";
import { useImpressumContentQuery, useUpdateImpressumContentMutation } from "@/hooks/public-content";
import type { ImpressumContentFormData } from "@/types/public-content";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";

export function ImpressumContentForm() {
  const t = useTranslations("Admin.publicContent");
  const { data: impressumData, isLoading } = useImpressumContentQuery();
  const updateMutation = useUpdateImpressumContentMutation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"details" | "legal" | "responsibility" | "seo">("details");

  const methods = useForm<ImpressumContentFormData>({
    resolver: zodResolver(impressumContentFormSchema),
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
        organization_name: { th: "", en: "", de: "" },
        legal_form: { th: "", en: "", de: "" },
        address: { th: "", en: "", de: "" },
        phone: "",
        email: "",
        representative: { th: "", en: "", de: "" },
        registry_court: { th: "", en: "", de: "" },
        registry_number: "",
        vat_id: "",
        content_responsibility: { th: "", en: "", de: "" },
      },
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty, errors } } = methods;

  useEffect(() => {
    if (impressumData) {
      reset(impressumData);
      methods.trigger();
    }
  }, [impressumData, reset, methods]);

  if (isLoading) {
    return <PageLoading text={t("loading")} />;
  }

  const onSubmit = (values: ImpressumContentFormData) => {
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
    if (
      errs.body?.organization_name ||
      errs.body?.legal_form ||
      errs.body?.address ||
      errs.body?.phone ||
      errs.body?.email ||
      errs.body?.representative ||
      errs.title ||
      errs.description
    ) {
      setActiveTab("details");
    } else if (errs.body?.registry_court || errs.body?.registry_number || errs.body?.vat_id) {
      setActiveTab("legal");
    } else if (errs.body?.content_responsibility) {
      setActiveTab("responsibility");
    } else if (errs.seo) {
      setActiveTab("seo");
    }

    toast.error(t("validationError"));
  };

  // Section error flags
  const hasDetailsError = !!(
    errors.body?.organization_name ||
    errors.body?.legal_form ||
    errors.body?.address ||
    errors.body?.phone ||
    errors.body?.email ||
    errors.body?.representative ||
    errors.title ||
    errors.description
  );
  const hasLegalError = !!(errors.body?.registry_court || errors.body?.registry_number || errors.body?.vat_id);
  const hasResponsibilityError = !!errors.body?.content_responsibility;
  const hasSeoError = !!errors.seo;

  const sectionTabs: TabConfig<"details" | "legal" | "responsibility" | "seo">[] = [
    { id: "details", label: t("impressum.orgTab"), icon: <FileText size={14} />, hasError: hasDetailsError },
    { id: "legal", label: t("impressum.regTab"), icon: <Scale size={14} />, hasError: hasLegalError },
    { id: "responsibility", label: t("impressum.respTab"), icon: <UserCheck size={14} />, hasError: hasResponsibilityError },
    { id: "seo", label: t("impressum.seoTab"), icon: <Search size={14} />, hasError: hasSeoError },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-h-[calc(100vh-7rem)] flex flex-col justify-between space-y-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-admin-foreground">{t("impressum.pageTitle")}</h1>
              <p className="text-sm text-admin-muted">{t("impressum.pageDesc")}</p>
            </div>
          </div>

          <FormTabs tabs={sectionTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Form Content per tab */}
          <div className="bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">
            
            {activeTab === "details" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("impressum.orgHeading")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("impressum.fields.title")}
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
                        label={t("impressum.fields.description")}
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.organization_name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("impressum.fields.orgName")}
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.legal_form"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("impressum.fields.legalForm")}
                        value={field.value}
                        onChange={field.onChange}
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
                      label={t("impressum.fields.address")}
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
                    <label className="text-sm font-medium text-admin-body">{t("impressum.fields.phone")}</label>
                    <input
                      type="text"
                      {...methods.register("body.phone")}
                      placeholder="+49 160-1604486"
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-admin-body">{t("impressum.fields.email")}</label>
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
            )}

            {activeTab === "legal" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("impressum.regHeading")}</h3>
                
                <Controller
                  name="body.representative"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("impressum.fields.representative")}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.registry_court"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("impressum.fields.court")}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-admin-body">{t("impressum.fields.regNumber")}</label>
                    <input
                      type="text"
                      {...methods.register("body.registry_number")}
                      placeholder="VR 20123"
                      className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-admin-body">{t("impressum.fields.vatId")}</label>
                  <input
                    type="text"
                    {...methods.register("body.vat_id")}
                    className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                  />
                </div>
              </div>
            )}

            {activeTab === "responsibility" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("impressum.respHeading")}</h3>
                
                <Controller
                  name="body.content_responsibility"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("impressum.fields.responsibility")}
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("seo.title")}</h3>
                
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
                      placeholder="/th/impressum"
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

                <div className="space-y-1">
                  <label className="text-sm font-medium text-admin-body">{t("seo.ogImage")}</label>
                  <input
                    type="text"
                    {...methods.register("seo.og_image")}
                    placeholder="https://example.com/image.jpg"
                    className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        <PublicContentSaveBar
          isDirty={isDirty}
          isPending={updateMutation.isPending}
          updatedAt={impressumData?.updated_at}
          publicUrl="/impressum"
        />
      </form>
    </FormProvider>
  );
}
export default ImpressumContentForm;
