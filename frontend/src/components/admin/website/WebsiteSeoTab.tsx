"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ContentPage } from "@/types/website-cms";
import type { WebsiteCmsPageFormData } from "@/schemas/website-cms.schema";
import { websiteCmsPageFormSchema } from "@/schemas/website-cms.schema";
import { contentPageToFormValues, getSeoHealth } from "@/utils/websiteCms";
import { SeoPreviewPanel } from "@/components/admin/website/SeoPreviewPanel";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

export function WebsiteSeoTab({
  page,
  locale,
  isSaving,
  error,
  onSubmit,
  onDirtyChange,
  onPreviewDraftChange,
}: {
  page: ContentPage;
  locale: string;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (values: WebsiteCmsPageFormData) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onPreviewDraftChange?: (values: WebsiteCmsPageFormData) => void;
}) {
  const t = useTranslations("Admin.website");
  const health = getSeoHealth(page);
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

  useEffect(() => {
    onPreviewDraftChange?.(form.getValues());
    const subscription = form.watch((values) => {
      onPreviewDraftChange?.(values as WebsiteCmsPageFormData);
    });
    return () => subscription.unsubscribe();
  }, [form, onPreviewDraftChange]);

  return (
    <div className="space-y-4">
      <div className="border border-admin-border bg-admin-surface-muted p-3 rounded-none">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-admin-muted">{t("seoScore")}</div>
        <div className="mt-1 text-2xl font-semibold text-admin-foreground">{health.score}%</div>
        {health.warnings.length ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-admin-warning">
            {health.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-admin-success">{t("seoBasicsReady")}</p>
        )}
      </div>
      <SeoPreviewPanel page={page} locale={locale} />
      <form className="space-y-4 border border-admin-border bg-admin-surface p-4 rounded-none" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-admin-foreground">{t("seoTitle")}</h2>
            <p className="text-xs text-admin-muted">Search metadata and index controls for the public page.</p>
          </div>
          <Button type="submit" size="sm" isLoading={isSaving}>
            {t("saveSeo")}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Canonical URL" disabled={isSaving} {...form.register("seo.canonical_url" as never)} />
          <Input label="OG image URL" disabled={isSaving} {...form.register("seo.og_image" as never)} />
        </div>
        <LocalizedTextFields
          label="Meta title"
          name="seo.title"
          register={form.register}
          setValue={form.setValue}
          watch={form.watch}
          errors={form.formState.errors}
          disabled={isSaving}
        />
        <LocalizedTextareaFields
          label="Meta description"
          name="seo.description"
          register={form.register}
          setValue={form.setValue}
          watch={form.watch}
          errors={form.formState.errors}
          disabled={isSaving}
          rows={3}
        />
        <Switch label="Noindex" disabled={isSaving} {...form.register("seo.noindex" as never)} />
        {error ? <p className="text-sm text-admin-danger">{error.message}</p> : null}
      </form>
    </div>
  );
}
