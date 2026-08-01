"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import api from "@/services/api";
import {
  galleryAdminService,
  galleryCategoryAdminService,
} from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { ApiResponse, MultiLangText } from "@/types/api";
import type { GalleryCategory } from "@/types/entities";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gallerySchema, type GalleryFormData } from "@/schemas/gallery.schema";

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

export default function GalleryUploadPage() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);

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
      display_order: 0,
      is_active: true,
    },
  });

  // โหลดหมวดหมู่
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await galleryCategoryAdminService.getAll();
        setCategories(result.data.filter((c) => c.is_active));
      } catch (err: unknown) {
        handleApiError(err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: GalleryFormData) => {
    if (!data.image_url) {
      toast.error("กรุณาเลือกรูปภาพ");
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
        display_order: data.display_order,
        is_active: data.is_active,
      });
      toast.success("อัปโหลดรูปภาพสำเร็จ");
      router.push("/admin/gallery");
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCategories) {
    return <PageLoading text="กำลังโหลดข้อมูล..." />;
  }

  const categoryOptions = [
    { value: "", label: "ไม่ระบุหมวดหมู่" },
    ...categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.name.th || cat.name.en || cat.slug,
    })),
  ];

  return (
    <div>
      <AdminPageHeader
        title="อัปโหลดรูปภาพ"
        breadcrumbs={[
          { label: "คลังภาพ", href: "/admin/gallery" },
          { label: "อัปโหลด" },
        ]}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl bg-admin-surface rounded-xl border border-admin-border p-6 space-y-4"
      >
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <div className="space-y-1">
              <ImageUpload
                label="รูปภาพ *"
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
              label="คำอธิบาย"
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
              id="category"
              label="หมวดหมู่"
              options={categoryOptions}
              value={field.value?.toString() || ""}
              onChange={(e) =>
                field.onChange(e.target.value ? parseInt(e.target.value) : null)
              }
              error={errors.category_id?.message}
            />
          )}
        />
        <Input
          id="display_order"
          label="ลำดับการแสดง"
          type="number"
          {...register("display_order", { valueAsNumber: true })}
          error={errors.display_order?.message}
        />
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch
              label="เปิดใช้งาน"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <div className="flex gap-3 pt-4 border-t border-admin-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/gallery")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            บันทึก
          </Button>
        </div>
      </form>
    </div>
  );
}
