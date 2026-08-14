"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import api from "@/services/adminApi";
import {
  galleryAdminService,
  galleryCategoryAdminService,
  eventAdminService,
} from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { ApiResponse, MultiLangText } from "@/types/api";
import type { GalleryCategory, Event } from "@/types/entities";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedText } from "@/utils/localizedText";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gallerySchema, type GalleryFormData } from "@/schemas/gallery.schema";
import { Upload, X, CheckCircle, AlertCircle, GripVertical } from "lucide-react";
import { cn } from "@/utils/cn";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

async function uploadGalleryImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ApiResponse<{ url: string }>>(
    "/admin/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  const imageUrl = response.data.data?.url;
  if (!imageUrl) {
    throw new Error("Upload response did not include an image URL");
  }

  return imageUrl;
}

interface BatchUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  captionTh: string;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
}

export default function GalleryUploadPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();

  const [mode, setMode] = useState<"single" | "batch">("batch");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Batch upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [batchItems, setBatchItems] = useState<BatchUploadItem[]>([]);
  const [batchCategoryId, setBatchCategoryId] = useState<string>("");
  const [batchEventId, setBatchEventId] = useState<string>("");
  const [batchIsActive, setBatchIsActive] = useState<boolean>(true);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const [dragOverQueueIndex, setDragOverQueueIndex] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
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

  // Load categories & events
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, evRes] = await Promise.all([
          galleryCategoryAdminService.getAll(),
          eventAdminService.getAll(),
        ]);
        setCategories(catRes.data.filter((c) => c.is_active));
        setEvents(evRes.data || []);
      } catch (err: unknown) {
        handleApiError(err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      batchItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [batchItems]);

  const onSingleSubmit = async (data: GalleryFormData) => {
    if (!data.image_url) {
      toast.error(t("gallery.pleaseSelectImage"));
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl =
        data.image_url instanceof File
          ? await uploadGalleryImage(data.image_url)
          : data.image_url;
      const caption = data.caption
        ? {
            th: data.caption.th ?? "",
            en: data.caption.en ?? "",
            de: data.caption.de ?? "",
          }
        : undefined;

      await galleryAdminService.create({
        image_url: imageUrl,
        caption,
        category_id: data.category_id,
        event_id: data.event_id,
        display_order: data.display_order,
        is_active: data.is_active,
      });
      toast.success(t("common.success"));
      router.push("/admin/gallery");
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: BatchUploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        validFiles.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          captionTh: nameWithoutExt,
          status: "idle",
        });
      }
    }

    if (validFiles.length === 0) {
      toast.error(t("gallery.imageFilesOnly"));
      return;
    }

    setBatchItems((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleBatchCaptionChange = (id: string, newCaption: string) => {
    setBatchItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, captionTh: newCaption } : i)),
    );
  };

  const handleQueueDragStart = (e: React.DragEvent, index: number) => {
    setDraggedQueueIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleQueueDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverQueueIndex !== index) {
      setDragOverQueueIndex(index);
    }
  };

  const handleQueueDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedQueueIndex !== null && draggedQueueIndex !== targetIndex) {
      setBatchItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(draggedQueueIndex, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
    }
    setDraggedQueueIndex(null);
    setDragOverQueueIndex(null);
  };

  const handleQueueDragEnd = () => {
    setDraggedQueueIndex(null);
    setDragOverQueueIndex(null);
  };

  const handleBatchUploadSubmit = async () => {
    if (batchItems.length === 0) {
      toast.error(t("gallery.selectAtLeastOne"));
      return;
    }

    setIsUploadingBatch(true);
    setUploadProgress({ current: 0, total: batchItems.length });

    const createdGalleries: Array<{
      image_url: string;
      caption: MultiLangText;
      category_id: number | null;
      event_id: number | null;
      display_order: number;
      is_active: boolean;
    }> = [];

    const categoryId = batchCategoryId ? parseInt(batchCategoryId, 10) : null;
    const eventId = batchEventId ? parseInt(batchEventId, 10) : null;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      setBatchItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "uploading" } : it)),
      );

      try {
        const imageUrl = await uploadGalleryImage(item.file);
        createdGalleries.push({
          image_url: imageUrl,
          caption: { th: item.captionTh, en: "", de: "" },
          category_id: categoryId,
          event_id: eventId,
          display_order: i,
          is_active: batchIsActive,
        });

        setBatchItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: "success" } : it)),
        );
        successCount++;
      } catch {
        failCount++;
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: "error", errorMessage: t("gallery.uploadImageFailed") }
              : it,
          ),
        );
      }

      setUploadProgress({ current: i + 1, total: batchItems.length });
    }

    // Create records in database via batch endpoint
    if (createdGalleries.length > 0) {
      try {
        await galleryAdminService.createBatch(createdGalleries);
        toast.success(t("gallery.uploadSuccess", { count: successCount }));
        setTimeout(() => {
          router.push("/admin/gallery");
        }, 1200);
      } catch {
        toast.error(t("gallery.saveDbFailed"));
      }
    } else if (failCount > 0) {
      toast.error(t("gallery.uploadFailed", { count: failCount }));
    }

    setIsUploadingBatch(false);
  };

  if (isLoadingData) {
    return <PageLoading text={t("gallery.loadingData")} />;
  }

  const categoryOptions = [
    { value: "", label: t("gallery.noCategory") },
    ...categories.map((cat) => ({
      value: cat.id.toString(),
      label: getLocalizedText(cat.name, locale) || cat.slug,
    })),
  ];

  const eventOptions = [
    { value: "", label: t("gallery.noEvent") },
    ...events.map((e) => ({
      value: e.id.toString(),
      label: getLocalizedText(e.title, locale) || `กิจกรรม #${e.id}`,
    })),
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("gallery.upload")}
        breadcrumbs={[
          { label: t("gallery.title"), href: "/admin/gallery" },
          { label: t("gallery.upload") },
        ]}
        actions={
          <div className="flex items-center rounded-none border border-admin-border bg-admin-surface p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("batch")}
              className={`px-3.5 py-2 min-h-[38px] rounded-none transition-colors ${
                mode === "batch"
                  ? "bg-admin-primary text-admin-on-action"
                  : "text-admin-muted hover:text-admin-foreground"
              }`}
            >
              {t("gallery.batchUpload")}
            </button>
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`px-3.5 py-2 min-h-[38px] rounded-none transition-colors ${
                mode === "single"
                  ? "bg-admin-primary text-admin-on-action"
                  : "text-admin-muted hover:text-admin-foreground"
              }`}
            >
              {t("gallery.singleUpload")}
            </button>
          </div>
        }
      />

      {mode === "batch" ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Dropzone & File Queue */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesAdded(e.dataTransfer.files);
              }}
              className="border border-dashed border-admin-border hover:border-admin-focus hover:bg-admin-surface-muted/50 transition-colors p-8 text-center cursor-pointer rounded-none bg-admin-surface"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesAdded(e.target.files)}
              />
              <div className="mx-auto w-12 h-12 rounded-none bg-admin-surface-muted flex items-center justify-center text-admin-muted mb-3 border border-admin-border">
                <Upload size={24} />
              </div>
              <p className="text-sm font-medium text-admin-foreground">
                {t("gallery.dropzoneTitle")}
              </p>
              <p className="text-xs text-admin-muted mt-1">
                {t("gallery.dropzoneSubtitle")}
              </p>
            </div>

            {/* Upload Progress Bar */}
            {isUploadingBatch && (
              <div className="p-4 bg-admin-surface border border-admin-border rounded-none space-y-2">
                <div className="flex justify-between text-xs font-medium text-admin-foreground">
                  <span>{t("gallery.uploading")}</span>
                  <span className="font-mono">
                    {uploadProgress.current} / {uploadProgress.total} (
                    {Math.round((uploadProgress.current / (uploadProgress.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-admin-surface-muted h-2 rounded-none overflow-hidden border border-admin-border">
                  <div
                    className="bg-admin-primary h-full transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.current / (uploadProgress.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Queue List */}
            {batchItems.length > 0 && (
              <div className="bg-admin-surface border border-admin-border rounded-none divide-y divide-admin-border">
                <div className="p-3 bg-admin-surface-muted flex items-center justify-between">
                  <span className="text-xs font-medium text-admin-foreground">
                    {t("gallery.queueTitle", { count: batchItems.length })}
                  </span>
                  {!isUploadingBatch && (
                    <button
                      type="button"
                      onClick={() => setBatchItems([])}
                      className="text-xs text-admin-danger hover:underline p-1"
                    >
                      {t("gallery.clearQueue")}
                    </button>
                  )}
                </div>

                <div className="max-h-[500px] overflow-y-auto divide-y divide-admin-border">
                  {batchItems.map((item, index) => {
                    const isDragging = draggedQueueIndex === index;
                    const isDragOver = dragOverQueueIndex === index && draggedQueueIndex !== index;

                    return (
                      <div
                        key={item.id}
                        draggable={!isUploadingBatch}
                        onDragStart={(e) => handleQueueDragStart(e, index)}
                        onDragOver={(e) => handleQueueDragOver(e, index)}
                        onDrop={(e) => handleQueueDrop(e, index)}
                        onDragEnd={handleQueueDragEnd}
                        className={cn(
                          "p-3 flex items-center gap-3 transition-all duration-150",
                          isDragging && "opacity-40 bg-admin-surface-muted border-dashed",
                          isDragOver && "bg-admin-surface-muted ring-2 ring-admin-focus",
                          !isDragging && !isDragOver && "hover:bg-admin-surface-muted/30",
                        )}
                      >
                        {/* Drag Handle */}
                        {!isUploadingBatch && (
                          <div
                            className="cursor-grab active:cursor-grabbing text-admin-muted hover:text-admin-foreground p-1 shrink-0"
                            title={t("gallery.dragToReorder")}
                          >
                            <GripVertical size={16} />
                          </div>
                        )}

                        <span className="text-xs font-mono text-admin-muted w-6 text-center shrink-0">
                          #{index + 1}
                        </span>
                        <img
                          src={item.previewUrl}
                          alt=""
                          className="h-12 w-16 object-cover rounded-none border border-admin-border shrink-0 bg-admin-surface-muted select-none"
                          draggable={false}
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.captionTh}
                            disabled={isUploadingBatch}
                            onChange={(e) => handleBatchCaptionChange(item.id, e.target.value)}
                            placeholder={t("gallery.captionPlaceholder")}
                            className="w-full text-xs px-2.5 py-1.5 rounded-none border border-admin-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                          />
                          <p className="text-[11px] text-admin-muted mt-1 truncate">
                            {item.file.name} ({(item.file.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0">
                          {item.status === "uploading" && (
                            <div className="w-5 h-5 border-2 border-admin-focus border-t-transparent rounded-full animate-spin" />
                          )}
                          {item.status === "success" && (
                            <CheckCircle size={18} className="text-admin-success" />
                          )}
                          {item.status === "error" && (
                            <span title={item.errorMessage}>
                              <AlertCircle size={18} className="text-admin-danger" />
                            </span>
                          )}
                          {item.status === "idle" && !isUploadingBatch && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchItem(item.id)}
                              className="p-1 text-admin-muted hover:text-admin-danger transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title={t("gallery.removeFromQueue")}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Global Settings */}
          <div className="bg-admin-surface border border-admin-border p-6 space-y-4 rounded-none h-fit">
            <h3 className="text-sm font-semibold text-admin-foreground border-b border-admin-border pb-3">
              {t("gallery.globalSettingsTitle")}
            </h3>

            <Select
              id="batch-category"
              label={t("gallery.category")}
              options={categoryOptions}
              value={batchCategoryId}
              onChange={(e) => setBatchCategoryId(e.target.value)}
            />

            <Select
              id="batch-event"
              label={t("gallery.relatedEvent")}
              options={eventOptions}
              value={batchEventId}
              onChange={(e) => setBatchEventId(e.target.value)}
            />

            <Switch
              id="batch-is-active"
              label={t("gallery.activeLabel")}
              checked={batchIsActive}
              onChange={(e) => setBatchIsActive(e.target.checked)}
            />

            <div className="pt-4 border-t border-admin-border">
              <Button
                type="button"
                className="w-full"
                isLoading={isUploadingBatch}
                disabled={batchItems.length === 0}
                onClick={handleBatchUploadSubmit}
              >
                {t("gallery.startUpload")} {batchItems.length > 0 ? `(${batchItems.length})` : ""}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Single Upload Form */
        <form
          onSubmit={handleSubmit(onSingleSubmit)}
          className="max-w-2xl bg-admin-surface rounded-none border border-admin-border p-6 space-y-4 mt-4"
        >
          <Controller
            control={control}
            name="image_url"
            render={({ field }) => (
              <div className="space-y-1">
                <ImageUpload
                  label={`${t("columns.image")} *`}
                  value={field.value}
                  onChange={field.onChange}
                />
                {errors.image_url?.message && (
                  <p className="text-sm text-admin-danger">
                    {errors.image_url.message}
                  </p>
                )}
              </div>
            )}
          />

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
                  errors.caption?.de?.message ||
                  (errors.caption as unknown as { message: string })?.message
                }
              />
            )}
          />

          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select
                id="single-category"
                label={t("gallery.category")}
                options={categoryOptions}
                value={field.value?.toString() || ""}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                error={errors.category_id?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="event_id"
            render={({ field }) => (
              <Select
                id="single-event"
                label={t("gallery.event")}
                options={eventOptions}
                value={field.value?.toString() || ""}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                error={errors.event_id?.message}
              />
            )}
          />

          <Input
            id="single-display-order"
            label={t("gallery.displayOrder")}
            type="number"
            {...register("display_order", { valueAsNumber: true })}
            error={errors.display_order?.message}
          />

          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Switch
                id="single-is-active"
                label={t("gallery.activeLabel")}
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" isLoading={isLoading}>
              {t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/gallery")}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
