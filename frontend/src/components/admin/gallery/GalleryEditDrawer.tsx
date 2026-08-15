"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedText } from "@/utils/localizedText";
import { gallerySchema, type GalleryFormData } from "@/schemas/gallery.schema";
import { galleryAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { Gallery, GalleryCategory, Event } from "@/types/entities";
import type { MultiLangText } from "@/types/api";
import { emptyLang } from "@/constants";


interface GalleryEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery | null;
  categories: GalleryCategory[];
  events: Event[];
  onSuccess: () => void;
}

export function GalleryEditDrawer({
  isOpen,
  onClose,
  gallery,
  categories,
  events,
  onSuccess,
}: GalleryEditDrawerProps) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      image_url: "",
      caption: { ...emptyLang },
      category_id: null,
      event_id: null,
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (gallery && isOpen) {
      reset({
        image_url: gallery.image_url,
        caption: gallery.caption
          ? {
              th: gallery.caption.th || "",
              en: gallery.caption.en || "",
              de: gallery.caption.de || "",
            }
          : { ...emptyLang },
        category_id: gallery.category_id ?? null,
        event_id: gallery.event_id ?? null,
        display_order: gallery.display_order ?? 0,
        is_active: gallery.is_active ?? true,
      });
    }
  }, [gallery, isOpen, reset]);

  const onSubmit = async (data: GalleryFormData) => {
    if (!gallery) return;
    setIsSubmitting(true);
    try {
      const caption: MultiLangText | undefined = data.caption
        ? {
            th: data.caption.th || "",
            en: data.caption.en || "",
            de: data.caption.de || "",
          }
        : undefined;

      await galleryAdminService.update(gallery.id, {
        image_url: typeof data.image_url === "string" ? data.image_url : gallery.image_url,
        caption,
        category_id: data.category_id,
        event_id: data.event_id,
        display_order: data.display_order,
        is_active: data.is_active,
      });
      toast.success(t("common.success"));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: "", label: t("gallery.noCategory") },
    ...categories.map((c) => ({
      value: String(c.id),
      label: getLocalizedText(c.name, locale) || c.slug,
    })),
  ];

  const eventOptions = [
    { value: "", label: t("gallery.noEvent") },
    ...events.map((e) => ({
      value: String(e.id),
      label: getLocalizedText(e.title, locale) || `กิจกรรม #${e.id}`,
    })),
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("gallery.editTitle")}
      description={`ID: #${gallery?.id || ""}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        {/* Thumbnail preview */}
        {gallery?.image_url && (
          <div className="flex items-center gap-4 p-3 bg-admin-surface-muted border border-admin-border rounded-none">
            <img
              src={gallery.image_url}
              alt={getLocalizedText(gallery.caption, locale) || ""}
              className="h-20 w-28 object-cover rounded-none border border-admin-border shrink-0"
            />
            <div className="text-xs space-y-1 overflow-hidden">
              <p className="font-medium text-admin-foreground truncate">{gallery.image_url}</p>
              <p className="text-admin-muted">ID: #{gallery.id}</p>
            </div>
          </div>
        )}

        {/* Captions */}
        <Controller
          control={control}
          name="caption"
          render={({ field }) => (
            <MultiLangInput
              label={t("gallery.captionLabel")}
              type="textarea"
              value={(field.value || { ...emptyLang }) as MultiLangText}
              onChange={field.onChange}
              error={
                errors.caption?.th?.message ||
                errors.caption?.en?.message ||
                errors.caption?.de?.message
              }
            />
          )}
        />

        {/* Category */}
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <Select
              id="drawer-category"
              label={t("gallery.category")}
              options={categoryOptions}
              value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
              onChange={(e) =>
                field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              error={errors.category_id?.message}
            />
          )}
        />

        {/* Event */}
        <Controller
          control={control}
          name="event_id"
          render={({ field }) => (
            <Select
              id="drawer-event"
              label={t("gallery.relatedEvent")}
              options={eventOptions}
              value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
              onChange={(e) =>
                field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              error={errors.event_id?.message}
            />
          )}
        />

        {/* Display order */}
        <Input
          id="drawer-display-order"
          label={t("gallery.displayOrder")}
          type="number"
          {...register("display_order", { valueAsNumber: true })}
          error={errors.display_order?.message}
        />

        {/* Status */}
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch
              id="drawer-is-active"
              label={t("gallery.activeLabel")}
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />

        {/* Actions */}
        <div className="pt-4 border-t border-admin-border flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
