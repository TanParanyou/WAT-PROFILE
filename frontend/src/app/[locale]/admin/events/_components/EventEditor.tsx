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
import { FileText, MapPin, ArrowLeft, ZoomIn, X as CloseIcon } from "lucide-react";
import { FormActionBar } from "@/components/admin/FormActionBar";
import { EventScheduleEditor } from "@/components/admin/events/EventScheduleEditor";
import { useAppOptions } from "@/hooks/useAppOptions";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { format, parse } from "date-fns";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { hasLegacyLocalizedRichText, normalizeLocalizedRichText } from "@/lib/rich-text/document";
import { richTextMigrationService } from "@/services/richTextMigrationService";
import { getFieldError } from "@/utils/form-errors";
import { generateDefaultSlug } from "@/utils/slug";
import { emptyLang, TIMEZONE } from "@/constants";
import {
  EventCardPreview,
  GoogleSearchPreview,
  MapEmbedPreview,
  MobilePreviewDrawer,
  LiveStreamEmbedPreview,
} from "@/components/admin/preview";
import { PublicLightboxModal, type LightboxSlide } from "@/components/public/modal";
import { toPlainText } from "@/features/public/shared/rich-text";
import { useDateFormat } from "@/hooks/useDateFormat";

interface EventEditorProps {
  id?: string;
}

export function EventEditor({ id }: EventEditorProps) {
  const isEditMode = !!id;
  const t = useTranslations("Admin");
  const router = useRouter();
  const { formatDateRange, formatTimeRange } = useDateFormat();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { getEventTypeOptions } = useAppOptions();
  const eventTypeOptions = getEventTypeOptions();

  const methods = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: { ...emptyLang },
      description: { ...emptyLang },
      location: { ...emptyLang },
      slug: isEditMode ? "" : generateDefaultSlug("evt"),
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      event_type: "ceremony",
      image_url: "",
      gallery_urls: [],
      map_url: "",
      online_join_url: "",
      dress_code: { ...emptyLang },
      what_to_bring: { ...emptyLang },
      donation_enabled: false,
      contact_phone: "",
      contact_line: "",
      contact_email: "",
      transport_info: { ...emptyLang },
      is_active: true,
      registration_enabled: false,
      registration_deadline: "",
      max_participants: undefined,
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
        const normalizedDescription = normalizeLocalizedRichText(event.description);

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
          gallery_urls: event.gallery_urls || [],
          map_url: event.map_url || "",
          online_join_url: event.online_join_url || "",
          dress_code: event.dress_code || { ...emptyLang },
          what_to_bring: event.what_to_bring || { ...emptyLang },
          donation_enabled: event.donation_enabled || false,
          contact_phone: event.contact_phone || "",
          contact_line: event.contact_line || "",
          contact_email: event.contact_email || "",
          transport_info: event.transport_info || { ...emptyLang },
          is_active: event.is_active,
          registration_enabled: event.registration_enabled,
          registration_deadline: event.registration_deadline
            ? formatInTimeZone(event.registration_deadline, TIMEZONE, "yyyy-MM-dd")
            : "",
          max_participants: event.max_participants ?? undefined,
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

      const registrationDeadlineISO = data.registration_deadline
        ? fromZonedTime(`${data.registration_deadline}T23:59:59`, TIMEZONE).toISOString()
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
        registration_deadline: registrationDeadlineISO,
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
                        value={normalizeLocalizedRichText(field.value)}
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
                        {field.value && typeof field.value === "string" && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setLightboxIndex(0)}
                              className="text-xs text-admin-action hover:underline font-medium inline-flex items-center gap-1.5"
                            >
                              <ZoomIn size={14} aria-hidden="true" />
                              {t("events.form.previewLightbox")}
                            </button>
                          </div>
                        )}
                        {getFieldError(errors.image_url) && (
                          <p className="text-sm text-admin-danger">
                            {getFieldError(errors.image_url)}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  {/* Additional Gallery Images */}
                  <div className="space-y-3 pt-2 border-t border-admin-border">
                    <div>
                      <h3 className="text-sm font-medium text-admin-body">
                        {t("events.form.gallery")}
                      </h3>
                      <p className="text-xs text-admin-muted">
                        {t("events.form.galleryDesc")}
                      </p>
                    </div>

                    <Controller
                      control={control}
                      name="gallery_urls"
                      render={({ field }) => {
                        const urls = Array.isArray(field.value) ? field.value : [];
                        const coverUrl = methods.watch("image_url");
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {urls.map((url, idx) => {
                                const slideIdx = (typeof coverUrl === "string" && coverUrl) ? idx + 1 : idx;
                                return (
                                  <div
                                    key={idx}
                                    className="relative group border border-admin-border bg-admin-surface-muted aspect-video overflow-hidden cursor-pointer"
                                    onClick={() => setLightboxIndex(slideIdx)}
                                    title={t("events.form.previewLightbox")}
                                  >
                                    <img
                                      src={url}
                                      alt={`Gallery image ${idx + 1}`}
                                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                      <span className="text-white p-1.5 bg-black/60 border border-white/20 inline-flex items-center justify-center">
                                        <ZoomIn size={14} aria-hidden="true" />
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const next = urls.filter((_, i) => i !== idx);
                                        field.onChange(next);
                                      }}
                                      title={t("events.form.removeImage")}
                                      className="absolute top-1 right-1 z-10 bg-admin-danger text-white p-1 opacity-90 hover:opacity-100 transition-opacity shadow inline-flex items-center justify-center"
                                    >
                                      <CloseIcon size={12} aria-hidden="true" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            {urls.length < 10 && (
                              <MediaImagePicker
                                label={t("events.form.addGalleryImage")}
                                value=""
                                onChange={(newUrl) => {
                                  if (typeof newUrl === "string" && newUrl) {
                                    field.onChange([...urls, newUrl]);
                                  }
                                }}
                              />
                            )}
                          </div>
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Details, Location & Transport */}
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

                  <Controller
                    control={control}
                    name="transport_info"
                    render={({ field }) => (
                      <MultiLangInput
                        label={t("events.form.transportInfo")}
                        value={
                          (field.value || {
                            th: "",
                            en: "",
                            de: "",
                          }) as MultiLangText
                        }
                        onChange={field.onChange}
                        error={getFieldError(errors.transport_info)}
                        type="textarea"
                      />
                    )}
                  />

                  {/* Online Live Stream URL */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="online_join_url" className="text-sm font-medium text-admin-body block mb-1">
                        {t("events.form.onlineJoinUrl")}
                      </label>
                      <Input
                        id="online_join_url"
                        placeholder={t("events.form.onlineJoinUrlPlaceholder")}
                        {...register("online_join_url")}
                        error={errors.online_join_url?.message}
                      />
                    </div>

                    {/* Live Stream URL Preview */}
                    {watch("online_join_url") && (
                      <LiveStreamEmbedPreview streamUrl={watch("online_join_url")} />
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Registration & Guidelines */}
              <div className="bg-admin-surface rounded-none border border-admin-border p-6 space-y-4">
                <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2 border-b border-admin-border pb-3">
                  <FileText size={18} className="text-admin-action" />
                  {t("events.form.registrationSettings")}
                </h2>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-6 pt-2">
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
                    <Controller
                      control={control}
                      name="donation_enabled"
                      render={({ field }) => (
                        <Switch
                          id="donation_enabled"
                          label={t("events.form.donationEnabled")}
                          checked={field.value ?? false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                  </div>

                  {watch("registration_enabled") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-admin-border bg-admin-surface-muted">
                      <div>
                        <label htmlFor="registration_deadline" className="text-sm font-medium text-admin-body block mb-1">
                          {t("events.form.registrationDeadline")}
                        </label>
                        <Input
                          id="registration_deadline"
                          type="date"
                          {...register("registration_deadline")}
                          error={errors.registration_deadline?.message}
                        />
                      </div>
                      <div>
                        <label htmlFor="max_participants" className="text-sm font-medium text-admin-body block mb-1">
                          {t("events.form.maxParticipants")}
                        </label>
                        <Input
                          id="max_participants"
                          type="number"
                          min={1}
                          placeholder="e.g. 80"
                          {...register("max_participants")}
                          error={errors.max_participants?.message}
                        />
                      </div>
                    </div>
                  )}

                  {/* Dress Code & What to bring */}
                  <div className="pt-2 border-t border-admin-border space-y-4">
                    <Controller
                      control={control}
                      name="dress_code"
                      render={({ field }) => (
                        <MultiLangInput
                          label={t("events.form.dressCode")}
                          value={
                            (field.value || {
                              th: "",
                              en: "",
                              de: "",
                            }) as MultiLangText
                          }
                          onChange={field.onChange}
                          error={getFieldError(errors.dress_code)}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="what_to_bring"
                      render={({ field }) => (
                        <MultiLangInput
                          label={t("events.form.whatToBring")}
                          value={
                            (field.value || {
                              th: "",
                              en: "",
                              de: "",
                            }) as MultiLangText
                          }
                          onChange={field.onChange}
                          error={getFieldError(errors.what_to_bring)}
                        />
                      )}
                    />
                  </div>

                  {/* Event Specific Contact */}
                  <div className="pt-2 border-t border-admin-border space-y-3">
                    <h3 className="text-sm font-medium text-admin-body">
                      {t("events.form.contactInfo")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="contact_phone" className="text-xs font-medium text-admin-muted block mb-1">
                          {t("events.form.contactPhone")}
                        </label>
                        <Input
                          id="contact_phone"
                          placeholder="+49 (0) 30 ..."
                          {...register("contact_phone")}
                        />
                      </div>
                      <div>
                        <label htmlFor="contact_line" className="text-xs font-medium text-admin-muted block mb-1">
                          {t("events.form.contactLine")}
                        </label>
                        <Input
                          id="contact_line"
                          placeholder="@watloungporsai"
                          {...register("contact_line")}
                        />
                      </div>
                      <div>
                        <label htmlFor="contact_email" className="text-xs font-medium text-admin-muted block mb-1">
                          {t("events.form.contactEmail")}
                        </label>
                        <Input
                          id="contact_email"
                          placeholder="event@watloungporsai.de"
                          {...register("contact_email")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Schedule */}
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
        <FormActionBar
          isDirty={isDirty}
          isLoading={isLoading}
          isEditMode={isEditMode}
          onCancel={() => router.push("/admin/events")}
        />

        {/* Central Lightbox Modal with Carousel and Details for Admin Image Preview */}
        {(() => {
          const cover = watch("image_url");
          const gallery = (watch("gallery_urls") || []) as string[];
          const titleVal = watch("title");
          const title = (typeof titleVal === "string"
            ? titleVal
            : titleVal?.th || titleVal?.en || titleVal?.de || t("events.form.image")) as string;
          const descRaw = watch("description");
          const desc = descRaw
            ? typeof descRaw === "string"
              ? descRaw
              : toPlainText(descRaw?.th) ||
                toPlainText(descRaw?.en) ||
                toPlainText(descRaw?.de) ||
                ""
            : "";
          const locationVal = watch("location");
          const location =
            typeof locationVal === "string"
              ? locationVal
              : locationVal?.th || locationVal?.en || locationVal?.de || "";
          const dressCodeVal = watch("dress_code");
          const dressCode =
            typeof dressCodeVal === "string"
              ? dressCodeVal
              : dressCodeVal?.th || dressCodeVal?.en || dressCodeVal?.de || "";
          const whatToBringVal = watch("what_to_bring");
          const whatToBring =
            typeof whatToBringVal === "string"
              ? whatToBringVal
              : whatToBringVal?.th ||
                whatToBringVal?.en ||
                whatToBringVal?.de ||
                "";

          const eventTypeVal = watch("event_type");
          const categoryTranslated = eventTypeVal
            ? t.has(`events.types.${eventTypeVal}`)
              ? t(`events.types.${eventTypeVal}`)
              : eventTypeVal
            : undefined;

          const eventMeta = {
            date: watch("start_date") ? formatDateRange(watch("start_date"), watch("end_date")) : undefined,
            time: formatTimeRange(watch("start_time"), watch("end_time")) || undefined,
            location: location || undefined,
            category: categoryTranslated,
            dressCode: dressCode || undefined,
            whatToBring: whatToBring || undefined,
          };

          const slides: LightboxSlide[] = [];

          if (typeof cover === "string" && cover) {
            slides.push({
              src: cover,
              alt: title,
              title: `${title} (${t("events.form.image")})`,
              description: desc || undefined,
              meta: eventMeta,
            });
          }

          gallery.forEach((url, i) => {
            slides.push({
              src: url,
              alt: `${title} ${i + 1}`,
              title: `${title} - ${t("events.form.gallery")} (${i + 1}/${gallery.length})`,
              description: desc || undefined,
              meta: eventMeta,
            });
          });

          return (
            <PublicLightboxModal
              open={lightboxIndex !== null}
              onClose={() => setLightboxIndex(null)}
              slides={slides}
              initialIndex={lightboxIndex ?? 0}
              closeLabel={t("common.close") || "Close"}
              prevLabel={t("common.previous") || "Previous"}
              nextLabel={t("common.next") || "Next"}
            />
          );
        })()}
      </form>
    </FormProvider>
  );
}
