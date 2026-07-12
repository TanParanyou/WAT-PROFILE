"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/MultiLangRichText";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { eventAdminService } from "@/services/adminService";
import api from "@/services/api";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventFormData } from "@/schemas/event.schema";
import { FileText, MapPin, Clock, Save, ArrowLeft } from "lucide-react";
import { EventScheduleEditor } from "@/components/admin/events/EventScheduleEditor";
import { useAppOptions } from "@/hooks/useAppOptions";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

// Safe helper to extract error message without using 'any'
const getFieldError = (fieldError: unknown): string | undefined => {
  if (!fieldError) return undefined;
  if (typeof fieldError === "object") {
    const err = fieldError as Record<string, unknown>;
    if (typeof err.message === "string") return err.message;
    
    // Check nested multi-lang fields
    const th = err.th as Record<string, unknown> | undefined;
    const en = err.en as Record<string, unknown> | undefined;
    const de = err.de as Record<string, unknown> | undefined;
    
    if (th && typeof th.message === "string") return th.message;
    if (en && typeof en.message === "string") return en.message;
    if (de && typeof de.message === "string") return de.message;
  }
  return undefined;
};

interface EventEditorProps {
  id?: string;
}

export function EventEditor({ id }: EventEditorProps) {
  const isEditMode = !!id;
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [activeTab, setActiveTab] = useState<"general" | "details" | "schedule">("general");

  const { getEventTypeOptions } = useAppOptions();
  const eventTypeOptions = getEventTypeOptions();

  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: { ...emptyLang },
      description: { ...emptyLang },
      location: { ...emptyLang },
      slug: "",
      event_date: "",
      start_time: "",
      end_time: "",
      event_type: "ceremony",
      image_url: "",
      map_url: "",
      is_active: true,
      registration_enabled: false,
      schedule: [],
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
        const event = await eventAdminService.getById(id);
        reset({
          title: event.title || { ...emptyLang },
          description: event.description || { ...emptyLang },
          location: event.location || { ...emptyLang },
          slug: event.slug,
          event_date: event.event_date?.split("T")[0] || "",
          start_time: event.start_time || "",
          end_time: event.end_time || "",
          event_type: event.event_type,
          image_url: event.image_url || "",
          map_url: event.map_url || "",
          is_active: event.is_active,
          registration_enabled: event.registration_enabled,
          schedule: (event as { schedule?: EventFormData["schedule"] }).schedule || [],
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
      let finalImageUrl = data.image_url;

      // If image_url is a newly selected File object, upload it first
      if (data.image_url instanceof File) {
        const formData = new FormData();
        formData.append("file", data.image_url);

        const uploadRes = await api.post("/admin/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Extract URL from upload response
        finalImageUrl = uploadRes.data.data?.url || uploadRes.data.data;
      }

      // Prepare final payload
      const payload = {
        ...data,
        image_url: finalImageUrl,
      };

      if (isEditMode && id) {
        await eventAdminService.update(
          id,
          payload as unknown as Record<string, unknown>,
        );
      } else {
        await eventAdminService.create(
          payload as unknown as Record<string, unknown>,
        );
      }
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
                  onClick={() => router.push("/admin/events")}
                  className="hover:text-zinc-950 flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  {t("events.backToList")}
                </button>
              </div>
              <h1 className="text-xl font-semibold text-zinc-950">
                {isEditMode ? t("events.edit") : t("events.create")}
              </h1>
              <p className="text-sm text-zinc-500">
                {isEditMode ? t("events.editDesc") : t("events.createDesc")}
              </p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-2 border-b border-zinc-200 pb-3">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "general" ? "primary" : "outline"}
              icon={<FileText size={14} />}
              onClick={() => setActiveTab("general")}
            >
              {t("events.tabs.general")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "details" ? "primary" : "outline"}
              icon={<MapPin size={14} />}
              onClick={() => setActiveTab("details")}
            >
              {t("events.tabs.details")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "schedule" ? "primary" : "outline"}
              icon={<Clock size={14} />}
              onClick={() => setActiveTab("schedule")}
            >
              {t("events.tabs.schedule")} ({methods.watch("schedule")?.length || 0})
            </Button>
          </div>

          {/* Form Error Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg">
              {t("events.formError")}
            </div>
          )}

          {/* Form Content Tabs */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            {activeTab === "general" && (
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <MultiLangInput
                      label={t("events.form.title")}
                      value={field.value as MultiLangText}
                      onChange={field.onChange}
                      error={getFieldError(errors.title)}
                    />
                  )}
                />
                <Input
                  id="slug"
                  label={t("events.form.slug")}
                  placeholder="event-slug-name"
                  {...register("slug")}
                  error={errors.slug?.message}
                />
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <MultiLangRichText
                      label={t("events.form.description")}
                      value={
                        (field.value || { th: "", en: "", de: "" }) as MultiLangText
                      }
                      onChange={field.onChange}
                      error={getFieldError(errors.description)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="image_url"
                  render={({ field }) => (
                    <div className="space-y-1">
                      <ImageUpload
                        label={t("events.form.image")}
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
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="event_date"
                    label={t("events.form.date")}
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
                        label={t("events.form.type")}
                        options={eventTypeOptions}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        error={errors.event_type?.message}
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="start_time"
                    label={t("events.form.start")}
                    type="time"
                    {...register("start_time")}
                    error={errors.start_time?.message}
                  />
                  <Input
                    id="end_time"
                    label={t("events.form.end")}
                    type="time"
                    {...register("end_time")}
                    error={errors.end_time?.message}
                  />
                </div>
                <Controller
                  control={control}
                  name="location"
                  render={({ field }) => (
                    <MultiLangInput
                      label={t("events.form.location")}
                      value={
                        (field.value || { th: "", en: "", de: "" }) as MultiLangText
                      }
                      onChange={field.onChange}
                      error={getFieldError(errors.location)}
                    />
                  )}
                />
                <Input
                  id="map_url"
                  label={t("events.form.map")}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  {...register("map_url")}
                  error={errors.map_url?.message}
                />
                <div className="flex gap-6 pt-4">
                  <Controller
                    control={control}
                    name="is_active"
                    render={({ field }) => (
                      <Checkbox
                        id="is_active"
                        label={t("form.active")}
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
                        label={t("form.enableRegistration")}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {activeTab === "schedule" && <EventScheduleEditor />}
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
                {t("website.unsavedEdits")}
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/events")}
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
