"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Target, Landmark, History, Home, Users, Search, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { FormTabs, TabConfig } from "@/components/admin/FormTabs";
import { PublicContentSaveBar } from "./PublicContentSaveBar";
import { aboutContentFormSchema } from "@/schemas/public-content.schema";
import { useAboutContentQuery, useUpdateAboutContentMutation } from "@/hooks/public-content";
import type { AboutContentFormData } from "@/types/public-content";
import { useTranslations } from "next-intl";
import { findErrorLanguage } from "@/utils/form-errors";

const locales = [
  { code: "th" as const, label: "TH" },
  { code: "en" as const, label: "EN" },
  { code: "de" as const, label: "DE" },
];

export function AboutContentForm() {
  const t = useTranslations("Admin.publicContent");
  const { data: aboutData, isLoading } = useAboutContentQuery();
  const updateMutation = useUpdateAboutContentMutation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"intro" | "objective" | "administration" | "history" | "buildings" | "sangha" | "seo">("intro");

  const methods = useForm<AboutContentFormData>({
    resolver: zodResolver(aboutContentFormSchema),
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
        intro: {
          heading: { th: "", en: "", de: "" },
          description: { th: "", en: "", de: "" },
          founded: { th: "", en: "", de: "" },
          location: { th: "", en: "", de: "" },
        },
        objective: {
          heading: { th: "", en: "", de: "" },
          subtitle: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
        administration: {
          heading: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
        history: {
          heading: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
        buildings: {
          heading: { th: "", en: "", de: "" },
          items: [],
        },
        sangha: {
          heading: { th: "", en: "", de: "" },
          mission: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
      },
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty, errors } } = methods;

  const { fields: buildingFields, append: appendBuilding, remove: removeBuilding } = useFieldArray({
    control,
    name: "body.buildings.items",
  });

  useEffect(() => {
    if (aboutData) {
      reset(aboutData);
      methods.trigger();
    }
  }, [aboutData, reset, methods]);

  if (isLoading) {
    return <PageLoading text={t("loading")} />;
  }

  const onSubmit = (values: AboutContentFormData) => {
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
    if (errs.body?.intro || errs.title || errs.description) {
      setActiveTab("intro");
    } else if (errs.body?.objective) {
      setActiveTab("objective");
    } else if (errs.body?.administration) {
      setActiveTab("administration");
    } else if (errs.body?.history) {
      setActiveTab("history");
    } else if (errs.body?.buildings) {
      setActiveTab("buildings");
    } else if (errs.body?.sangha) {
      setActiveTab("sangha");
    } else if (errs.seo) {
      setActiveTab("seo");
    }

    toast.error(t("validationError"));
  };

  // Section error helpers for UI indicators
  const hasIntroError = !!(errors.body?.intro || errors.title || errors.description);
  const hasObjectiveError = !!errors.body?.objective;
  const hasAdminError = !!errors.body?.administration;
  const hasHistoryError = !!errors.body?.history;
  const hasBuildingsError = !!errors.body?.buildings;
  const hasSanghaError = !!errors.body?.sangha;
  const hasSeoError = !!errors.seo;

  const sectionTabs: TabConfig<"intro" | "objective" | "administration" | "history" | "buildings" | "sangha" | "seo">[] = [
    { id: "intro", label: t("about.intro"), icon: <Info size={14} />, hasError: hasIntroError },
    { id: "objective", label: t("about.objective"), icon: <Target size={14} />, hasError: hasObjectiveError },
    { id: "administration", label: t("about.administration"), icon: <Landmark size={14} />, hasError: hasAdminError },
    { id: "history", label: t("about.history"), icon: <History size={14} />, hasError: hasHistoryError },
    { id: "buildings", label: t("about.buildings"), icon: <Home size={14} />, hasError: hasBuildingsError },
    { id: "sangha", label: t("about.sangha"), icon: <Users size={14} />, hasError: hasSanghaError },
    { id: "seo", label: t("about.seo"), icon: <Search size={14} />, hasError: hasSeoError },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-h-[calc(100vh-7rem)] flex flex-col justify-between space-y-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-admin-foreground">{t("about.pageTitle")}</h1>
              <p className="text-sm text-admin-muted">{t("about.pageDesc")}</p>
            </div>
          </div>

          <FormTabs tabs={sectionTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Form Content per tab */}
          <div className="bg-admin-surface p-6 rounded-none border border-admin-border space-y-6">

            {activeTab === "intro" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("about.introHeading")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.title")}
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
                        label={t("about.fields.description")}
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
                    name="body.intro.heading"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.introHeading")}
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.intro.description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.introDesc")}
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
                    name="body.intro.founded"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.founded")}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.intro.location"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.location")}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {activeTab === "objective" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("about.objective")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.objective.heading"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.objectiveHeading")}
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.objective.subtitle"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.objectiveSubtitle")}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="body.objective.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label={t("about.fields.objectiveContent")}
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

            {activeTab === "administration" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("about.administration")}</h3>

                <Controller
                  name="body.administration.heading"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("about.fields.adminHeading")}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="body.administration.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label={t("about.fields.adminContent")}
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

            {activeTab === "history" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("about.history")}</h3>

                <Controller
                  name="body.history.heading"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("about.fields.historyHeading")}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="body.history.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label={t("about.fields.historyContent")}
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

            {activeTab === "buildings" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("about.buildings")}</h3>

                <Controller
                  name="body.buildings.heading"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label={t("about.fields.buildingsHeading")}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-admin-foreground">{t("about.fields.buildingsList")}
                      <span className="text-admin-danger ml-1">*</span>
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={<Plus size={14} />}
                      onClick={() => appendBuilding({ name: { th: "", en: "", de: "" }, description: { th: "", en: "", de: "" } })}
                    >
                      {t("about.addBuilding")}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {buildingFields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-admin-border rounded-none bg-admin-surface-muted space-y-4 relative">
                        <button
                          type="button"
                          onClick={() => removeBuilding(index)}
                          className="absolute top-4 right-4 p-1.5 rounded-none text-admin-muted hover:text-admin-danger hover:bg-admin-border transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
                          title={t("about.deleteBuilding")}
                        >
                          <Trash size={16} />
                        </button>

                        <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider">{t("about.buildingNumber", { number: index + 1 })}</span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Controller
                            name={`body.buildings.items.${index}.name`}
                            control={control}
                            render={({ field: f, fieldState: fs }) => (
                              <MultiLangInput
                                label={t("about.buildingName")}
                                value={f.value || { th: "", en: "", de: "" }}
                                onChange={f.onChange}
                                required
                                error={fs.error?.message}
                              />
                            )}
                          />
                          <Controller
                            name={`body.buildings.items.${index}.description`}
                            control={control}
                            render={({ field: f, fieldState: fs }) => (
                              <MultiLangInput
                                label={t("about.buildingDesc")}
                                value={f.value || { th: "", en: "", de: "" }}
                                onChange={f.onChange}
                                type="textarea"
                                error={fs.error?.message}
                              />
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    {buildingFields.length === 0 && (
                      <div className="text-center py-8 text-admin-muted border border-dashed border-admin-border rounded-none">
                        {t("about.fields.noBuildings")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sangha" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("about.sangha")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.sangha.heading"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.sanghaHeading")}
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.sangha.mission"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("about.fields.sanghaMission")}
                        required
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="body.sangha.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label={t("about.fields.sanghaContent")}
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
                <h3 className="text-lg font-medium text-admin-foreground border-b border-admin-border pb-2">{t("seo.title")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="seo.title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label={t("seo.titleLabel")}
                        value={field.value}
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
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-admin-body">Canonical URL</label>
                    <input
                      type="text"
                      {...methods.register("seo.canonical_url")}
                      placeholder="/th/about"
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
          updatedAt={aboutData?.updated_at}
          publicUrl="/about"
        />
      </form>
    </FormProvider>
  );
}
export default AboutContentForm;
