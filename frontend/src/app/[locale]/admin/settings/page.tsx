"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormActionBar } from "@/components/admin/FormActionBar";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoading } from "@/components/ui/Loading";
import { settingsAdminService, eventAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Setting, Event } from "@/types/entities";
import {
  eventAlertSettingsSchema,
  fetchAdminEventAlertSettings,
  saveAdminEventAlertSettings,
  type EventAlertSettings,
} from "@/features/public/event-alert/api";
import { MediaUrlField } from "@/components/admin/website/MediaUrlField";
import type { EventsView } from "@/features/public/settings/types";

export default function SettingsPage() {
  const t = useTranslations("Admin");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<EventAlertSettings>({
    enabled: false,
    event_id: 0,
    delay_seconds: 2,
    dismiss_hours: 24,
  });
  const [initialAlert, setInitialAlert] = useState<EventAlertSettings>({
    enabled: false,
    event_id: 0,
    delay_seconds: 2,
    dismiss_hours: 24,
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [shell, setShell] = useState({
    logo_url: "",
    hero_bg_url: "",
    social_sidebar_position: "left",
    youtube_url: "",
  });
  const [initialShell, setInitialShell] = useState({
    logo_url: "",
    hero_bg_url: "",
    social_sidebar_position: "left",
    youtube_url: "",
  });
  const [eventsDefaultView, setEventsDefaultView] = useState<EventsView>("calendar");
  const [initialEventsDefaultView, setInitialEventsDefaultView] = useState<EventsView>("calendar");
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await settingsAdminService.getAll();
      setSettings(data);
      const byKey = Object.fromEntries(data.map((item) => [item.key, item.value]));
      const shellVal = {
        logo_url: byKey.logo_url ?? "",
        hero_bg_url: byKey.hero_bg_url ?? "",
        social_sidebar_position: byKey.social_sidebar_position === "right" ? "right" : "left",
        youtube_url: byKey.youtube_url ?? "",
      };
      setShell(shellVal);
      setInitialShell(shellVal);
      const defaultView: EventsView = byKey.events_default_view === "list" ? "list" : "calendar";
      setEventsDefaultView(defaultView);
      setInitialEventsDefaultView(defaultView);
      const [alertSettings, eventResult] = await Promise.all([
        fetchAdminEventAlertSettings(),
        eventAdminService.getAll({ is_active: "true" }),
      ]);
      setAlert(alertSettings);
      setInitialAlert(alertSettings);
      setEvents(eventResult.data);
    } catch {
      toast.error(t("settings.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key: string, value: string | boolean) => {
    setChanges((prev) => ({ ...prev, [key]: String(value) }));
  };

  const getValue = (setting: Setting) => changes[setting.key] ?? setting.value;

  const isAlertChanged = JSON.stringify(alert) !== JSON.stringify(initialAlert);
  const isShellChanged = JSON.stringify(shell) !== JSON.stringify(initialShell);
  const isEventsDefaultViewChanged = eventsDefaultView !== initialEventsDefaultView;
  const hasChanges =
    Object.keys(changes).length > 0 || isAlertChanged || isShellChanged || isEventsDefaultViewChanged;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (Object.keys(changes).length > 0) {
        await settingsAdminService.update(
          Object.entries(changes).map(([key, value]) => ({ key, value })),
        );
      }
      if (isAlertChanged) {
        await saveAdminEventAlertSettings(eventAlertSettingsSchema.parse(alert));
      }
      if (isShellChanged) {
        await settingsAdminService.update([
          { key: "logo_url", value: shell.logo_url },
          { key: "hero_bg_url", value: shell.hero_bg_url },
          { key: "social_sidebar_position", value: shell.social_sidebar_position },
          { key: "youtube_url", value: shell.youtube_url },
        ]);
      }
      if (isEventsDefaultViewChanged) {
        await settingsAdminService.update([
          { key: "events_default_view", value: eventsDefaultView },
        ]);
      }
      toast.success(t("common.success"));
      setChanges({});
      await loadSettings();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  // จัดกลุ่มตาม category และกรองข้อมูลติดต่อ โซเชียล และบัญชีสมาคมออก (ย้ายไปอยู่ในข้อมูลเว็บไซต์แล้ว)
  const grouped = settings
    .filter(
      (s) =>
        s.category !== "contact" &&
        s.category !== "social" &&
        s.category !== "donation" &&
        ![
          "logo_url",
          "hero_bg_url",
          "social_sidebar_position",
          "youtube_url",
          "event_alert_settings",
          "events_default_view",
        ].includes(s.key),
    )
    .reduce<Record<string, Setting[]>>((acc, s) => {
      const cat = s.category || "General";
      (acc[cat] ||= []).push(s);
      return acc;
    }, {});

  const formatKeyToLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSettingLabel = (key: string) => {
    const translationKey = `settings.keys.${key}`;
    return t.has(translationKey) ? t(translationKey) : formatKeyToLabel(key);
  };

  const renderInput = (setting: Setting) => {
    const val = getValue(setting);
    const label = getSettingLabel(setting.key);
    switch (setting.type) {
      case "boolean":
        return (
          <Switch
            id={setting.key}
            label={label}
            checked={val === "true"}
            onChange={(e) => handleChange(setting.key, e.target.checked)}
          />
        );
      case "number":
        return (
          <Input
            id={setting.key}
            label={label}
            type="number"
            value={val}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );
      case "textarea":
        return (
          <Textarea
            id={setting.key}
            label={label}
            value={val}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            rows={4}
          />
        );
      default:
        return (
          <Input
            id={setting.key}
            label={label}
            value={val}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <AdminPageHeader
        title={t("settings.title")}
        breadcrumbs={[{ label: t("settings.title") }]}
      />
      <div className="space-y-6 max-w-3xl">
        <div className="bg-admin-surface rounded-none border border-admin-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-admin-foreground">{t("settings.eventAlert")}</h2>
          <Switch
            id="event-alert-enabled"
            label={t("settings.eventAlertEnabled")}
            checked={alert.enabled}
            onChange={(e) => setAlert({ ...alert, enabled: e.target.checked })}
          />
          <Select
            id="alert-event-id"
            label={t("settings.eventToDisplay")}
            value={alert.event_id}
            onChange={(e) => setAlert({ ...alert, event_id: Number(e.target.value) })}
            options={[
              { value: 0, label: t("settings.eventAutoUpcoming") },
              ...events.map((event) => ({
                value: event.id,
                label: event.title.th || event.title.en || `#${event.id}`,
              })),
            ]}
          />
          <Input
            id="alert-delay"
            label={t("settings.delaySeconds")}
            type="number"
            min={0}
            max={30}
            value={alert.delay_seconds}
            onChange={(e) => setAlert({ ...alert, delay_seconds: Number(e.target.value) })}
          />
          <Input
            id="alert-dismiss"
            label={t("settings.dismissHours")}
            type="number"
            min={1}
            max={720}
            value={alert.dismiss_hours}
            onChange={(e) => setAlert({ ...alert, dismiss_hours: Number(e.target.value) })}
          />
        </div>
        <div className="bg-admin-surface rounded-none border border-admin-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-admin-foreground">{t("sidebar.website")}</h2>
          <MediaUrlField
            label={t("settings.logoUrl")}
            value={shell.logo_url}
            onUrlChange={(url) => setShell((prev) => ({ ...prev, logo_url: url }))}
            inputProps={{
              value: shell.logo_url,
              onChange: (e) => setShell((prev) => ({ ...prev, logo_url: e.target.value })),
              placeholder: t("settings.logoUrlPlaceholder"),
            }}
          />
          <MediaUrlField
            label={t("settings.heroBgUrl")}
            value={shell.hero_bg_url}
            onUrlChange={(url) => setShell((prev) => ({ ...prev, hero_bg_url: url }))}
            inputProps={{
              value: shell.hero_bg_url,
              onChange: (e) => setShell((prev) => ({ ...prev, hero_bg_url: e.target.value })),
              placeholder: t("settings.heroBgUrlPlaceholder"),
            }}
          />
          <Select
            id="social-sidebar-position"
            label={t("settings.socialSidebarPosition")}
            value={shell.social_sidebar_position}
            onChange={(e) => setShell({ ...shell, social_sidebar_position: e.target.value })}
            options={[
              { value: "left", label: t("settings.socialSidebarLeft") },
              { value: "right", label: t("settings.socialSidebarRight") },
            ]}
          />
          <Input
            id="youtube-url"
            label={t("settings.youtubeUrl")}
            type="url"
            placeholder={t("settings.youtubeUrlPlaceholder")}
            value={shell.youtube_url}
            onChange={(e) => setShell({ ...shell, youtube_url: e.target.value })}
          />
          <Select
            id="events-default-view"
            label={t("settings.defaultEventsView")}
            value={eventsDefaultView}
            onChange={(e) => setEventsDefaultView(e.target.value === "list" ? "list" : "calendar")}
            options={[
              { value: "calendar", label: t("settings.eventsViewCalendar") },
              { value: "list", label: t("settings.eventsViewList") },
            ]}
          />
        </div>
        {Object.entries(grouped).map(([category, items]) => (
          <div
            key={category}
            className="bg-admin-surface rounded-none border border-admin-border"
          >
            <div className="px-6 py-4 border-b border-admin-border">
              <h2 className="text-lg font-semibold text-admin-foreground">
                {category}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {items.map((setting) => (
                <div key={setting.id}>{renderInput(setting)}</div>
              ))}
            </div>
          </div>
        ))}
        {/* Sticky Action Bar */}
        <FormActionBar
          isDirty={hasChanges}
          unsavedText={t("settings.unsavedChanges")}
          isLoading={isSaving}
          isSaveDisabled={isSaving || !hasChanges}
          onSave={handleSave}
          saveButtonType="button"
          saveText={t("common.saveChanges")}
          showCancel={false}
        />
      </div>
    </div>
  );
}

