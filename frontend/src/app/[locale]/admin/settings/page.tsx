"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { settingsAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Setting } from "@/types/entities";
import { Icons } from "@/components/ui/Icons";
import { eventAlertSettingsSchema, fetchAdminEventAlertSettings, saveAdminEventAlertSettings, type EventAlertSettings } from "@/features/public/event-alert/api";
import { eventAdminService } from "@/services/adminService";
import type { Event } from "@/types/entities";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function SettingsPage() {
  const t = useTranslations("Admin");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<EventAlertSettings>({ enabled: false, event_id: 0, delay_seconds: 2, dismiss_hours: 24 });
  const [initialAlert, setInitialAlert] = useState<EventAlertSettings>({ enabled: false, event_id: 0, delay_seconds: 2, dismiss_hours: 24 });
  const [events, setEvents] = useState<Event[]>([]);
  const [shell, setShell] = useState({ logo_url: "", social_sidebar_position: "left", youtube_url: "" });
  const [initialShell, setInitialShell] = useState({ logo_url: "", social_sidebar_position: "left", youtube_url: "" });
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsAdminService.getAll();
      setSettings(data);
      const byKey = Object.fromEntries(data.map((item) => [item.key, item.value]));
      const shellVal = { logo_url: byKey.logo_url ?? "", social_sidebar_position: byKey.social_sidebar_position === "right" ? "right" : "left", youtube_url: byKey.youtube_url ?? "" };
      setShell(shellVal);
      setInitialShell(shellVal);
      const [alertSettings, eventResult] = await Promise.all([fetchAdminEventAlertSettings(), eventAdminService.getAll({ is_active: "true" })]);
      setAlert(alertSettings);
      setInitialAlert(alertSettings);
      setEvents(eventResult.data);
    } catch {
      toast.error(t("settings.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string | boolean) => {
    setChanges((prev) => ({ ...prev, [key]: String(value) }));
  };

  const getValue = (setting: Setting) => changes[setting.key] ?? setting.value;

  const isAlertChanged = JSON.stringify(alert) !== JSON.stringify(initialAlert);
  const isShellChanged = JSON.stringify(shell) !== JSON.stringify(initialShell);
  const hasChanges = Object.keys(changes).length > 0 || isAlertChanged || isShellChanged;

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
          { key: "social_sidebar_position", value: shell.social_sidebar_position },
          { key: "youtube_url", value: shell.youtube_url }
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
    .filter((s) => s.category !== "contact" && s.category !== "social" && s.category !== "donation" && !["logo_url", "social_sidebar_position", "youtube_url", "event_alert_settings"].includes(s.key))
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
        <div className="bg-admin-surface rounded-xl border border-admin-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-admin-foreground">{t("settings.eventAlert")}</h2>
          <Switch id="event-alert-enabled" label={t("settings.eventAlertEnabled")} checked={alert.enabled} onChange={(e) => setAlert({ ...alert, enabled: e.target.checked })} />
          <label className="block text-sm font-medium text-admin-body">{t("settings.eventToDisplay")}
            <select className="mt-1 w-full rounded-lg border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus" value={alert.event_id} onChange={(e) => setAlert({ ...alert, event_id: Number(e.target.value) })}>
              <option value={0}>{t("settings.selectEvent")}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title.th || event.title.en}</option>)}
            </select>
          </label>
          <Input id="alert-delay" label={t("settings.delaySeconds")} type="number" min={0} max={30} value={alert.delay_seconds} onChange={(e) => setAlert({ ...alert, delay_seconds: Number(e.target.value) })} />
          <Input id="alert-dismiss" label={t("settings.dismissHours")} type="number" min={1} max={720} value={alert.dismiss_hours} onChange={(e) => setAlert({ ...alert, dismiss_hours: Number(e.target.value) })} />
        </div>
        <div className="bg-admin-surface rounded-xl border border-admin-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-admin-foreground">Public Website</h2>
          <ImageUpload label="โลโก้เว็บไซต์" value={shell.logo_url} onChange={(value) => setShell({ ...shell, logo_url: typeof value === "string" ? value : "" })} />
          <label className="block text-sm font-medium text-admin-body">ตำแหน่งแถบโซเชียลมีเดียด้านข้าง<select className="mt-1 w-full rounded-lg border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus" value={shell.social_sidebar_position} onChange={(e) => setShell({ ...shell, social_sidebar_position: e.target.value })}><option value="left">ซ้าย</option><option value="right">ขวา</option></select></label>
          <Input id="youtube-url" label="ลิงก์ช่อง YouTube" type="url" placeholder="https://youtube.com/@channel" value={shell.youtube_url} onChange={(e) => setShell({ ...shell, youtube_url: e.target.value })} />
        </div>
        {Object.entries(grouped).map(([category, items]) => (
          <div
            key={category}
            className="bg-admin-surface rounded-xl border border-admin-border"
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
        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-admin-border bg-admin-surface/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-admin-warning">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-admin-warning/75 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-admin-warning"></span>
                </span>
                {t("settings.unsavedChanges")}
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              isLoading={isSaving}
              icon={<Icons.Save size={16} />}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {t("common.saveChanges")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
