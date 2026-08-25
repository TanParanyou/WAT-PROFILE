"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  chantingSchema,
  type ChantingFormData,
} from "@/schemas/chanting.schema";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { chantingAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import { useConfirm } from "@/hooks/useConfirm";
import { emptyLang } from "@/constants";
import { ArrowLeft, Save, Trash2, Music } from "lucide-react";
import { generateDefaultSlug } from "@/utils/slug";
import type { Chanting } from "@/types/chanting";
import type { MultiLangText } from "@/types/api";

interface ChantingEditorProps {
  id?: string;
}

export function ChantingEditor({ id }: ChantingEditorProps) {
  const isEditMode = !!id;
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  const categoryOptions = [
    { value: "morning_chant", label: t("chanting.categories.morning_chant") },
    { value: "evening_chant", label: t("chanting.categories.evening_chant") },
    { value: "paritta", label: t("chanting.categories.paritta") },
    { value: "blessing", label: t("chanting.categories.blessing") },
    { value: "funeral", label: t("chanting.categories.funeral") },
    { value: "general", label: t("chanting.categories.general") },
  ];

  const methods = useForm<ChantingFormData>({
    resolver: zodResolver(chantingSchema),
    defaultValues: {
      title: { ...emptyLang },
      subtitle: { ...emptyLang },
      category: "general",
      slug: isEditMode ? "" : generateDefaultSlug("chant"),
      pali_thai: "",
      pali_roman: "",
      translation: { ...emptyLang },
      audio_url: "",
      duration_seconds: 0,
      display_order: 0,
      is_active: true,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setIsFetching(true);

    chantingAdminService
      .getById(id)
      .then((data: Chanting) => {
        if (mounted && data) {
          const cat =
            data.category === "all" || !data.category ? "general" : data.category;

          reset({
            title: {
              th: data.title?.th || "",
              en: data.title?.en || "",
              de: data.title?.de || "",
            },
            subtitle: {
              th: data.subtitle?.th || "",
              en: data.subtitle?.en || "",
              de: data.subtitle?.de || "",
            },
            category: cat,
            slug: data.slug || "",
            pali_thai: data.pali_thai || "",
            pali_roman: data.pali_roman || "",
            translation: {
              th: data.translation?.th || "",
              en: data.translation?.en || "",
              de: data.translation?.de || "",
            },
            audio_url: data.audio_url || "",
            duration_seconds: data.duration_seconds || 0,
            display_order: data.display_order || 0,
            is_active: data.is_active ?? true,
          });
        }
      })
      .catch((err: unknown) => {
        handleApiError(err);
      })
      .finally(() => {
        if (mounted) setIsFetching(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, reset, handleApiError]);

  const onSubmit = async (data: ChantingFormData) => {
    setIsLoading(true);
    try {
      const payload: Partial<Chanting> = {
        title: {
          th: data.title.th,
          en: data.title.en || "",
          de: data.title.de || "",
        },
        subtitle: data.subtitle
          ? {
              th: data.subtitle.th || "",
              en: data.subtitle.en || "",
              de: data.subtitle.de || "",
            }
          : undefined,
        category: data.category as Chanting["category"],
        slug: data.slug,
        pali_thai: data.pali_thai,
        pali_roman: data.pali_roman,
        translation: {
          th: data.translation.th,
          en: data.translation.en || "",
          de: data.translation.de || "",
        },
        audio_url: data.audio_url || "",
        duration_seconds: Number(data.duration_seconds) || 0,
        display_order: Number(data.display_order) || 0,
        is_active: data.is_active,
      };
      if (isEditMode && id) {
        await chantingAdminService.update(id, payload);
        toast.success(t("common.savedSuccessfully") || "บันทึกข้อมูลเรียบร้อยแล้ว");
      } else {
        await chantingAdminService.create(payload);
        toast.success(t("common.createdSuccessfully") || "สร้างบทสวดมนต์เรียบร้อยแล้ว");
      }
      router.push("/admin/chanting");
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await chantingAdminService.delete(id);
          toast.success(t("common.deletedSuccessfully") || "ลบข้อมูลเรียบร้อยแล้ว");
          router.push("/admin/chanting");
        } catch (err: unknown) {
          handleApiError(err);
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  if (isFetching) {
    return <PageLoading />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-admin-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/chanting")}
            className="p-2 text-admin-muted hover:text-admin-foreground transition-colors rounded-none focus-visible:outline-2 focus-visible:outline-admin-focus"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-admin-foreground">
              {isEditMode ? t("chanting.edit") : t("chanting.create")}
            </h1>
            <p className="text-xs text-admin-muted">
              {isEditMode ? `ID: ${id}` : t("chanting.createSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditMode && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="inline-flex items-center gap-1.5"
            >
              <Trash2 size={16} />
              <span>{t("common.delete")}</span>
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="inline-flex items-center gap-1.5"
          >
            <Save size={16} />
            <span>{t("common.save")}</span>
          </Button>
        </div>
      </div>

      {/* Form Body Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title & Subtitle */}
          <div className="border border-admin-border bg-admin-surface p-6 space-y-5">
            <h2 className="text-base font-semibold text-admin-foreground border-b border-admin-border pb-3">
              {t("chanting.sectionTitle")}
            </h2>

            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <MultiLangInput
                  label={t("chanting.titleLabel")}
                  value={field.value as MultiLangText}
                  onChange={field.onChange}
                  required
                />
              )}
            />

            <Controller
              name="subtitle"
              control={control}
              render={({ field }) => (
                <MultiLangInput
                  label={t("chanting.subtitleLabel")}
                  value={(field.value || { ...emptyLang }) as MultiLangText}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Pali Texts (Thai & Roman Scripts) */}
          <div className="border border-admin-border bg-admin-surface p-6 space-y-5">
            <h2 className="text-base font-semibold text-admin-foreground border-b border-admin-border pb-3">
              {t("chanting.sectionPali")}
            </h2>

            <Textarea
              {...register("pali_thai")}
              label={t("chanting.paliThai")}
              placeholder="เช่น นะโม ตัสสะ ภะคะวะโต..."
              rows={5}
              required
              error={errors.pali_thai?.message}
            />

            <Textarea
              {...register("pali_roman")}
              label={t("chanting.paliRoman")}
              placeholder="เช่น Namo tassa bhagavato arahato sammāsambuddhassa..."
              rows={5}
              required
              error={errors.pali_roman?.message}
            />
          </div>

          {/* Translation */}
          <div className="border border-admin-border bg-admin-surface p-6 space-y-5">
            <h2 className="text-base font-semibold text-admin-foreground border-b border-admin-border pb-3">
              {t("chanting.sectionTranslation")}
            </h2>

            <Controller
              name="translation"
              control={control}
              render={({ field }) => (
                <MultiLangInput
                  label={t("chanting.translationLabel")}
                  value={field.value as MultiLangText}
                  onChange={field.onChange}
                  type="textarea"
                  required
                />
              )}
            />
          </div>
        </div>

        {/* Sidebar Column (1/3) */}
        <div className="space-y-6">
          {/* Category & Status Settings */}
          <div className="border border-admin-border bg-admin-surface p-6 space-y-5">
            <h2 className="text-base font-semibold text-admin-foreground border-b border-admin-border pb-3">
              {t("chanting.sectionSettings")}
            </h2>

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  id="chanting-category"
                  label={t("chanting.category")}
                  options={categoryOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.category?.message}
                />
              )}
            />

            <Input
              {...register("slug")}
              label="Slug (URL)"
              placeholder="namo-tassa"
              required
              error={errors.slug?.message}
            />

            <Input
              {...register("display_order")}
              type="number"
              label={t("columns.order")}
              placeholder="0"
              error={errors.display_order?.message}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label={t("common.activeStatus")}
                />
              )}
            />
          </div>

          {/* Audio Stream Settings */}
          <div className="border border-admin-border bg-admin-surface p-6 space-y-5">
            <h2 className="text-base font-semibold text-admin-foreground border-b border-admin-border pb-3 flex items-center gap-2">
              <Music size={16} className="text-admin-info" />
              <span>{t("chanting.audioSettings")}</span>
            </h2>

            <Input
              {...register("audio_url")}
              label={t("chanting.audioUrl")}
              placeholder="https://.../chanting.mp3"
              error={errors.audio_url?.message}
            />

            <Input
              {...register("duration_seconds")}
              type="number"
              label={t("chanting.durationSeconds")}
              placeholder="120"
              error={errors.duration_seconds?.message}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog />
    </form>
  );
}
