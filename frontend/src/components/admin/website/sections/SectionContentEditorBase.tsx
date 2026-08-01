"use client";

import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { getWebsiteCmsSectionFormSchema, type WebsiteCmsSectionFormData } from "@/schemas/website-cms.schema";
import type { ContentSection } from "@/types/website-cms";
import { contentSectionToFormValues } from "@/utils/websiteCms";

export function SectionContentEditorBase({
  section,
  activeLocale,
  isSaving,
  error,
  heading,
  summary,
  children,
  onSubmit,
  onDirtyChange,
  onPreviewDraftChange,
}: {
  section: ContentSection;
  activeLocale: string;
  isSaving: boolean;
  error: Error | null;
  heading: string;
  summary: string;
  children?: (form: UseFormReturn<WebsiteCmsSectionFormData>) => React.ReactNode;
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

  const hidden = form.watch("status") === "archived";

  return (
    <form className="space-y-4 border border-admin-border bg-admin-surface-muted p-4 rounded-none" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">{heading}</h2>
          <p className="text-xs text-admin-muted">
            {summary} · {activeLocale.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-admin-muted">
          {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          {hidden ? "Hidden" : "Visible"}
        </div>
      </div>

      <Select
        label="Section status"
        disabled={isSaving}
        options={[
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
          { value: "archived", label: "Hidden / archived" },
        ]}
        {...form.register("status")}
        error={form.formState.errors.status?.message}
      />

      <LocalizedTextFields
        label="Title"
        name="title"
        register={form.register}
        setValue={form.setValue}
        watch={form.watch}
        errors={form.formState.errors}
        disabled={isSaving}
      />
      <LocalizedTextareaFields
        label="Description"
        name="description"
        register={form.register}
        setValue={form.setValue}
        watch={form.watch}
        errors={form.formState.errors}
        disabled={isSaving}
      />

      {children?.(form)}

      {error ? <p className="text-sm text-admin-danger">{error.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving} icon={<Save size={14} />}>
          Save section
        </Button>
      </div>
    </form>
  );
}
