"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { Save, Plus, Trash2, Globe, FileText, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { Input } from "@/components/ui/Input";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { SeoEditorTab } from "../shared/SeoEditorTab";
import { usePrivacyPageQuery, useUpdatePrivacyPageMutation, usePublishPrivacyPageMutation } from "@/hooks/website-page-master";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";
import { useToast } from "@/hooks/useToast";

interface PrivacySection {
  title: { th: string; en: string; de: string };
  content: { th: string; en: string; de: string };
}

interface PrivacyPageFormData {
  id: string;
  page_key: string;
  slug: string;
  status: string;
  title: { th: string; en: string; de: string };
  description: { th: string; en: string; de: string };
  seo: {
    title: { th: string; en: string; de: string };
    description: { th: string; en: string; de: string };
    keywords: { th: string; en: string; de: string };
    og_image: string;
    canonical_url: string;
  };
  body: {
    last_updated: string;
    sections: PrivacySection[];
  };
}

export function PrivacyPageEditor() {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const { data: pageData, isLoading } = usePrivacyPageQuery();
  const updateMutation = useUpdatePrivacyPageMutation();
  const publishMutation = usePublishPrivacyPageMutation();
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const store = useWebsiteCmsEditorStore();

  const methods = useForm<PrivacyPageFormData>({
    defaultValues: {
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

  const { reset, handleSubmit, control, formState: { isDirty, errors } } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "body.sections",
  });

  useEffect(() => {
    if (pageData) {
      const normalizedData = {
        ...pageData,
        body: {
          last_updated: (pageData.body as any)?.last_updated || new Date().toISOString().split("T")[0],
          sections: (pageData.body as any)?.sections || [],
        },
      } as unknown as PrivacyPageFormData;
      reset(normalizedData);
    }
  }, [pageData, reset]);

  useEffect(() => {
    store.setHasUnsavedChanges(isDirty);
    return () => store.setHasUnsavedChanges(false);
  }, [isDirty]);

  if (isLoading) {
    return <PageLoading text="Loading Privacy Policy..." />;
  }

  const onSubmit = (values: PrivacyPageFormData) => {
    updateMutation.mutate(
      {
        id: pageData!.id,
        payload: {
          title: values.title,
          description: values.description,
          seo: values.seo as any,
          body: values.body as any,
          status: values.status as any,
        },
      },
      {
        onSuccess: (updated) => {
          toast.success("Saved successfully");
          const normalizedData = {
            ...updated,
            body: {
              last_updated: (updated.body as any)?.last_updated || new Date().toISOString().split("T")[0],
              sections: (updated.body as any)?.sections || [],
            },
          } as unknown as PrivacyPageFormData;
          reset(normalizedData);
        },
        onError: () => {
          toast.error("Failed to save data");
        },
      }
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
            <p className="text-sm text-zinc-500">
              Manage website privacy policy sections and translations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePublish}
              isLoading={publishMutation.isPending}
            >
              Publish
            </Button>
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
            <span>Status: </span>
            <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200 rounded font-medium uppercase tracking-wider">
              {pageData?.status || "published"}
            </span>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded">
            Please fix the validation errors before saving.
          </div>
        )}

        <div className="space-y-4">
          {activeTab === "content" && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  type="date"
                  label="Last Updated Date"
                  {...methods.register("body.last_updated")}
                />
                <MultiLangInput
                  label="Page Title Override"
                  name="title"
                  required
                />
              </div>

              <div className="border-t border-zinc-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-zinc-950">Policy Sections</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => append({ title: { th: "", en: "", de: "" }, content: { th: "", en: "", de: "" } })}
                  >
                    Add Section
                  </Button>
                </div>

                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative border border-zinc-200 rounded-xl p-6 bg-zinc-50/50">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-4 pr-8">
                        <div className="font-mono text-xs text-zinc-400">Section #{index + 1}</div>
                        <MultiLangInput
                          label="Section Title"
                          name={`body.sections.${index}.title`}
                          required
                        />
                        <MultiLangInput
                          label="Section Content"
                          name={`body.sections.${index}.content`}
                          type="textarea"
                          required
                        />
                      </div>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-8 text-sm text-zinc-500 border border-dashed border-zinc-300 rounded-xl">
                      No policy sections added yet. Click "Add Section" to begin.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "seo" && (
            <SeoEditorTab disabled={updateMutation.isPending} />
          )}
        </div>

        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
                Unsaved changes
              </span>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={updateMutation.isPending}
            icon={<Save size={16} />}
            className="w-full sm:w-auto shadow-sm"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
