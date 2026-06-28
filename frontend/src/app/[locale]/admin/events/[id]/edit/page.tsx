"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/MultiLangRichText";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
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

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: { ...emptyLang },
      description: { ...emptyLang },
      location: { ...emptyLang },
      slug: "",
      event_date: "",
      event_type: "ceremony",
      image_url: "",
      is_active: true,
      registration_enabled: false,
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const event = await eventAdminService.getById(id);
        reset({
          title: event.title || { ...emptyLang },
          description: event.description || { ...emptyLang },
          location: event.location || { ...emptyLang },
          slug: event.slug,
          event_date: event.event_date?.split("T")[0] || "",
          event_type: event.event_type,
          image_url: event.image_url,
          is_active: event.is_active,
          registration_enabled: event.registration_enabled,
        });
      } catch (err: unknown) {
        handleApiError(err);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id, reset, handleApiError]);

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      await eventAdminService.update(
        id,
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

  if (isFetching) return <PageLoading />;

  return (
    <div>
      <AdminPageHeader
        title="แก้ไขกิจกรรม"
        breadcrumbs={[
          { label: "กิจกรรม", href: "/admin/events" },
          { label: "แก้ไข" },
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
          {...register("slug")}
          error={errors.slug?.message}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <MultiLangRichText
              label="รายละเอียด"
              value={(field.value || { ...emptyLang }) as MultiLangText}
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
              value={(field.value || { ...emptyLang }) as MultiLangText}
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
            อัปเดต
          </Button>
        </div>
      </form>
    </div>
  );
}
