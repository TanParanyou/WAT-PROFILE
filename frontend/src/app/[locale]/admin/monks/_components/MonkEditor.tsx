"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { monkAdminService } from "@/services/adminService";
import api from "@/services/adminApi";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { monkSchema, type MonkFormData } from "@/schemas/monk.schema";
import { ArrowLeft, Eye, Save, X } from "lucide-react";
import { useAppOptions } from "@/hooks/useAppOptions";
import { hasLegacyLocalizedRichText, normalizeLocalizedRichText } from "@/lib/rich-text/document";
import { richTextMigrationService } from "@/services/richTextMigrationService";
import { MonkCardPreview, GoogleSearchPreview } from "@/components/admin/preview";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };
const richTextLocales = ["th", "en", "de"] as const;

const getFieldError = (fieldError: unknown): string | undefined => {
  if (!fieldError) return undefined;
  if (typeof fieldError === "object") {
    const err = fieldError as Record<string, unknown>;
    if (typeof err.message === "string") return err.message;

    const th = err.th as Record<string, unknown> | undefined;
    const en = err.en as Record<string, unknown> | undefined;
    const de = err.de as Record<string, unknown> | undefined;

    if (th && typeof th.message === "string") return th.message;
    if (en && typeof en.message === "string") return en.message;
    if (de && typeof de.message === "string") return de.message;
  }
  return undefined;
};

interface MonkEditorProps {
  id?: string;
}

export function MonkEditor({ id }: MonkEditorProps) {
  const isEditMode = !!id;
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  const { getMonkPositionOptions } = useAppOptions();
  const positionOptions = getMonkPositionOptions();

  const methods = useForm<MonkFormData>({
    resolver: zodResolver(monkSchema),
    defaultValues: {
      name: { ...emptyLang },
      title: { ...emptyLang },
      bio: { ...emptyLang },
      slug: "",
      position: "monk",
      image_url: "",
      ordination_date: "",
      is_active: true,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isDirty },
  } = methods;

  // Fetch initial data if editing
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const monk = await monkAdminService.getById(id);
        const normalizedBio = normalizeLocalizedRichText(
          monk.bio,
          [...richTextLocales],
          "th",
        );

        reset({
          name: monk.name || { ...emptyLang },
          title: monk.title || { ...emptyLang },
          bio: normalizedBio,
          slug: monk.slug,
          position: monk.position || "monk",
          image_url: monk.image_url || "",
          ordination_date: monk.ordination_date?.split("T")[0] || "",
          is_active: monk.is_active,
        });

        if (hasLegacyLocalizedRichText(monk.bio)) {
          void richTextMigrationService.migrate({
            resource: "monk",
            id: String(monk.id),
            updated_at: monk.updated_at,
            field: "bio",
            value: normalizedBio,
          }).catch(() => undefined);
        }
      } catch (err: unknown) {
        handleApiError(err);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id, reset, handleApiError]);

  const onSubmit = async (data: MonkFormData) => {
    setIsLoading(true);
    try {
      let finalImageUrl = data.image_url;

      // Handle deferred image upload if image_url is a File object
      if (data.image_url instanceof File) {
        const formData = new FormData();
        formData.append("file", data.image_url);
        const uploadRes = await api.post("/admin/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalImageUrl = uploadRes.data.data?.url || uploadRes.data.data;
      }

      const payload = {
        ...data,
        image_url: finalImageUrl,
      };

      if (isEditMode && id) {
        await monkAdminService.update(
          id,
          payload as unknown as Record<string, unknown>,
        );
      } else {
        await monkAdminService.create(
          payload as unknown as Record<string, unknown>,
        );
      }
      toast.success(t("common.success"));
      router.push("/admin/monks");
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <PageLoading />;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-[calc(100vh-7rem)] flex flex-col justify-between"
      >
        <div className="space-y-6 flex-1 mb-8">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-admin-muted mb-1">
                <button
                  type="button"
                  onClick={() => router.push("/admin/monks")}
                  className="hover:text-admin-foreground flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-admin-focus rounded"
                >
                  <ArrowLeft size={14} />
                  {t("monks.backToList")}
                </button>
              </div>
              <h1 className="text-xl font-semibold text-admin-foreground">
                {isEditMode ? t("monks.edit") : t("monks.create")}
              </h1>
              <p className="text-sm text-admin-muted">
                {isEditMode ? t("monks.editDesc") : t("monks.createDesc")}
              </p>
            </div>

            {/* Mobile Preview Button */}
            <div className="lg:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMobilePreviewOpen(true)}
                icon={<Eye size={16} />}
                className="w-full sm:w-auto text-admin-action border-admin-action hover:bg-admin-action-surface"
              >
                ดูพรีวิวแบบเรียลไทม์
              </Button>
            </div>
          </div>

          {/* Form Content in Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-7 bg-admin-surface rounded-none border border-admin-border p-6 space-y-4">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <MultiLangInput
                    label={t("monks.form.name")}
                    value={field.value as MultiLangText}
                    onChange={field.onChange}
                    error={getFieldError(errors.name)}
                    required
                  />
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="slug"
                  label={t("monks.form.slug")}
                  placeholder="monk-slug-name"
                  {...register("slug")}
                  error={errors.slug?.message}
                  required
                />
                <Controller
                  control={control}
                  name="position"
                  render={({ field }) => (
                    <Select
                      id="position"
                      label={t("monks.form.position")}
                      options={positionOptions}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={errors.position?.message}
                      required
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="ordination_date"
                  render={({ field }) => (
                    <DatePicker
                      id="ordination_date"
                      label={t("monks.form.ordinationDate")}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.ordination_date?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <MultiLangInput
                      label={t("monks.form.titleRank")}
                      value={(field.value || { ...emptyLang }) as MultiLangText}
                      onChange={field.onChange}
                      error={getFieldError(errors.title)}
                    />
                  )}
                />
              </div>

              <Controller
                control={control}
                name="bio"
                render={({ field }) => (
                  <MultiLangRichText
                    label={t("monks.form.bio")}
                    locales={[
                      { code: "th", label: "TH" },
                      { code: "en", label: "EN" },
                      { code: "de", label: "DE" }
                    ]}
                    defaultLocale="th"
                    value={normalizeLocalizedRichText(field.value, [...richTextLocales], "th")}
                    onChange={field.onChange}
                    error={getFieldError(errors.bio)}
                  />
                )}
              />

              <Controller
                control={control}
                name="image_url"
                render={({ field }) => (
                  <div className="space-y-1">
                    <ImageUpload
                      label={t("monks.form.image")}
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                    {getFieldError(errors.image_url) && (
                      <p className="text-sm text-admin-danger">
                        {getFieldError(errors.image_url)}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    label={t("monks.form.active")}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>

            {/* Right Column: Sticky Live Previews Panel */}
            <div className="hidden lg:block lg:col-span-5 sticky top-6 self-start space-y-6">
              <MonkCardPreview
                name={watch("name")}
                title={watch("title")}
                position={watch("position")}
                ordinationDate={watch("ordination_date")}
                imageUrl={watch("image_url")}
                isActive={watch("is_active")}
              />

              <GoogleSearchPreview
                seoTitle={watch("name")}
                pageTitle={watch("name")}
                canonicalUrl={`/monks/${watch("slug") || "monk-name"}`}
                ogImage={typeof watch("image_url") === "string" ? watch("image_url") : ""}
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-admin-border bg-admin-surface/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-admin-warning">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-admin-warning/75 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-admin-warning"></span>
                </span>
                {t("website.unsavedEdits")}
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/monks")}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              icon={<Save size={16} />}
              className="w-full sm:w-auto"
            >
              {isEditMode ? t("common.saveChanges") : t("common.save")}
            </Button>
          </div>
        </div>

        {/* Mobile Preview Drawer Modal */}
        {isMobilePreviewOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-admin-surface p-4 lg:hidden overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-admin-border pb-3 sticky top-0 bg-admin-surface z-10 py-1">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-admin-action" />
                <h3 className="text-base font-semibold text-admin-foreground">
                  พรีวิวการแสดงผล (Mobile Preview)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="p-1.5 text-admin-muted hover:text-admin-foreground rounded-none border border-admin-border bg-admin-surface-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 pt-2 pb-8">
              <MonkCardPreview
                name={watch("name")}
                title={watch("title")}
                position={watch("position")}
                ordinationDate={watch("ordination_date")}
                imageUrl={watch("image_url")}
                isActive={watch("is_active")}
              />

              <GoogleSearchPreview
                seoTitle={watch("name")}
                pageTitle={watch("name")}
                canonicalUrl={`/monks/${watch("slug") || "monk-name"}`}
                ogImage={typeof watch("image_url") === "string" ? watch("image_url") : ""}
              />
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
