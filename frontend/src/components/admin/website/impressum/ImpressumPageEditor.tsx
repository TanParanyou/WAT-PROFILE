"use client";

import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FileText, Save, Search } from "lucide-react";

import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { Input } from "@/components/ui/Input";
import { useImpressumPageQuery, usePublishImpressumPageMutation, useUpdateImpressumPageMutation } from "@/hooks/website-cms";
import { useToast } from "@/hooks/useToast";
import type { ImpressumPageBodyFormData, ImpressumPageFormData } from "@/schemas/website-page.schema";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";
import type { ContentPage } from "@/types/website-cms";
import { SeoEditorTab } from "../shared/SeoEditorTab";

function normalizeImpressumBody(value: unknown): ImpressumPageBodyFormData {
  const body = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    organization_name:
      typeof body.organization_name === "object" && body.organization_name !== null
        ? (body.organization_name as ImpressumPageBodyFormData["organization_name"])
        : { th: "", en: "", de: "" },
    address:
      typeof body.address === "object" && body.address !== null
        ? (body.address as ImpressumPageBodyFormData["address"])
        : { th: "", en: "", de: "" },
    phone: typeof body.phone === "string" ? body.phone : "",
    email: typeof body.email === "string" ? body.email : "",
  };
}

function normalizeImpressumPage(value: ContentPage): ImpressumPageFormData {
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
      keywords: "keywords" in value.seo && value.seo.keywords ? (value.seo.keywords as ImpressumPageFormData["seo"]["keywords"]) : { th: "", en: "", de: "" },
      og_image: typeof value.seo.og_image === "string" ? value.seo.og_image : "",
      canonical_url: typeof value.seo.canonical_url === "string" ? value.seo.canonical_url : "",
    },
    body: normalizeImpressumBody(value.body),
  };
}

export function ImpressumPageEditor() {
  const { toast } = useToast();
  const { data: pageData, isLoading } = useImpressumPageQuery();
  const updateMutation = useUpdateImpressumPageMutation();
  const publishMutation = usePublishImpressumPageMutation();
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const store = useWebsiteCmsEditorStore();

  const methods = useForm<ImpressumPageFormData>({
    defaultValues: {
      page_key: "PAGE-IMPRESSUM",
      slug: "impressum",
      status: "published",
      title: { th: "ข้อมูลทางกฎหมาย", en: "Impressum", de: "Impressum" },
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
        address: { th: "", en: "", de: "" },
        phone: "",
        email: "",
      },
    },
  });

  const {
    formState: { errors, isDirty },
    handleSubmit,
    reset,
  } = methods;

  useEffect(() => {
    if (pageData) {
      reset(normalizeImpressumPage(pageData));
    }
  }, [pageData, reset]);

  useEffect(() => {
    store.setHasUnsavedChanges(isDirty);
    return () => store.setHasUnsavedChanges(false);
  }, [isDirty, store]);

  if (isLoading) {
    return <PageLoading text="Loading Impressum..." />;
  }

  const onSubmit = (values: ImpressumPageFormData) => {
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
          reset(normalizeImpressumPage(updated));
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
            <h1 className="text-xl font-semibold text-zinc-950">Impressum Editor</h1>
            <p className="text-sm text-zinc-500">Manage legal information and provider disclosure settings.</p>
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
              Content Details
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
              <Controller
                name="title"
                control={methods.control}
                render={({ field: { onChange, value } }) => (
                  <MultiLangInput label="Page Title (Optional)" value={value} onChange={onChange} required />
                )}
              />

              <div className="space-y-6 border-t border-zinc-100 pt-6">
                <Controller
                  name="body.organization_name"
                  control={methods.control}
                  render={({ field: { onChange, value } }) => (
                    <MultiLangInput label="Organization Name" value={value} onChange={onChange} required />
                  )}
                />

                <Controller
                  name="body.address"
                  control={methods.control}
                  render={({ field: { onChange, value } }) => (
                    <MultiLangInput label="Address" value={value} onChange={onChange} required />
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <Input label="Phone" {...methods.register("body.phone")} />
                  <Input type="email" label="Email" {...methods.register("body.email")} />
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
