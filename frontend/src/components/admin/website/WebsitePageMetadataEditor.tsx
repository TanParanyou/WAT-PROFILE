"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { JsonTextareaField } from "@/components/forms/JsonTextareaField";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { websiteCmsPageFormSchema, type WebsiteCmsPageFormData } from "@/schemas/website-cms.schema";
import type { ContentPage } from "@/types/website-cms";
import { contentPageToFormValues } from "@/utils/websiteCms";

export function WebsitePageMetadataEditor({
  page,
  isSaving,
  error,
  onSubmit,
  heading = "Page settings",
  summary = "Metadata, SEO, draft status, and shared page configuration.",
  saveLabel = "Save page",
  showIdentity = true,
  showLocalizedContent = true,
  showSeoJson = true,
  showBodyJson = true,
  showSettingsJson = true,
  onDirtyChange,
}: {
  page: ContentPage;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsPageFormData) => void;
  heading?: string;
  summary?: string;
  saveLabel?: string;
  showIdentity?: boolean;
  showLocalizedContent?: boolean;
  showSeoJson?: boolean;
  showBodyJson?: boolean;
  showSettingsJson?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const form = useForm<WebsiteCmsPageFormData>({
    resolver: zodResolver(websiteCmsPageFormSchema) as never,
    defaultValues: contentPageToFormValues(page),
  });

  useEffect(() => {
    form.reset(contentPageToFormValues(page));
  }, [form, page]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
    return () => onDirtyChange?.(false);
  }, [form.formState.isDirty, onDirtyChange]);

  return (
    <form className="space-y-4 border border-zinc-200 bg-white p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">{heading}</h2>
          <p className="text-xs text-zinc-500">{summary}</p>
        </div>
        <Button type="submit" size="sm" isLoading={isSaving} icon={<Save size={14} />}>
          {saveLabel}
        </Button>
      </div>

      {showIdentity ? (
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px]">
          <Input label="Page key" disabled={isSaving} {...form.register("page_key")} error={form.formState.errors.page_key?.message} />
          <Input label="Slug" disabled={isSaving} {...form.register("slug")} error={form.formState.errors.slug?.message} />
          <Select
            label="Status"
            disabled={isSaving}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
            {...form.register("status")}
            error={form.formState.errors.status?.message}
          />
        </div>
      ) : null}

      {showLocalizedContent ? (
        <>
          <LocalizedTextFields label="Page title" name="title" register={form.register} errors={form.formState.errors} disabled={isSaving} />
          <LocalizedTextareaFields label="Page description" name="description" register={form.register} errors={form.formState.errors} disabled={isSaving} rows={3} />
        </>
      ) : null}
      {showSeoJson ? <JsonTextareaField label="SEO JSON" name="seo" control={form.control} disabled={isSaving} /> : null}
      {showBodyJson ? <JsonTextareaField label="Page body JSON" name="body" control={form.control} disabled={isSaving} rows={4} /> : null}
      {showSettingsJson ? (
        <JsonTextareaField label="Page settings JSON" name="settings" control={form.control} disabled={isSaving} rows={4} />
      ) : null}

      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
    </form>
  );
}
