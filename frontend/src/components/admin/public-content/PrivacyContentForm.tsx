"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Search } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { FormTabs, TabConfig } from "@/components/admin/FormTabs";
import { PublicContentSaveBar } from "./PublicContentSaveBar";
import { privacyContentFormSchema } from "@/schemas/public-content.schema";
import { usePrivacyContentQuery, useUpdatePrivacyContentMutation } from "@/hooks/public-content";
import type { PrivacyContentFormData } from "@/types/public-content";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";

const locales = [
  { code: "th" as const, label: "TH" },
  { code: "en" as const, label: "EN" },
  { code: "de" as const, label: "DE" },
];

export function PrivacyContentForm() {
  const t = useTranslations("Admin.publicContent");
  const { data: privacyData, isLoading } = usePrivacyContentQuery();
  const updateMutation = useUpdatePrivacyContentMutation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"details" | "seo">("details");

  const methods = useForm<PrivacyContentFormData>({
    resolver: zodResolver(privacyContentFormSchema),
    mode: "all",
    defaultValues: {
      title: { th: "", en: "", de: "" },
      seo: {
        title: { th: "", en: "", de: "" },
        description: { th: "", en: "", de: "" },
        keywords: { th: "", en: "", de: "" },
        og_image: "",
        canonical_url: "",
      },
      body: {
        content: { th: null, en: null, de: null },
        last_updated: "",
      },
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty, errors } } = methods;

  useEffect(() => {
    if (privacyData) {
      reset(privacyData);
      methods.trigger();
    }
  }, [privacyData, reset, methods]);

  if (isLoading) {
    return <PageLoading text={t("loading")} />;
  }

  const onSubmit = (values: PrivacyContentFormData) => {
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
    if (errs.body || errs.title) {
      setActiveTab("details");
    } else if (errs.seo) {
      setActiveTab("seo");
    }

    toast.error(t("validationError"));
  };

  // Section error flags
  const hasDetailsError = !!(errors.body || errors.title);
  const hasSeoError = !!errors.seo;

  const sectionTabs: TabConfig<"details" | "seo">[] = [
    { id: "details", label: t("privacy.policyTab"), icon: <Shield size={14} />, hasError: hasDetailsError },
    { id: "seo", label: t("privacy.seoTab"), icon: <Search size={14} />, hasError: hasSeoError },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-h-[calc(100vh-7rem)] flex flex-col justify-between space-y-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-950">{t("privacy.pageTitle")}</h1>
              <p className="text-sm text-zinc-500">{t("privacy.pageDesc")}</p>
            </div>
          </div>

          <FormTabs tabs={sectionTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Form Content per tab */}
          <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm space-y-6">
            
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-medium text-zinc-900">{t("privacy.title")}</h3>
                  {(() => {
                    const lu = watch("body.last_updated");
                    return lu ? (
                      <span className="text-xs text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded">
                        {t("privacy.lastUpdated", { time: new Date(lu).toLocaleString("th-TH") })}
                      </span>
                    ) : null;
                  })()}
                </div>

                <Controller
                  name="title"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("privacy.pageTitleInput")}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="body.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label={t("privacy.contentInput")}
                      locales={locales}
                      defaultLocale="th"
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
                      placeholder="/th/privacy"
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
          updatedAt={privacyData?.updated_at}
          publicUrl="/privacy"
        />
      </form>
    </FormProvider>
  );
}
export default PrivacyContentForm;
