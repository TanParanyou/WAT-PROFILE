"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
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
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { format, parse } from "date-fns";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };
const TIMEZONE = "Europe/Berlin";

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
  const { getEventTypeOptions } = useAppOptions();
  const eventTypeOptions = getEventTypeOptions();

  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: { ...emptyLang },
      description: { ...emptyLang },
      location: { ...emptyLang },
      slug: "",
      start_date: "",
      end_date: "",
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
    setValue,
    getValues,
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
          start_date: event.start_date
            ? formatInTimeZone(event.start_date, TIMEZONE, "yyyy-MM-dd")
            : "",
          end_date: event.end_date
            ? formatInTimeZone(event.end_date, TIMEZONE, "yyyy-MM-dd")
            : "",
          start_time: event.start_time
            ? formatInTimeZone(event.start_time, TIMEZONE, "HH:mm")
            : "",
          end_time: event.end_time
            ? formatInTimeZone(event.end_time, TIMEZONE, "HH:mm")
            : "",
          event_type: event.event_type,
          image_url: event.image_url || "",
          map_url: event.map_url || "",
          is_active: event.is_active,
          registration_enabled: event.registration_enabled,
          schedule: (event.schedules || []).map((s) => ({
            start_time: s.start_time
              ? formatInTimeZone(s.start_time, TIMEZONE, "HH:mm")
              : "",
            end_time: s.end_time
              ? formatInTimeZone(s.end_time, TIMEZONE, "HH:mm")
              : "",
            activity: s.activity || { ...emptyLang },
          })),
        });
      } catch (err: unknown) {
        handleApiError(err);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id, reset, handleApiError]);

  const handleAutoGenerateSlug = () => {
    const title = getValues("title");
    if (!title) return;

    // Fallback: English -> Thai -> German
    const sourceText = title.en || title.th || title.de || "";
    if (!sourceText) return;

    const generatedSlug = sourceText
      .toLowerCase()
      .trim()
      .replace(/[\s_\/]+/g, "-") // Replace spaces, underscores, and slashes with hyphens
      .replace(/[^a-z0-9\u0e00-\u0e7f-]/g, "") // Keep English, Thai, numbers, and hyphens
      .replace(/-+/g, "-") // Collapse multiple hyphens
      .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens

    setValue("slug", generatedSlug, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      // Convert times to Europe/Berlin ISO format
      const startDateISO = data.start_date
        ? fromZonedTime(`${data.start_date}T00:00:00`, TIMEZONE).toISOString()
        : undefined;

      const endDateISO = data.end_date
        ? fromZonedTime(`${data.end_date}T00:00:00`, TIMEZONE).toISOString()
        : undefined;

      const startTimeISO =
        data.start_time && data.start_date
          ? fromZonedTime(
              `${data.start_date}T${data.start_time}:00`,
              TIMEZONE,
            ).toISOString()
          : undefined;

      const endTimeISO =
        data.end_time && data.start_date
          ? fromZonedTime(
              `${data.start_date}T${data.end_time}:00`,
              TIMEZONE,
            ).toISOString()
          : undefined;

      const scheduleISO = data.schedule?.map((s) => ({
        activity: s.activity,
        start_time:
          s.start_time && data.start_date
            ? fromZonedTime(
                `${data.start_date}T${s.start_time}:00`,
                TIMEZONE,
              ).toISOString()
            : undefined,
        end_time:
          s.end_time && data.start_date
            ? fromZonedTime(
                `${data.start_date}T${s.end_time}:00`,
                TIMEZONE,
              ).toISOString()
            : undefined,
      }));

      // Prepare payload WITHOUT the image if it's a File
      const payload: Record<string, unknown> = {
        ...data,
        start_date: startDateISO,
        end_date: endDateISO,
        start_time: startTimeISO,
        end_time: endTimeISO,
        schedules: scheduleISO,
      };

      delete payload.schedule;

      if (typeof data.image_url === "string") {
        payload.image_url = data.image_url;
      } else {
        delete payload.image_url;
      }

      let savedEventId = id;

      // 1. Create/Update the event first to validate the data
      if (isEditMode && id) {
        await eventAdminService.update(id, payload);
      } else {
        const res = await eventAdminService.create(payload);
        savedEventId = String((res as any).id);
      }

      // 2. If we have a new image file, upload it now
      if (data.image_url instanceof File && savedEventId) {
        const formData = new FormData();
        formData.append("file", data.image_url);

        const uploadRes = await api.post("/admin/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const finalImageUrl = uploadRes.data.data?.url || uploadRes.data.data;

        // 3. Update the event with the new image URL
        await eventAdminService.update(savedEventId, {
          ...payload,
          image_url: finalImageUrl,
        });
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

          {/* Form Error Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg">
              {t("events.formError")}
            </div>
          )}

          {/* Form Content Sections */}
          <div className="space-y-6">
            {/* Section 1: General Info */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileText size={18} className="text-amber-600" />
                {t("events.tabs.general")}
              </h2>
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
                      required={true}
                    />
                  )}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="slug" className="text-sm font-medium text-gray-700 flex items-center">
                      {t("events.form.slug")}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSlug}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold focus:outline-none transition-colors"
                    >
                      {t("events.form.autoGen")}
                    </button>
                  </div>
                  <Input
                    id="slug"
                    placeholder="event-slug-name"
                    {...register("slug")}
                    error={errors.slug?.message}
                  />
                </div>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <MultiLangRichText
                      label={t("events.form.description")}
                      locales={[
                        { code: "th", label: "TH" },
                        { code: "en", label: "EN" },
                        { code: "de", label: "DE" }
                      ]}
                      defaultLocale="th"
                      value={field.value || {}}
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
            </div>

            {/* Section 2: Details & Settings */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <MapPin size={18} className="text-amber-600" />
                {t("events.tabs.details")}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="start_date"
                    render={({ field }) => {
                      const startDateVal = methods.watch("start_date");
                      const endDateVal = methods.watch("end_date");

                      const from = startDateVal
                        ? parse(startDateVal, "yyyy-MM-dd", new Date())
                        : undefined;
                      const to = endDateVal
                        ? parse(endDateVal, "yyyy-MM-dd", new Date())
                        : undefined;

                      return (
                        <DateRangePicker
                          label={t("events.form.date")}
                          value={{ from, to }}
                          onChange={(range) => {
                            methods.setValue(
                              "start_date",
                              range.from
                                ? format(range.from, "yyyy-MM-dd")
                                : "",
                              { shouldDirty: true },
                            );
                            methods.setValue(
                              "end_date",
                              range.to ? format(range.to, "yyyy-MM-dd") : "",
                              { shouldDirty: true },
                            );
                          }}
                          error={
                            errors.start_date?.message ||
                            errors.end_date?.message
                          }
                          required={true}
                        />
                      );
                    }}
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
                        required={true}
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="start_time"
                    render={({ field }) => (
                      <TimePicker
                        id="start_time"
                        label={t("events.form.start")}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.start_time?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="end_time"
                    render={({ field }) => (
                      <TimePicker
                        id="end_time"
                        label={t("events.form.end")}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.end_time?.message}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name="location"
                  render={({ field }) => (
                    <MultiLangInput
                      label={t("events.form.location")}
                      value={
                        (field.value || {
                          th: "",
                          en: "",
                          de: "",
                        }) as MultiLangText
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
                      <Switch
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
                      <Switch
                        id="registration_enabled"
                        label={t("form.enableRegistration")}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Schedule */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <EventScheduleEditor />
            </div>
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
