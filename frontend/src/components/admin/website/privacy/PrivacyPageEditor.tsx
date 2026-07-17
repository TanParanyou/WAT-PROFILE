"use client";

import { useEffect, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, FileText, Plus, Save, Search, Trash2 } from "lucide-react";

import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { Input } from "@/components/ui/Input";
import { usePrivacyPageQuery, usePublishPrivacyPageMutation, useUpdatePrivacyPageMutation } from "@/hooks/website-cms";
import { useToast } from "@/hooks/useToast";
import { hasLegacyLocalizedRichText, normalizeLocalizedRichText } from "@/lib/rich-text/document";
import type { PrivacyPageBodyFormData, PrivacyPageFormData, PrivacySectionFormData } from "@/schemas/website-page.schema";
import { richTextMigrationService } from "@/services/richTextMigrationService";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";
import type { ContentPage } from "@/types/website-cms";
import { SeoEditorTab } from "../shared/SeoEditorTab";

const richTextLocales = [
  { code: "th", label: "TH" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
] as const;

function normalizePrivacySections(value: unknown): PrivacySectionFormData[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      title:
        typeof item.title === "object" && item.title !== null
          ? (item.title as PrivacySectionFormData["title"])
          : { th: "", en: "", de: "" },
      content: normalizeLocalizedRichText(item.content, richTextLocales.map((locale) => locale.code), "th"),
    }));
}

function normalizePrivacyBody(value: unknown): PrivacyPageBodyFormData {
  const body = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    last_updated:
      typeof body.last_updated === "string" && body.last_updated.trim()
        ? body.last_updated
        : new Date().toISOString().split("T")[0],
    sections: normalizePrivacySections(body.sections),
  };
}

function normalizePrivacyPage(value: ContentPage): PrivacyPageFormData {
  return {
    id: value.id,
    page_key: value.page_key,
    slug: value.slug,
    status: value.status,
    title: value.title,
    description: value.description,
    seo: {
      title: value.seo.title || { th: "", en: "", de: "" },
      description: value.seo.description || { th: "", en: "", de: "" },
      keywords: "keywords" in value.seo && value.seo.keywords ? (value.seo.keywords as PrivacyPageFormData["seo"]["keywords"]) : { th: "", en: "", de: "" },
      og_image: typeof value.seo.og_image === "string" ? value.seo.og_image : "",
      canonical_url: typeof value.seo.canonical_url === "string" ? value.seo.canonical_url : "",
    },
    body: normalizePrivacyBody(value.body),
  };
}

function hasLegacyPrivacyBody(value: unknown): boolean {
  const body = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  if (!Array.isArray(body.sections)) {
    return false;
  }

  return body.sections.some((section) => {
    if (typeof section !== "object" || section === null) {
      return false;
    }

    return hasLegacyLocalizedRichText((section as Record<string, unknown>).content);
  });
}

function createEmptyPrivacySection(): PrivacySectionFormData {
  return {
    title: { th: "", en: "", de: "" },
    content: normalizeLocalizedRichText({}, richTextLocales.map((locale) => locale.code), "th"),
  };
}

export function PrivacyPageEditor() {
  const { toast } = useToast();
  const { data: pageData, isLoading } = usePrivacyPageQuery();
  const updateMutation = useUpdatePrivacyPageMutation();
  const publishMutation = usePublishPrivacyPageMutation();
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const store = useWebsiteCmsEditorStore();

  const methods = useForm<PrivacyPageFormData>({
    defaultValues: {
      page_key: "PAGE-PRIVACY",
      slug: "privacy",
      status: "published",
      title: { th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy", de: "Datenschutzerklärung" },
      description: { th: "", en: "", de: "" },
      seo: {
        title: { th: "", en: "", de: "" },
        description: { th: "", en: "", de: "" },
        keywords: { th: "", en: "", de: "" },
        og_image: "",
        canonical_url: "",
      },
      body: {
        last_updated: new Date().toISOString().split("T")[0],
        sections: [],
      },
    },
  });

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    reset,
  } = methods;

  const { append, fields, remove, swap } = useFieldArray({
    control,
    name: "body.sections",
  });

  useEffect(() => {
    if (pageData) {
      const normalizedPage = normalizePrivacyPage(pageData);
      reset(normalizedPage);

      if (hasLegacyPrivacyBody(pageData.body)) {
        void richTextMigrationService.migrate({
          resource: "content_page",
          id: pageData.id,
          updated_at: pageData.updated_at,
          field: "body",
          value: normalizedPage.body,
        }).catch(() => undefined);
      }
    }
  }, [pageData, reset]);

  useEffect(() => {
    store.setHasUnsavedChanges(isDirty);
    return () => store.setHasUnsavedChanges(false);
  }, [isDirty, store]);

  if (isLoading) {
    return <PageLoading text="Loading Privacy Policy..." />;
  }

  const onSubmit = (values: PrivacyPageFormData) => {
    if (!pageData?.id) return;

    updateMutation.mutate(
      {
        id: pageData.id,
        payload: {
          title: values.title,
          description: values.description,
          seo: values.seo,
          body: values.body,
          status: values.status,
        },
      },
      {
        onSuccess: (updated) => {
          toast.success("Saved successfully");
          reset(normalizePrivacyPage(updated));
        },
        onError: () => {
          toast.error("Failed to save data");
        },
      },
    );
  };

  const handlePublish = () => {
    if (!pageData?.id) return;
    publishMutation.mutate(pageData.id, {
      onSuccess: () => {
        toast.success("Page published successfully");
      },
      onError: () => {
        toast.error("Failed to publish page");
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">Privacy Policy Editor</h1>
            <p className="text-sm text-zinc-500">Manage website privacy policy sections and translations.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "content" ? "primary" : "outline"}
              icon={<FileText size={14} />}
              onClick={() => setActiveTab("content")}
            >
              Content Sections
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "seo" ? "primary" : "outline"}
              icon={<Search size={14} />}
              onClick={() => setActiveTab("seo")}
            >
              SEO Settings
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>Status:</span>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono font-medium uppercase tracking-wider text-emerald-700">
              {pageData?.status || "published"}
            </span>
          </div>
        </div>

        {Object.keys(errors).length > 0 ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            Please fix the validation errors before saving.
          </div>
        ) : null}

        <div className="space-y-4">
          {activeTab === "content" ? (
            <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Input type="date" label="Last Updated Date" {...methods.register("body.last_updated")} />
                <Controller
                  name="title"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <MultiLangInput label="Page Title (Optional)" value={value} onChange={onChange} required />
                  )}
                />
              </div>

              <div className="border-t border-zinc-100 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-zinc-950">Policy Sections</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => append(createEmptyPrivacySection())}
                  >
                    Add Section
                  </Button>
                </div>

                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
                      <div className="absolute right-4 top-4 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => index > 0 && swap(index, index - 1)}
                          disabled={index === 0}
                          className="p-1 text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => index < fields.length - 1 && swap(index, index + 1)}
                          disabled={index === fields.length - 1}
                          className="p-1 text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="ml-2 p-1 text-zinc-400 transition-colors hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-4 pr-24">
                        <div className="font-mono text-xs text-zinc-400">Section #{index + 1}</div>
                        <Controller
                          name={`body.sections.${index}.title`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <MultiLangInput label="Section Title" value={value} onChange={onChange} required />
                          )}
                        />
                        <Controller
                          name={`body.sections.${index}.content`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <MultiLangRichText
                              label="Section Content"
                              locales={[...richTextLocales]}
                              defaultLocale="th"
                              value={normalizeLocalizedRichText(value, richTextLocales.map((locale) => locale.code), "th")}
                              onChange={onChange}
                            />
                          )}
                        />
                      </div>
                    </div>
                  ))}

                  {fields.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-500">
                      No policy sections added yet. Click "Add Section" to begin.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <SeoEditorTab disabled={updateMutation.isPending} />
          )}
        </div>

        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
                Unsaved changes
              </span>
            ) : null}
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handlePublish}
              isLoading={publishMutation.isPending}
              className="flex-1 shadow-sm sm:flex-none"
            >
              Publish
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
              icon={<Save size={16} />}
              className="flex-1 shadow-sm sm:flex-none"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
