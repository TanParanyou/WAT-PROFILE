"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { MediaImagePicker } from "@/components/admin/media/MediaImagePicker";
import { Input } from "@/components/ui/Input";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { eventAdminService } from "@/services/adminService";
import api from "@/services/adminApi";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import type { MultiLangText } from "@/types/api";
import { useTranslations } from "next-intl";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventFormData } from "@/schemas/event.schema";
import { FileText, MapPin, Save, ArrowLeft } from "lucide-react";
import { EventScheduleEditor } from "@/components/admin/events/EventScheduleEditor";
import { useAppOptions } from "@/hooks/useAppOptions";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { format, parse } from "date-fns";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { hasLegacyLocalizedRichText, normalizeLocalizedRichText } from "@/lib/rich-text/document";
import { richTextMigrationService } from "@/services/richTextMigrationService";
import {
  EventCardPreview,
  GoogleSearchPreview,
  MapEmbedPreview,
  MobilePreviewDrawer,
} from "@/components/admin/preview";

const emptyLang: MultiLangText = { th: "", en: "", de: "" };
const richTextLocales = ["th", "en", "de"] as const;
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
    watch,
    formState: { errors, isDirty },
  } = methods;

  // Fetch initial data if editing
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const event = await eventAdminService.getById(id);
        const normalizedDescription = normalizeLocalizedRichText(
          event.description,
          [...richTextLocales],
          "th",
        );

        reset({
          title: event.title || { ...emptyLang },
          description: normalizedDescription,
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

        if (hasLegacyLocalizedRichText(event.description)) {
          void richTextMigrationService.migrate({
            resource: "event",
            id: String(event.id),
            updated_at: event.updated_at,
            field: "description",
            value: normalizedDescription,
          }).catch(() => undefined);
        }
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
        savedEventId = String(res.id);
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
          <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-admin-muted mb-1">
                <button
                  type="button"
                  onClick={() => router.push("/admin/events")}
                  className="hover:text-admin-foreground flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-admin-focus rounded"
                >
                  <ArrowLeft size={14} />
                  {t("events.backToList")}
                </button>
              </div>
              <h1 className="text-xl font-semibold text-admin-foreground">
                {isEditMode ? t("events.edit") : t("events.create")}
              </h1>
              <p className="text-sm text-admin-muted">
                {isEditMode ? t("events.editDesc") : t("events.createDesc")}
              </p>
            </div>

          <MobilePreviewDrawer>
            <EventCardPreview
              title={watch("title")}
              location={watch("location")}
              startDate={watch("start_date")}
              endDate={watch("end_date")}
              startTime={watch("start_time")}
              endTime={watch("end_time")}
              eventType={watch("event_type")}
              imageUrl={watch("image_url")}
              registrationEnabled={watch("registration_enabled")}
              schedule={watch("schedule")}
            />

            <GoogleSearchPreview
              seoTitle={watch("title")}
              pageTitle={watch("title")}
              canonicalUrl={`/events/${watch("slug") || "event-name"}`}
              ogImage={typeof watch("image_url") === "string" ? watch("image_url") : ""}
            />
          </MobilePreviewDrawer>
          </div>

          {/* Form Error Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 border border-admin-danger/30 bg-admin-danger-surface text-admin-danger text-xs rounded-none">
              {t("events.formError")}
            </div>
          )}

          {/* Form Content Sections in Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Controls & Schedule */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: General Info */}
              <div className="bg-admin-surface rounded-none border border-admin-border p-6 space-y-4">
                <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2 border-b border-admin-border pb-3">
                  <FileText size={18} className="text-admin-action" />
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
                      <label htmlFor="slug" className="text-sm font-medium text-admin-body flex items-center">
                        {t("events.form.slug")}
                        <span className="text-admin-danger ml-1">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSlug}
                        className="text-xs text-admin-action hover:text-admin-action-hover font-semibold focus-visible:outline-2 focus-visible:outline-admin-focus rounded transition-colors"
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
                        value={normalizeLocalizedRichText(field.value, [...richTextLocales], "th")}
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
                        <MediaImagePicker
                          label={t("events.form.image")}
                          value={(field.value as string) || ""}
                          onChange={field.onChange}
                        />
                        {getFieldError(errors.image_url) && (
                          <p className="text-sm text-admin-danger">
                            {getFieldError(errors.image_url)}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Section 2: Details & Settings */}
              <div className="bg-admin-surface rounded-none border border-admin-border p-6 space-y-4">
                <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2 border-b border-admin-border pb-3">
                  <MapPin size={18} className="text-admin-action" />
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
                  
                  {/* Map Embed Live Preview */}
                  {watch("map_url") && (
                    <MapEmbedPreview embedUrl={watch("map_url")} />
                  )}

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
              <div className="bg-admin-surface rounded-none border border-admin-border p-6 space-y-4">
                <EventScheduleEditor />
              </div>
            </div>

            {/* Right Column: Sticky Live Previews Panel */}
            <div className="hidden lg:block lg:col-span-5 sticky top-6 self-start space-y-6">
              <EventCardPreview
                title={watch("title")}
                location={watch("location")}
                startDate={watch("start_date")}
                endDate={watch("end_date")}
                startTime={watch("start_time")}
                endTime={watch("end_time")}
                eventType={watch("event_type")}
                imageUrl={watch("image_url")}
                registrationEnabled={watch("registration_enabled")}
                schedule={watch("schedule")}
              />

              <GoogleSearchPreview
                seoTitle={watch("title")}
                pageTitle={watch("title")}
                canonicalUrl={`/events/${watch("slug") || "event-name"}`}
                ogImage={typeof watch("image_url") === "string" ? watch("image_url") : ""}
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-admin-border bg-admin-surface/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-admin-warning">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-admin-warning/75 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-admin-warning"></span>
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
              className="w-full sm:w-auto"
            >
              {isEditMode ? t("common.saveChanges") : t("common.save")}
            </Button>
          </div>
        </div>


      </form>
    </FormProvider>
  );
}
