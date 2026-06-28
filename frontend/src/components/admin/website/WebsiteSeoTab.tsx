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
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

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
      <div className="border border-zinc-200 bg-zinc-50 p-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{t("seoScore")}</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-950">{health.score}%</div>
        {health.warnings.length ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-700">
            {health.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-emerald-700">{t("seoBasicsReady")}</p>
        )}
      </div>
      <SeoPreviewPanel page={page} locale={locale} />
      <form className="space-y-4 border border-zinc-200 bg-white p-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">{t("seoTitle")}</h2>
            <p className="text-xs text-zinc-500">Search metadata and index controls for the public page.</p>
          </div>
          <Button type="submit" size="sm" isLoading={isSaving}>
            {t("saveSeo")}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Canonical URL" disabled={isSaving} {...form.register("seo.canonical_url" as never)} />
          <Input label="OG image URL" disabled={isSaving} {...form.register("seo.og_image" as never)} />
        </div>
        <LocalizedSeoFields form={form} disabled={isSaving} />
        <Checkbox label="Noindex" disabled={isSaving} {...form.register("seo.noindex" as never)} />
        {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      </form>
    </div>
  );
}

function LocalizedSeoFields({
  form,
  disabled,
}: {
  form: ReturnType<typeof useForm<WebsiteCmsPageFormData>>;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(["th", "en", "de"] as const).map((locale) => (
        <div key={locale} className="space-y-3 border border-zinc-200 bg-zinc-50 p-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{locale}</div>
          <Input label="Meta title" disabled={disabled} {...form.register(`seo.title.${locale}` as never)} />
          <Input label="Meta description" disabled={disabled} {...form.register(`seo.description.${locale}` as never)} />
        </div>
      ))}
    </div>
  );
}
