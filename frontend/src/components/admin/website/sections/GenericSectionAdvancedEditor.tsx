"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { JsonTextareaField } from "@/components/forms/JsonTextareaField";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { getWebsiteCmsSectionFormSchema, type WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import type { ContentSection } from "@/types/website-cms";
import { contentSectionToFormValues } from "@/utils/websiteCms";

export function GenericSectionAdvancedEditor({
  section,
  activeLocale,
  isSaving,
  error,
  onSubmit,
  onDirtyChange,
  onPreviewDraftChange,
}: {
  section: ContentSection;
  activeLocale: string;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsSectionFormData) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onPreviewDraftChange?: (values: WebsiteCmsSectionFormData) => void;
}) {
  const form = useForm<WebsiteCmsSectionFormData>({
    resolver: zodResolver(getWebsiteCmsSectionFormSchema(section.section_type)) as never,
    defaultValues: contentSectionToFormValues(section),
  });

  useEffect(() => {
    form.reset(contentSectionToFormValues(section));
  }, [form, section]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
    return () => onDirtyChange?.(false);
  }, [form.formState.isDirty, onDirtyChange]);

  useEffect(() => {
    onPreviewDraftChange?.(form.getValues());
    const subscription = form.watch((values) => {
      onPreviewDraftChange?.(values as WebsiteCmsSectionFormData);
    });
    return () => subscription.unsubscribe();
  }, [form, onPreviewDraftChange]);

  return (
    <form className="space-y-4 border border-admin-border bg-admin-surface-muted p-4 rounded-none" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <div className="text-sm font-medium text-admin-foreground">{section.section_key}</div>
        <div className="text-xs text-admin-muted">
          {section.section_type} · {activeLocale.toUpperCase()}
        </div>
      </div>
      <LocalizedTextFields label="Title" name="title" register={form.register} errors={form.formState.errors} disabled={isSaving} />
      <LocalizedTextareaFields
        label="Description"
        name="description"
        register={form.register}
        errors={form.formState.errors}
        disabled={isSaving}
      />
      <JsonTextareaField label="Body JSON" name={"body"} control={form.control} disabled={isSaving} />
      <JsonTextareaField label="Settings JSON" name={"settings"} control={form.control} disabled={isSaving} />
      {error ? <p className="text-sm text-admin-danger">{error.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving}>
          Save section
        </Button>
      </div>
    </form>
  );
}
