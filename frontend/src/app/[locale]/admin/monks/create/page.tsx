"use client";

import React, { useState } from "react";
import { useRouter } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/MultiLangRichText";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { monkAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { monkSchema, type MonkFormData } from "@/schemas/monk.schema";

const positionOptions = [
  { value: "abbot", label: "เจ้าอาวาส" },
  { value: "vice_abbot", label: "รองเจ้าอาวาส" },
  { value: "monk", label: "พระภิกษุ" },
];

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

export default function CreateMonkPage() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MonkFormData>({
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

  const onSubmit = async (data: MonkFormData) => {
    setIsLoading(true);
    try {
      await monkAdminService.create(data as unknown as Record<string, unknown>);
      toast.success(t("common.success"));
      router.push("/admin/monks");
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="เพิ่มพระสงฆ์"
        breadcrumbs={[
          { label: "พระสงฆ์", href: "/admin/monks" },
          { label: "เพิ่มใหม่" },
        ]}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <MultiLangInput
              label="ชื่อ *"
              value={field.value as MultiLangText}
              onChange={field.onChange}
              error={
                errors.name?.th?.message ||
                errors.name?.en?.message ||
                errors.name?.de?.message ||
                (errors.name as unknown as { message: string })?.message
              }
            />
          )}
        />
        <Input
          id="slug"
          label="Slug *"
          {...register("slug")}
          error={errors.slug?.message}
        />
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <MultiLangInput
              label="ตำแหน่ง/ยศ"
              value={(field.value || { ...emptyLang }) as MultiLangText}
              onChange={field.onChange}
              error={
                errors.title?.th?.message ||
                errors.title?.en?.message ||
                errors.title?.de?.message ||
                (errors.title as unknown as { message: string })?.message
              }
            />
          )}
        />
        <Controller
          control={control}
          name="bio"
          render={({ field }) => (
            <MultiLangRichText
              label="ประวัติ"
              value={(field.value || { ...emptyLang }) as MultiLangText}
              onChange={field.onChange}
              error={
                errors.bio?.th?.message ||
                errors.bio?.en?.message ||
                errors.bio?.de?.message ||
                (errors.bio as unknown as { message: string })?.message
              }
            />
          )}
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
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <div className="space-y-1">
              <ImageUpload
                label="รูปภาพหน้าปก"
                value={field.value || ""}
                onChange={field.onChange}
              />
              {errors.image_url?.message && (
                <p className="text-sm text-red-500">
                  {errors.image_url.message}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Checkbox
              id="is_active"
              label="เปิดใช้งาน"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/monks")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
