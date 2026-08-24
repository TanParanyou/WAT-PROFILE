"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { MediaImagePicker } from "@/components/admin/media/MediaImagePicker";
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
import { useConfirm } from "@/hooks/useConfirm";
import type { MultiLangText } from "@/types/api";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { monkSchema, type MonkFormData } from "@/schemas/monk.schema";
import { ArrowLeft, Eye, X, ExternalLink, Trash2, Clock, Calendar } from "lucide-react";
import { FormActionBar } from "@/components/admin/FormActionBar";
import { useAppOptions } from "@/hooks/useAppOptions";
import { hasLegacyLocalizedRichText, normalizeLocalizedRichText } from "@/lib/rich-text/document";
import { richTextMigrationService } from "@/services/richTextMigrationService";
import { getFieldError } from "@/utils/form-errors";
import { generateDefaultSlug, generateSlug } from "@/utils/slug";
import { emptyLang } from "@/constants";
import { MonkCardPreview, GoogleSearchPreview } from "@/components/admin/preview";
import { calculatePansa } from "@/utils/monk";

interface MonkEditorProps {
  id?: string;
}

interface MonkMetadata {
  created_at?: string;
  updated_at?: string;
}

export function MonkEditor({ id }: MonkEditorProps) {
  const isEditMode = !!id;
  const t = useTranslations("Admin");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [metadata, setMetadata] = useState<MonkMetadata | null>(null);

  const { getMonkPositionOptions } = useAppOptions();
  const positionOptions = getMonkPositionOptions();

  const methods = useForm<MonkFormData>({
    resolver: zodResolver(monkSchema),
    defaultValues: {
      name: { ...emptyLang },
      title: { ...emptyLang },
      dharma_name: { ...emptyLang },
      education: { ...emptyLang },
      bio: { ...emptyLang },
      slug: isEditMode ? "" : generateDefaultSlug("monk"),
      position: "monk",
      display_order: 0,
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
    setValue,
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
        const normalizedBio = normalizeLocalizedRichText(monk.bio);

        reset({
          name: monk.name || { ...emptyLang },
          title: monk.title || { ...emptyLang },
          dharma_name: monk.dharma_name || { ...emptyLang },
          education: monk.education || { ...emptyLang },
          bio: normalizedBio,
          slug: monk.slug,
          position: monk.position || "monk",
          display_order: monk.display_order ?? 0,
          image_url: monk.image_url || "",
          ordination_date: monk.ordination_date?.split("T")[0] || "",
          is_active: monk.is_active,
        });

        setMetadata({
          created_at: monk.created_at,
          updated_at: monk.updated_at,
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

  const watchedOrdinationDate = watch("ordination_date");
  const calculatedPansa = calculatePansa(watchedOrdinationDate);
  const currentSlug = watch("slug");

  const handleAutoSlug = () => {
    const currentName = watch("name");
    const slugValue = generateSlug(currentName) || generateDefaultSlug("monk");
    setValue("slug", slugValue, { shouldDirty: true, shouldValidate: true });
  };

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

  const handleDelete = async () => {
    if (!id) return;
    await confirm({
      title: t("monks.deleteConfirmTitle"),
      message: t("monks.deleteConfirmDesc"),
      variant: "danger",
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await monkAdminService.delete(Number(id));
          toast.success(t("common.success"));
          router.push("/admin/monks");
        } catch (err: unknown) {
          handleApiError(err);
          throw err;
        } finally {
          setIsDeleting(false);
        }
      },
    });
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

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isEditMode && currentSlug && (
                <a
                  href={`/${locale}/monks/${currentSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-admin-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground rounded-none transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>{t("monks.viewPublic")}</span>
                </a>
              )}

              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || isLoading}
                  icon={<Trash2 size={14} />}
                  className="text-admin-danger border-admin-danger/40 hover:bg-admin-danger/10"
                >
                  {t("monks.deleteMonk")}
                </Button>
              )}

              {/* Mobile Preview Button */}
              <div className="lg:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobilePreviewOpen(true)}
                  icon={<Eye size={16} />}
                  className="text-admin-action border-admin-action hover:bg-admin-action-surface"
                >
                  {t("monks.previewRealtime")}
                </Button>
              </div>
            </div>
          </div>

          {/* Form Content in Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="bg-admin-surface rounded-none border border-admin-border p-6 md:p-8 space-y-6">
                <h3 className="text-sm font-semibold text-admin-foreground uppercase tracking-wider border-b border-admin-border pb-3">
                  {t("monks.form.name")} & {t("monks.form.dharmaName")}
                </h3>

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

                <Controller
                  control={control}
                  name="dharma_name"
                  render={({ field }) => (
                    <MultiLangInput
                      label={t("monks.form.dharmaName")}
                      value={(field.value || { ...emptyLang }) as MultiLangText}
                      onChange={field.onChange}
                      error={getFieldError(errors.dharma_name)}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <Controller
                    control={control}
                    name="education"
                    render={({ field }) => (
                      <MultiLangInput
                        label={t("monks.form.education")}
                        value={(field.value || { ...emptyLang }) as MultiLangText}
                        onChange={field.onChange}
                        error={getFieldError(errors.education)}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Section 2: Position, Date & Display */}
              <div className="bg-admin-surface rounded-none border border-admin-border p-6 md:p-8 space-y-6">
                <h3 className="text-sm font-semibold text-admin-foreground uppercase tracking-wider border-b border-admin-border pb-3">
                  {t("monks.form.position")} & {t("monks.form.ordinationDate")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="slug" className="text-sm font-medium text-admin-body">
                        {t("monks.form.slug")} <span className="text-admin-danger">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoSlug}
                        className="text-xs text-admin-action hover:underline focus-visible:outline-2 focus-visible:outline-admin-focus"
                      >
                        {t("common.generateSlug")}
                      </button>
                    </div>
                    <Input
                      id="slug"
                      placeholder="monk-slug-name"
                      {...register("slug")}
                      error={errors.slug?.message}
                      required
                    />
                  </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
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
                    {calculatedPansa !== null && (
                      <div className="flex items-center gap-1.5 text-xs text-admin-action font-medium pt-1">
                        <span className="bg-admin-action-surface border border-admin-action/30 px-2.5 py-1 rounded-none">
                          {t("monks.form.pansaCount", { count: calculatedPansa })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Input
                      id="display_order"
                      type="number"
                      label={t("monks.form.displayOrder")}
                      {...register("display_order", { valueAsNumber: true })}
                      error={errors.display_order?.message}
                    />
                    <p className="text-xs text-admin-muted mt-1.5">
                      {t("monks.form.displayOrderHelp")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Biography & Media */}
              <div className="bg-admin-surface rounded-none border border-admin-border p-6 md:p-8 space-y-6">
                <h3 className="text-sm font-semibold text-admin-foreground uppercase tracking-wider border-b border-admin-border pb-3">
                  {t("monks.form.bio")} & {t("monks.form.image")}
                </h3>

                <Controller
                  control={control}
                  name="bio"
                  render={({ field }) => (
                    <MultiLangRichText
                      label={t("monks.form.bio")}
                      value={normalizeLocalizedRichText(field.value)}
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
                      <MediaImagePicker
                        label={t("monks.form.image")}
                        value={(field.value as string) || ""}
                        onChange={field.onChange}
                      />
                      {getFieldError(errors.image_url) && (
                        <p className="text-sm text-admin-danger mt-1">
                          {getFieldError(errors.image_url)}
                        </p>
                      )}
                    </div>
                  )}
                />

                <div className="pt-4 border-t border-admin-border">
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
              </div>
            </div>

            {/* Right Column: Sticky Live Previews & Metadata Panel */}
            <div className="hidden lg:block lg:col-span-4 sticky top-6 self-start space-y-6">
              <MonkCardPreview
                name={watch("name")}
                title={watch("title")}
                dharmaName={watch("dharma_name")}
                education={watch("education")}
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

              {/* Audit Metadata Panel */}
              {metadata && (
                <div className="border border-admin-border bg-admin-surface p-4 space-y-2 text-xs text-admin-muted">
                  <h4 className="font-semibold text-admin-foreground uppercase tracking-wider text-[11px] border-b border-admin-border pb-1.5">
                    {t("monks.form.auditTitle")}
                  </h4>
                  {metadata.created_at && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {t("monks.form.createdAt")}
                      </span>
                      <span>{new Date(metadata.created_at).toLocaleString()}</span>
                    </div>
                  )}
                  {metadata.updated_at && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {t("monks.form.updatedAt")}
                      </span>
                      <span>{new Date(metadata.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <FormActionBar
          isDirty={isDirty}
          isLoading={isLoading}
          isEditMode={isEditMode}
          onCancel={() => router.push("/admin/monks")}
        />

        {/* Mobile Preview Drawer Modal */}
        {isMobilePreviewOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-admin-surface p-4 lg:hidden overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-admin-border pb-3 sticky top-0 bg-admin-surface z-10 py-1">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-admin-action" />
                <h3 className="text-base font-semibold text-admin-foreground">
                  {t("monks.mobilePreviewTitle")}
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
                dharmaName={watch("dharma_name")}
                education={watch("education")}
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
      <ConfirmDialog />
    </FormProvider>
  );
}
