"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { JsonTextareaField } from "@/components/forms/JsonTextareaField";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { websiteCmsSectionFormSchema, type WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import type { ContentSection } from "@/types/website-cms";
import { contentSectionToFormValues } from "@/utils/websiteCms";

export function ContactSectionEditor({
  section,
  activeLocale,
  isSaving,
  error,
  onSubmit,
}: {
  section: ContentSection;
  activeLocale: string;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsSectionFormData) => void;
}) {
  const form = useForm<WebsiteCmsSectionFormData>({
    resolver: zodResolver(websiteCmsSectionFormSchema) as never,
    defaultValues: contentSectionToFormValues(section),
  });

  useEffect(() => {
    form.reset(contentSectionToFormValues(section));
  }, [form, section]);

  return (
    <form className="space-y-4 border border-admin-border bg-admin-surface-muted p-4 rounded-xl" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <div className="text-sm font-medium text-admin-foreground">Section Editor</div>
        <div className="text-xs text-admin-muted">{activeLocale.toUpperCase()}</div>
      </div>
      <LocalizedTextFields label="Title" name="title" register={form.register} errors={form.formState.errors} disabled={isSaving} />
      <LocalizedTextareaFields label="Description" name="description" register={form.register} errors={form.formState.errors} disabled={isSaving} />
      <JsonTextareaField label="Body JSON" name="body" control={form.control} disabled={isSaving} />
      <JsonTextareaField label="Settings JSON" name="settings" control={form.control} disabled={isSaving} />
      {error ? <p className="text-sm text-admin-danger">{error.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving}>
          Save section
        </Button>
      </div>
    </form>
  );
}
