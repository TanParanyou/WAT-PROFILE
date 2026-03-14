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
import { eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import { ToastContainer } from "@/components/admin/Toast";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventFormData } from "@/schemas/event.schema";

const eventTypeOptions = [
  { value: "ceremony", label: "พิธีกรรม" },
  { value: "meditation_course", label: "คอร์สปฏิบัติธรรม" },
  { value: "festival", label: "งานเทศกาล" },
  { value: "other", label: "อื่นๆ" },
];

export default function CreateEventPage() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: { th: "", en: "", de: "" },
      description: { th: "", en: "", de: "" },
      location: { th: "", en: "", de: "" },
      slug: "",
      event_date: "",
      event_type: "ceremony",
      image_url: "",
      is_active: true,
      registration_enabled: false,
    },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      // Cast data safely for the service call
      await eventAdminService.create(
        data as unknown as Record<string, unknown>,
      );
      toast.success(t("common.success"));
      router.push("/admin/events");
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="สร้างกิจกรรมใหม่"
        breadcrumbs={[
          { label: "กิจกรรม", href: "/admin/events" },
          { label: "สร้างใหม่" },
        ]}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <MultiLangInput
              label="ชื่อกิจกรรม *"
              value={field.value as MultiLangText}
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
        <Input
          id="slug"
          label="Slug *"
          placeholder="event-slug"
          {...register("slug")}
          error={errors.slug?.message}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <MultiLangRichText
              label="รายละเอียด"
              value={
                (field.value || { th: "", en: "", de: "" }) as MultiLangText
              }
              onChange={field.onChange}
              error={
                errors.description?.th?.message ||
                errors.description?.en?.message ||
                errors.description?.de?.message ||
                (errors.description as unknown as { message: string })?.message
              }
            />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="event_date"
            label="วันที่จัดงาน *"
            type="date"
            {...register("event_date")}
            error={errors.event_date?.message}
          />
          <Controller
            control={control}
            name="event_type"
            render={({ field }) => (
              <Select
                id="event_type"
                label="ประเภท *"
                options={eventTypeOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.event_type?.message}
              />
            )}
          />
        </div>
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <MultiLangInput
              label="สถานที่"
              value={
                (field.value || { th: "", en: "", de: "" }) as MultiLangText
              }
              onChange={field.onChange}
              error={
                errors.location?.th?.message ||
                errors.location?.en?.message ||
                errors.location?.de?.message ||
                (errors.location as unknown as { message: string })?.message
              }
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
        <div className="flex gap-6 mt-4">
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
          <Controller
            control={control}
            name="registration_enabled"
            render={({ field }) => (
              <Checkbox
                id="registration_enabled"
                label="เปิดลงทะเบียน"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/events")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t("common.save")}
          </Button>
        </div>
      </form>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
