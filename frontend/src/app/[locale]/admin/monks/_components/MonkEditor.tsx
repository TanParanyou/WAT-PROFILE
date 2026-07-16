"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/MultiLangRichText";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { monkAdminService } from "@/services/adminService";
import api from "@/services/api";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { monkSchema, type MonkFormData } from "@/schemas/monk.schema";
import { Save, ArrowLeft } from "lucide-react";
import { useAppOptions } from "@/hooks/useAppOptions";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

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
    formState: { errors, isDirty },
  } = methods;

  // Fetch initial data if editing
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const monk = await monkAdminService.getById(id);
        reset({
          name: monk.name || { ...emptyLang },
          title: monk.title || { ...emptyLang },
          bio: monk.bio || { ...emptyLang },
          slug: monk.slug,
          position: monk.position || "monk",
          image_url: monk.image_url || "",
          ordination_date: monk.ordination_date?.split("T")[0] || "",
          is_active: monk.is_active,
        });
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
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                <button
                  type="button"
                  onClick={() => router.push("/admin/monks")}
                  className="hover:text-zinc-950 flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  ย้อนกลับ
                </button>
              </div>
              <h1 className="text-xl font-semibold text-zinc-950">
                {isEditMode ? t("monks.edit") : t("monks.create")}
              </h1>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <MultiLangInput
                  label="ชื่อ *"
                  value={field.value as MultiLangText}
                  onChange={field.onChange}
                  error={getFieldError(errors.name)}
                />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="slug"
                label="Slug *"
                placeholder="monk-slug-name"
                {...register("slug")}
                error={errors.slug?.message}
              />
              <Controller
                control={control}
                name="position"
                render={({ field }) => (
                  <Select
                    id="position"
                    label="ตำแหน่ง"
                    options={positionOptions}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.position?.message}
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
                    label="วันที่อุปสมบท"
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
                    label="ตำแหน่ง/ยศ"
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
                  label="ประวัติ"
                  value={(field.value || { ...emptyLang }) as MultiLangText}
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
                    label="รูปภาพประจำตัว"
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                  {getFieldError(errors.image_url) && (
                    <p className="text-sm text-red-500">
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
                  label="เปิดใช้งานแสดงบนเว็บไซต์"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
                มีข้อมูลที่ยังไม่ได้เซฟ
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
              className="w-full sm:w-auto shadow-sm"
            >
              {isEditMode ? t("common.saveChanges") : t("common.save")}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
