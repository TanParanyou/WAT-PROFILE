"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Save, FileText, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { Input } from "@/components/ui/Input";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/MultiLangRichText";
import { SeoEditorTab } from "../shared/SeoEditorTab";
import { useImpressumPageQuery, useUpdateImpressumPageMutation, usePublishImpressumPageMutation } from "@/hooks/website-page-master";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";
import { useToast } from "@/hooks/useToast";

interface ImpressumPageFormData {
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
    organization_name: { th: string; en: string; de: string };
    address: { th: string; en: string; de: string };
    phone: string;
    email: string;
  };
}

export function ImpressumPageEditor() {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const { data: pageData, isLoading } = useImpressumPageQuery();
  const updateMutation = useUpdateImpressumPageMutation();
  const publishMutation = usePublishImpressumPageMutation();
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const store = useWebsiteCmsEditorStore();

  const methods = useForm<ImpressumPageFormData>({
    defaultValues: {
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

  const { reset, handleSubmit, formState: { isDirty, errors } } = methods;

  useEffect(() => {
    if (pageData) {
      const normalizedData = {
        ...pageData,
        body: {
          organization_name: (pageData.body as any)?.organization_name || { th: "", en: "", de: "" },
          address: (pageData.body as any)?.address || { th: "", en: "", de: "" },
          phone: (pageData.body as any)?.phone || "",
          email: (pageData.body as any)?.email || "",
        },
      } as unknown as ImpressumPageFormData;
      reset(normalizedData);
    }
  }, [pageData, reset]);

  useEffect(() => {
    store.setHasUnsavedChanges(isDirty);
    return () => store.setHasUnsavedChanges(false);
  }, [isDirty]);

  if (isLoading) {
    return <PageLoading text="Loading Impressum..." />;
  }

  const onSubmit = (values: ImpressumPageFormData) => {
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
              organization_name: (updated.body as any)?.organization_name || { th: "", en: "", de: "" },
              address: (updated.body as any)?.address || { th: "", en: "", de: "" },
              phone: (updated.body as any)?.phone || "",
              email: (updated.body as any)?.email || "",
            },
          } as unknown as ImpressumPageFormData;
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
            <h1 className="text-xl font-semibold text-zinc-950">Impressum Editor</h1>
            <p className="text-sm text-zinc-500">
              Manage legal information and provider disclosure settings.
            </p>
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
              <Controller
                name="title"
                control={methods.control}
                render={({ field: { value, onChange } }) => (
                  <MultiLangInput
                    label="Page Title (Optional)"
                    value={value}
                    onChange={onChange}
                    required
                  />
                )}
              />

              <div className="border-t border-zinc-100 pt-6 space-y-6">
                <Controller
                  name="body.organization_name"
                  control={methods.control}
                  render={({ field: { value, onChange } }) => (
                    <MultiLangInput
                      label="Organization Name"
                      value={value}
                      onChange={onChange}
                      required
                    />
                  )}
                />
                
                <Controller
                  name="body.address"
                  control={methods.control}
                  render={({ field: { value, onChange } }) => (
                    <MultiLangRichText
                      label="Address"
                      value={value}
                      onChange={onChange}
                      required
                    />
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Phone"
                    {...methods.register("body.phone")}
                  />
                  <Input
                    type="email"
                    label="Email"
                    {...methods.register("body.email")}
                  />
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
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handlePublish}
              isLoading={publishMutation.isPending}
              className="flex-1 sm:flex-none shadow-sm"
            >
              Publish
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
              icon={<Save size={16} />}
              className="flex-1 sm:flex-none shadow-sm"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
