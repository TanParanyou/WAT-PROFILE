"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Palette,
  Bell,
  Sliders,
  Calendar as CalendarIcon,
  List as ListIcon,
  Clock,
  Sparkles,
  Info,
  Layers,
  Share2,
  X,
  ExternalLink,
  ImageIcon,
  Trash2,
  Youtube,
  Globe,
  FileText,
  Phone,
  MapPin,
  Database,
  Download,
  Loader2,
  ShieldAlert,
  Award,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormActionBar } from "@/components/admin/FormActionBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoading } from "@/components/ui/Loading";
import { settingsAdminService, eventAdminService } from "@/services/adminService";
import { backupService, type BackupStatus } from "@/services/backupService";
import { useToast } from "@/hooks/useToast";
import type { Setting, Event } from "@/types/entities";
import {
  eventAlertSettingsSchema,
  fetchAdminEventAlertSettings,
  saveAdminEventAlertSettings,
  type EventAlertSettings,
} from "@/features/public/event-alert/api";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";
import type { EventsView } from "@/features/public/settings/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import { formatDateTimeWithRelative } from "@/utils/formatters";

type SettingsTab = "branding" | "certificate" | "eventAlert" | "general" | "features";

interface ShellMediaAssetProps {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  isLogo?: boolean;
  onChange: (url: string) => void;
  selectButtonText: string;
  clearButtonText: string;
}

function ShellMediaAssetField({
  label,
  value,
  placeholder,
  hint,
  isLogo = false,
  onChange,
  selectButtonText,
  clearButtonText,
}: ShellMediaAssetProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const hasValue = Boolean(value && value.trim() !== "");

  return (
    <div className="space-y-3 bg-admin-surface-muted/30 border border-admin-border p-4 rounded-none">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-admin-foreground flex items-center gap-1.5">
          <ImageIcon size={15} className="text-admin-muted" />
          <span>{label}</span>
        </label>
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-admin-danger hover:underline flex items-center gap-1"
          >
            <Trash2 size={12} />
            <span>{clearButtonText}</span>
          </button>
        )}
      </div>

      {/* Visual Preview Box */}
      <div
        className={cn(
          "w-full border border-admin-border relative overflow-hidden flex items-center justify-center rounded-none",
          isLogo
            ? "h-24 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] bg-admin-surface"
            : "h-36 bg-admin-surface-muted",
        )}
      >
        {hasValue ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt={label}
            className={cn(
              "object-contain transition-transform duration-200",
              isLogo ? "max-h-20 max-w-[85%] p-1" : "h-full w-full object-cover",
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-admin-muted">
            <ImageIcon size={24} className="opacity-40" />
            <span className="text-xs">{placeholder || "-"}</span>
          </div>
        )}
      </div>

      {/* Direct Action & URL Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="px-3 py-2 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-xs font-medium uppercase tracking-wider text-admin-foreground transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ImageIcon size={14} />
            <span>{selectButtonText}</span>
          </button>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-9 flex-1 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-1.5 text-xs text-admin-foreground focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus"
          />
        </div>

        {hint && <p className="text-[11px] text-admin-muted leading-relaxed">{hint}</p>}
      </div>

      <MediaPickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => onChange(url)}
      />
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");

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

  const [aiTranslateEnabled, setAiTranslateEnabled] = useState(true);
  const [initialAiTranslateEnabled, setInitialAiTranslateEnabled] = useState(true);

  const [communityFilterEnabled, setCommunityFilterEnabled] = useState(true);
  const [initialCommunityFilterEnabled, setInitialCommunityFilterEnabled] = useState(true);
  const [communityBlockedWords, setCommunityBlockedWords] = useState("");
  const [initialCommunityBlockedWords, setInitialCommunityBlockedWords] = useState("");

  const [certificate, setCertificate] = useState({
    org_name_th: "วัดหลวงพ่อสาย เยอรมนี",
    org_name_de: "WAT LOUNG POR SAI e.V.",
    org_subtitle: "Theravada Buddhist Temple & Community Association e.V.",
    tax_number: "VR 12345 / FA Frankfurt",
    address: "Darmstädter Landstraße, Frankfurt am Main, Germany",
    blessing_th: "ขออาราธนาคุณพระศรีรัตนตรัย จงดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ ด้วยจตุรพิธพรชัยทุกประการเทอญ",
    blessing_de: "Möge diese heilsame Tat Ihnen und Ihrer Familie dauerhaften Frieden, Freude und Wohlergehen bringen.",
    signatory_name: "พระครูวิมลธรรมวิเทศ",
    signatory_title: "Vorstand / เจ้าอาวาส",
    seal_url: "",
    signature_url: "",
  });
  const [initialCertificate, setInitialCertificate] = useState({
    org_name_th: "วัดหลวงพ่อสาย เยอรมนี",
    org_name_de: "WAT LOUNG POR SAI e.V.",
    org_subtitle: "Theravada Buddhist Temple & Community Association e.V.",
    tax_number: "VR 12345 / FA Frankfurt",
    address: "Darmstädter Landstraße, Frankfurt am Main, Germany",
    blessing_th: "ขออาราธนาคุณพระศรีรัตนตรัย จงดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ ด้วยจตุรพิธพรชัยทุกประการเทอญ",
    blessing_de: "Möge diese heilsame Tat Ihnen und Ihrer Familie dauerhaften Frieden, Freude und Wohlergehen bringen.",
    signatory_name: "พระครูวิมลธรรมวิเทศ",
    signatory_title: "Vorstand / เจ้าอาวาส",
    seal_url: "",
    signature_url: "",
  });

  const { user } = useAuth();
  const isSuperAdmin = Boolean(
    user?.role?.name === "super_admin" ||
    (user?.role?.is_system && user?.role?.admin_access)
  );

  const [featureFlags, setFeatureFlags] = useState({
    feature_public_account_auth: false,
    feature_public_community_read: false,
    feature_public_community_write: false,
    feature_donations: true,
    feature_event_registration: true,
  });
  const [initialFeatureFlags, setInitialFeatureFlags] = useState({
    feature_public_account_auth: false,
    feature_public_community_read: false,
    feature_public_community_write: false,
    feature_donations: true,
    feature_event_registration: true,
  });

  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);

  const { toast } = useToast();

  const loadBackupStatus = useCallback(async () => {
    try {
      const status = await backupService.getStatus();
      setBackupStatus(status);
    } catch {
      // Non-blocking for settings page
    }
  }, []);

  const formatBackupDate = useCallback(
    (isoDate: string | null | undefined) => {
      if (!isoDate) return t("settings.neverBackedUp");
      const result = formatDateTimeWithRelative(isoDate, locale);
      return result === "-" ? t("settings.neverBackedUp") : result;
    },
    [locale, t]
  );

  const handleDownloadBackup = async () => {
    setIsDownloadingBackup(true);
    try {
      await backupService.exportDatabaseSnapshot();
      toast.success(t("settings.backupSuccess"));
      await loadBackupStatus();
    } catch {
      toast.error(t("settings.backupError"));
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data] = await Promise.all([
        settingsAdminService.getAll(),
        loadBackupStatus(),
      ]);
      setSettings(data);
      const byKey = Object.fromEntries(data.map((item) => [item.key, item.value]));

      const parseBool = (v: string | undefined, defaultVal: boolean) => {
        if (v === undefined || v === null || v === "") return defaultVal;
        const lower = v.trim().toLowerCase();
        return lower === "true" || lower === "1" || lower === "yes";
      };

      const flags = {
        feature_public_account_auth: parseBool(byKey.feature_public_account_auth, false),
        feature_public_community_read: parseBool(byKey.feature_public_community_read, false),
        feature_public_community_write: parseBool(byKey.feature_public_community_write, false),
        feature_donations: parseBool(byKey.feature_donations, true),
        feature_event_registration: parseBool(byKey.feature_event_registration, true),
      };
      setFeatureFlags(flags);
      setInitialFeatureFlags(flags);

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

      const aiEnabled = byKey.ai_translate_enabled !== "false";
      setAiTranslateEnabled(aiEnabled);
      setInitialAiTranslateEnabled(aiEnabled);

      const commFilterEnabled = byKey.community_word_filter_enabled !== "false";
      setCommunityFilterEnabled(commFilterEnabled);
      setInitialCommunityFilterEnabled(commFilterEnabled);

      const commBlockedWords = byKey.community_blocked_words ?? "";
      setCommunityBlockedWords(commBlockedWords);
      setInitialCommunityBlockedWords(commBlockedWords);

      const certVal = {
        org_name_th: byKey.certificate_org_name_th ?? "วัดหลวงพ่อสาย เยอรมนี",
        org_name_de: byKey.certificate_org_name_de ?? "WAT LOUNG POR SAI e.V.",
        org_subtitle: byKey.certificate_org_subtitle ?? "Theravada Buddhist Temple & Community Association e.V.",
        tax_number: byKey.certificate_tax_number ?? "VR 12345 / FA Frankfurt",
        address: byKey.certificate_address ?? "Darmstädter Landstraße, Frankfurt am Main, Germany",
        blessing_th: byKey.certificate_blessing_th ?? "ขออาราธนาคุณพระศรีรัตนตรัย จงดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ ด้วยจตุรพิธพรชัยทุกประการเทอญ",
        blessing_de: byKey.certificate_blessing_de ?? "Möge diese heilsame Tat Ihnen und Ihrer Familie dauerhaften Frieden, Freude und Wohlergehen bringen.",
        signatory_name: byKey.certificate_signatory_name ?? "พระครูวิมลธรรมวิเทศ",
        signatory_title: byKey.certificate_signatory_title ?? "Vorstand / เจ้าอาวาส",
        seal_url: byKey.certificate_seal_url ?? "",
        signature_url: byKey.certificate_signature_url ?? "",
      };
      setCertificate(certVal);
      setInitialCertificate(certVal);

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
  }, [loadBackupStatus, t, toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key: string, value: string | boolean) => {
    setChanges((prev) => ({ ...prev, [key]: String(value) }));
  };

  const getValue = (setting: Setting) => changes[setting.key] ?? setting.value;

  const isAlertChanged = JSON.stringify(alert) !== JSON.stringify(initialAlert);
  const isShellChanged = JSON.stringify(shell) !== JSON.stringify(initialShell);
  const isCertificateChanged = JSON.stringify(certificate) !== JSON.stringify(initialCertificate);
  const isEventsDefaultViewChanged = eventsDefaultView !== initialEventsDefaultView;
  const isAiTranslateChanged = aiTranslateEnabled !== initialAiTranslateEnabled;
  const isCommunityFilterChanged =
    communityFilterEnabled !== initialCommunityFilterEnabled ||
    communityBlockedWords !== initialCommunityBlockedWords;
  const isFeaturesChanged = JSON.stringify(featureFlags) !== JSON.stringify(initialFeatureFlags);

  const hasChanges =
    Object.keys(changes).length > 0 ||
    isAlertChanged ||
    isShellChanged ||
    isCertificateChanged ||
    isEventsDefaultViewChanged ||
    isAiTranslateChanged ||
    isCommunityFilterChanged ||
    isFeaturesChanged;

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
      if (isCertificateChanged) {
        await settingsAdminService.update([
          { key: "certificate_org_name_th", value: certificate.org_name_th },
          { key: "certificate_org_name_de", value: certificate.org_name_de },
          { key: "certificate_org_subtitle", value: certificate.org_subtitle },
          { key: "certificate_tax_number", value: certificate.tax_number },
          { key: "certificate_address", value: certificate.address },
          { key: "certificate_blessing_th", value: certificate.blessing_th },
          { key: "certificate_blessing_de", value: certificate.blessing_de },
          { key: "certificate_signatory_name", value: certificate.signatory_name },
          { key: "certificate_signatory_title", value: certificate.signatory_title },
          { key: "certificate_seal_url", value: certificate.seal_url },
          { key: "certificate_signature_url", value: certificate.signature_url },
        ]);
      }
      if (isEventsDefaultViewChanged) {
        await settingsAdminService.update([
          { key: "events_default_view", value: eventsDefaultView },
        ]);
      }
      if (isAiTranslateChanged) {
        await settingsAdminService.update([
          { key: "ai_translate_enabled", value: String(aiTranslateEnabled) },
        ]);
      }
      if (isCommunityFilterChanged) {
        await settingsAdminService.update([
          { key: "community_word_filter_enabled", value: String(communityFilterEnabled) },
          { key: "community_blocked_words", value: communityBlockedWords },
        ]);
      }
      if (isFeaturesChanged) {
        await settingsAdminService.update([
          { key: "feature_public_account_auth", value: String(featureFlags.feature_public_account_auth) },
          { key: "feature_public_community_read", value: String(featureFlags.feature_public_community_read) },
          { key: "feature_public_community_write", value: String(featureFlags.feature_public_community_write) },
          { key: "feature_donations", value: String(featureFlags.feature_donations) },
          { key: "feature_event_registration", value: String(featureFlags.feature_event_registration) },
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

  // จัดกลุ่มตาม category และกรองข้อมูลติดต่อ โซเชียล บัญชีสมาคม และ Feature Flags ออก
  const grouped = useMemo(() => {
    return settings
      .filter(
        (s) =>
          s.category !== "contact" &&
          s.category !== "social" &&
          s.category !== "donation" &&
          s.category !== "features" &&
          !s.key.startsWith("feature_") &&
          !s.key.startsWith("certificate_") &&
          ![
            "logo_url",
            "hero_bg_url",
            "social_sidebar_position",
            "youtube_url",
            "event_alert_settings",
            "events_default_view",
            "ai_translate_enabled",
            "community_word_filter_enabled",
            "community_blocked_words",
          ].includes(s.key),
      )
      .reduce<Record<string, Setting[]>>((acc, s) => {
        const cat = s.category || "General";
        (acc[cat] ||= []).push(s);
        return acc;
      }, {});
  }, [settings]);

  const formatKeyToLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getCategoryLabel = (category: string) => {
    // Normalise category name for translation lookup (e.g. public-shell -> publicShell)
    const camelCat = category.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
    const translationKey = `settings.categories.${camelCat}`;
    if (t.has(translationKey)) return t(translationKey);
    const rawKey = `settings.categories.${category}`;
    if (t.has(rawKey)) return t(rawKey);
    return formatKeyToLabel(category);
  };

  const getSettingLabel = (key: string) => {
    const translationKey = `settings.keys.${key}`;
    return t.has(translationKey) ? t(translationKey) : formatKeyToLabel(key);
  };

  // หา Event ที่กำลังถูกเลือกสำหรับ Live Preview
  const selectedEventForPreview = useMemo(() => {
    if (alert.event_id === 0) {
      return events.length > 0 ? events[0] : null;
    }
    return events.find((e) => e.id === alert.event_id) ?? null;
  }, [alert.event_id, events]);

  const getPreviewDescription = (event: Event | null, currentLocale: string): string => {
    if (!event || !event.description) return t("settings.preview.autoDescription");
    const desc = event.description as Record<string, unknown>;
    const val = desc[currentLocale] || desc.th || desc.en || desc.de;
    if (typeof val === "string") return val;
    return t("settings.preview.autoDescription");
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

  interface SubSectionGroup {
    id: string;
    title: string;
    icon: React.ReactNode;
    gridCols?: string;
    items: Setting[];
  }

  const categorizeSettings = (items: Setting[]): SubSectionGroup[] => {
    const siteNameKeys = ["site_name", "site_name_th", "site_name_en", "site_name_de"];
    const siteDescKeys = ["site_description_th", "site_description_en", "site_description_de"];
    const contactInfoKeys = ["contact_email", "contact_phone", "line_id"];
    const contactAddressKeys = [
      "contact_address_th",
      "contact_address_en",
      "contact_address_de",
      "address",
    ];
    const socialKeys = ["facebook_url", "instagram_url", "line_url"];
    const dedicatedKeys = [
      "logo_url",
      "hero_bg_url",
      "social_sidebar_position",
      "youtube_url",
      "ai_translate_enabled",
      "gemini_api_key",
      "community_word_filter_enabled",
      "community_blocked_words",
      "events_default_view",
    ];

    const siteNames = items.filter((s) => siteNameKeys.includes(s.key));
    const siteDescs = items.filter((s) => siteDescKeys.includes(s.key));
    const contactInfos = items.filter((s) => contactInfoKeys.includes(s.key));
    const contactAddresses = items.filter((s) => contactAddressKeys.includes(s.key));
    const socials = items.filter((s) => socialKeys.includes(s.key));
    const others = items.filter(
      (s) =>
        !siteNameKeys.includes(s.key) &&
        !siteDescKeys.includes(s.key) &&
        !contactInfoKeys.includes(s.key) &&
        !contactAddressKeys.includes(s.key) &&
        !socialKeys.includes(s.key) &&
        !dedicatedKeys.includes(s.key) &&
        !s.key.startsWith("feature_") &&
        !s.key.startsWith("backup_"),
    );

    const groups: SubSectionGroup[] = [];

    if (siteNames.length > 0) {
      groups.push({
        id: "siteName",
        title: t("settings.subsections.siteName"),
        icon: <Globe size={16} className="text-admin-muted" />,
        gridCols: "grid-cols-1 md:grid-cols-2",
        items: siteNames,
      });
    }

    if (siteDescs.length > 0) {
      groups.push({
        id: "siteDescription",
        title: t("settings.subsections.siteDescription"),
        icon: <FileText size={16} className="text-admin-muted" />,
        gridCols: "grid-cols-1",
        items: siteDescs,
      });
    }

    if (contactInfos.length > 0) {
      groups.push({
        id: "contactInfo",
        title: t("settings.subsections.contactInfo"),
        icon: <Phone size={16} className="text-admin-muted" />,
        gridCols: "grid-cols-1 md:grid-cols-2",
        items: contactInfos,
      });
    }

    if (contactAddresses.length > 0) {
      groups.push({
        id: "contactAddress",
        title: t("settings.subsections.contactAddress"),
        icon: <MapPin size={16} className="text-admin-muted" />,
        gridCols: "grid-cols-1 md:grid-cols-3",
        items: contactAddresses,
      });
    }

    if (socials.length > 0) {
      groups.push({
        id: "socialMedia",
        title: t("settings.subsections.socialMedia"),
        icon: <Share2 size={16} className="text-admin-muted" />,
        gridCols: "grid-cols-1 md:grid-cols-2",
        items: socials,
      });
    }

    if (others.length > 0) {
      groups.push({
        id: "other",
        title: t("settings.subsections.other"),
        icon: <Sliders size={16} className="text-admin-muted" />,
        gridCols: "grid-cols-1 md:grid-cols-2",
        items: others,
      });
    }

    return groups;
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-between">
      <div className="flex-1 space-y-6">
        <AdminPageHeader
          title={t("settings.title")}
          breadcrumbs={[{ label: t("settings.title") }]}
        />

        {/* Modern Navigation Tabs */}
        <div className="border-b border-admin-border">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("branding")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === "branding"
                  ? "border-admin-foreground text-admin-foreground"
                  : "border-transparent text-admin-muted hover:text-admin-body hover:border-admin-border",
              )}
            >
              <Palette size={16} />
              {t("settings.tabs.branding")}
              {isShellChanged || isEventsDefaultViewChanged ? (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("certificate")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === "certificate"
                  ? "border-admin-foreground text-admin-foreground"
                  : "border-transparent text-admin-muted hover:text-admin-body hover:border-admin-border",
              )}
            >
              <Award size={16} />
              {t("settings.tabs.certificate")}
              {isCertificateChanged && (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("eventAlert")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === "eventAlert"
                  ? "border-admin-foreground text-admin-foreground"
                  : "border-transparent text-admin-muted hover:text-admin-body hover:border-admin-border",
              )}
            >
              <Bell size={16} />
              {t("settings.tabs.eventAlert")}
              {isAlertChanged && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === "general"
                  ? "border-admin-foreground text-admin-foreground"
                  : "border-transparent text-admin-muted hover:text-admin-body hover:border-admin-border",
              )}
            >
              <Sliders size={16} />
              {t("settings.tabs.general")}
              {Object.keys(changes).length > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("features")}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === "features"
                    ? "border-admin-foreground text-admin-foreground"
                    : "border-transparent text-admin-muted hover:text-admin-body hover:border-admin-border",
                )}
              >
                <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400" />
                {t("settings.tabs.features")}
                {isFeaturesChanged && (
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: BRANDING & LAYOUT (PUBLIC SHELL)                                   */}
          {/* ========================================================================= */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              {/* Section 1: Public Shell Assets (Logo & Hero Background) */}
              <div className="bg-admin-surface border border-admin-border p-6 space-y-6 rounded-none">
                <div className="border-b border-admin-border pb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-admin-muted" />
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.shellSectionTitle")}
                    </h2>
                  </div>
                  <p className="text-xs text-admin-muted mt-1">
                    {t("settings.shellSectionDesc")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Website Logo Field */}
                  <ShellMediaAssetField
                    label={t("settings.logoUrl")}
                    value={shell.logo_url}
                    placeholder={t("settings.logoUrlPlaceholder")}
                    hint={t("settings.logoHint")}
                    isLogo={true}
                    onChange={(url) => setShell((prev) => ({ ...prev, logo_url: url }))}
                    selectButtonText={t("settings.selectFromMedia")}
                    clearButtonText={t("settings.clearImage")}
                  />

                  {/* Hero Background Field */}
                  <ShellMediaAssetField
                    label={t("settings.heroBgUrl")}
                    value={shell.hero_bg_url}
                    placeholder={t("settings.heroBgUrlPlaceholder")}
                    hint={t("settings.heroBgHint")}
                    isLogo={false}
                    onChange={(url) => setShell((prev) => ({ ...prev, hero_bg_url: url }))}
                    selectButtonText={t("settings.selectFromMedia")}
                    clearButtonText={t("settings.clearImage")}
                  />
                </div>
              </div>

              {/* Section 2: Layout & Navigation */}
              <div className="bg-admin-surface border border-admin-border p-6 space-y-6 rounded-none">
                <div className="border-b border-admin-border pb-3">
                  <div className="flex items-center gap-2">
                    <Share2 size={18} className="text-admin-muted" />
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.layoutSectionTitle")}
                    </h2>
                  </div>
                  <p className="text-xs text-admin-muted mt-1">
                    {t("settings.layoutSectionDesc")}
                  </p>
                </div>

                {/* Visual Social Sidebar Position */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-admin-foreground block">
                    {t("settings.socialSidebarPosition")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Option */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShell((prev) => ({ ...prev, social_sidebar_position: "left" }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setShell((prev) => ({ ...prev, social_sidebar_position: "left" }));
                        }
                      }}
                      className={cn(
                        "cursor-pointer border p-4 transition-all flex flex-col justify-between rounded-none",
                        shell.social_sidebar_position === "left"
                          ? "border-admin-focus bg-admin-surface ring-1 ring-admin-focus"
                          : "border-admin-border bg-admin-surface-muted/40 hover:border-admin-body/40",
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center",
                              shell.social_sidebar_position === "left"
                                ? "border-admin-focus bg-admin-focus"
                                : "border-admin-control-border",
                            )}
                          >
                            {shell.social_sidebar_position === "left" && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-medium text-sm text-admin-foreground">
                            {t("settings.socialSidebarLeft")}
                          </span>
                        </div>
                      </div>

                      {/* Mock Diagram Left */}
                      <div className="h-20 bg-admin-surface border border-admin-border flex items-center justify-between p-2 relative overflow-hidden">
                        <div className="w-4 h-full bg-admin-focus/20 border border-admin-focus/40 flex flex-col items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-admin-focus" />
                          <div className="w-2 h-2 rounded-full bg-admin-focus" />
                        </div>
                        <div className="flex-1 ml-3 h-full bg-admin-surface-muted/60 border border-dashed border-admin-border flex items-center justify-center text-[10px] text-admin-muted">
                          {t("settings.mainContentMock")}
                        </div>
                      </div>
                      <p className="text-xs text-admin-muted mt-3">
                        {t("settings.socialSidebarLeftDesc")}
                      </p>
                    </div>

                    {/* Right Option */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShell((prev) => ({ ...prev, social_sidebar_position: "right" }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setShell((prev) => ({ ...prev, social_sidebar_position: "right" }));
                        }
                      }}
                      className={cn(
                        "cursor-pointer border p-4 transition-all flex flex-col justify-between rounded-none",
                        shell.social_sidebar_position === "right"
                          ? "border-admin-focus bg-admin-surface ring-1 ring-admin-focus"
                          : "border-admin-border bg-admin-surface-muted/40 hover:border-admin-body/40",
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center",
                              shell.social_sidebar_position === "right"
                                ? "border-admin-focus bg-admin-focus"
                                : "border-admin-control-border",
                            )}
                          >
                            {shell.social_sidebar_position === "right" && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-medium text-sm text-admin-foreground">
                            {t("settings.socialSidebarRight")}
                          </span>
                        </div>
                      </div>

                      {/* Mock Diagram Right */}
                      <div className="h-20 bg-admin-surface border border-admin-border flex items-center justify-between p-2 relative overflow-hidden">
                        <div className="flex-1 mr-3 h-full bg-admin-surface-muted/60 border border-dashed border-admin-border flex items-center justify-center text-[10px] text-admin-muted">
                          {t("settings.mainContentMock")}
                        </div>
                        <div className="w-4 h-full bg-admin-focus/20 border border-admin-focus/40 flex flex-col items-center justify-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-admin-focus" />
                          <div className="w-2 h-2 rounded-full bg-admin-focus" />
                        </div>
                      </div>
                      <p className="text-xs text-admin-muted mt-3">
                        {t("settings.socialSidebarRightDesc")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Events Default View */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-admin-foreground block">
                    {t("settings.defaultEventsView")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Calendar View */}
                    <button
                      type="button"
                      onClick={() => setEventsDefaultView("calendar")}
                      className={cn(
                        "p-4 border text-left flex items-start gap-3 transition-all rounded-none",
                        eventsDefaultView === "calendar"
                          ? "border-admin-focus bg-admin-surface ring-1 ring-admin-focus"
                          : "border-admin-border bg-admin-surface-muted/40 hover:border-admin-body/40",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-none",
                          eventsDefaultView === "calendar"
                            ? "bg-admin-focus text-white"
                            : "bg-admin-surface border border-admin-border text-admin-muted",
                        )}
                      >
                        <CalendarIcon size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-admin-foreground">
                          {t("settings.eventsViewCalendar")}
                        </div>
                        <div className="text-xs text-admin-muted mt-1">
                          {t("settings.eventsViewCalendarDesc")}
                        </div>
                      </div>
                    </button>

                    {/* List View */}
                    <button
                      type="button"
                      onClick={() => setEventsDefaultView("list")}
                      className={cn(
                        "p-4 border text-left flex items-start gap-3 transition-all rounded-none",
                        eventsDefaultView === "list"
                          ? "border-admin-focus bg-admin-surface ring-1 ring-admin-focus"
                          : "border-admin-border bg-admin-surface-muted/40 hover:border-admin-body/40",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-none",
                          eventsDefaultView === "list"
                            ? "bg-admin-focus text-white"
                            : "bg-admin-surface border border-admin-border text-admin-muted",
                        )}
                      >
                        <ListIcon size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-admin-foreground">
                          {t("settings.eventsViewList")}
                        </div>
                        <div className="text-xs text-admin-muted mt-1">
                          {t("settings.eventsViewListDesc")}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Video & Social Media */}
              <div className="bg-admin-surface border border-admin-border p-6 space-y-4 rounded-none">
                <div className="border-b border-admin-border pb-3">
                  <div className="flex items-center gap-2">
                    <Youtube size={18} className="text-admin-muted" />
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.socialSectionTitle")}
                    </h2>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    id="youtube-url"
                    label={t("settings.youtubeUrl")}
                    type="url"
                    placeholder={t("settings.youtubeUrlPlaceholder")}
                    value={shell.youtube_url}
                    onChange={(e) => setShell((prev) => ({ ...prev, youtube_url: e.target.value }))}
                  />
                  {shell.youtube_url && shell.youtube_url.startsWith("http") && (
                    <div className="flex justify-end pt-1">
                      <a
                        href={shell.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-admin-focus hover:underline"
                      >
                        <span>{t("settings.testLink")}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CERTIFICATE & RECEIPT TEMPLATE                                       */}
          {/* ========================================================================= */}
          {activeTab === "certificate" && (
            <div className="space-y-6">
              {/* Section 1: Organization & Legal / Tax Info */}
              <div className="bg-admin-surface border border-admin-border p-6 space-y-6 rounded-none">
                <div className="border-b border-admin-border pb-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-admin-muted" />
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.certificateSectionTitle")}
                    </h2>
                  </div>
                  <p className="text-xs text-admin-muted mt-1">
                    {t("settings.certificateSectionDesc")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="cert-org-name-th"
                    label={t("settings.certOrgNameTh")}
                    value={certificate.org_name_th}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, org_name_th: e.target.value }))
                    }
                  />
                  <Input
                    id="cert-org-name-de"
                    label={t("settings.certOrgNameDe")}
                    value={certificate.org_name_de}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, org_name_de: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="cert-org-subtitle"
                    label={t("settings.certOrgSubtitle")}
                    value={certificate.org_subtitle}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, org_subtitle: e.target.value }))
                    }
                  />
                  <Input
                    id="cert-tax-number"
                    label={t("settings.certTaxNumber")}
                    value={certificate.tax_number}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, tax_number: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Textarea
                    id="cert-address"
                    label={t("settings.certAddress")}
                    value={certificate.address}
                    rows={2}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Section 2: Blessing Quotes & Acknowledgement */}
              <div className="bg-admin-surface border border-admin-border p-6 space-y-6 rounded-none">
                <div className="border-b border-admin-border pb-3">
                  <h2 className="text-base font-semibold text-admin-foreground">
                    {t("settings.certBlessingTh")} &amp; {t("settings.certBlessingDe")}
                  </h2>
                </div>

                <div className="space-y-4">
                  <Textarea
                    id="cert-blessing-th"
                    label={t("settings.certBlessingTh")}
                    value={certificate.blessing_th}
                    rows={3}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, blessing_th: e.target.value }))
                    }
                  />
                  <Textarea
                    id="cert-blessing-de"
                    label={t("settings.certBlessingDe")}
                    value={certificate.blessing_de}
                    rows={3}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, blessing_de: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Section 3: Signatory Details */}
              <div className="bg-admin-surface border border-admin-border p-6 space-y-6 rounded-none">
                <div className="border-b border-admin-border pb-3">
                  <h2 className="text-base font-semibold text-admin-foreground">
                    {t("settings.certSignatoryName")} / {t("settings.certSignatoryTitle")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="cert-signatory-name"
                    label={t("settings.certSignatoryName")}
                    value={certificate.signatory_name}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, signatory_name: e.target.value }))
                    }
                  />
                  <Input
                    id="cert-signatory-title"
                    label={t("settings.certSignatoryTitle")}
                    value={certificate.signatory_title}
                    onChange={(e) =>
                      setCertificate((prev) => ({ ...prev, signatory_title: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Section 4: Official Seal & Default Signature Assets */}
              <div className="bg-admin-surface border border-admin-border p-6 space-y-6 rounded-none">
                <div className="border-b border-admin-border pb-3">
                  <h2 className="text-base font-semibold text-admin-foreground">
                    {t("settings.certSealUrl")} &amp; {t("settings.certSignatureUrl")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ShellMediaAssetField
                    label={t("settings.certSealUrl")}
                    value={certificate.seal_url}
                    placeholder="/images/icon/wat-seal.png"
                    hint={t("settings.certSealHint")}
                    isLogo={true}
                    onChange={(url) =>
                      setCertificate((prev) => ({ ...prev, seal_url: url }))
                    }
                    selectButtonText={t("settings.selectFromMedia")}
                    clearButtonText={t("settings.clearImage")}
                  />

                  <ShellMediaAssetField
                    label={t("settings.certSignatureUrl")}
                    value={certificate.signature_url}
                    placeholder="/images/signature/abbot.png"
                    hint={t("settings.certSignatureHint")}
                    isLogo={true}
                    onChange={(url) =>
                      setCertificate((prev) => ({ ...prev, signature_url: url }))
                    }
                    selectButtonText={t("settings.selectFromMedia")}
                    clearButtonText={t("settings.clearImage")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: EVENT ALERT POPUP                                                  */}
          {/* ========================================================================= */}
          {activeTab === "eventAlert" && (
            <div className="space-y-6">
              {/* Master Switch Card */}
              <div className="bg-admin-surface border border-admin-border p-6 rounded-none space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.eventAlert")}
                    </h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      {t("settings.eventAlertDesc")}
                    </p>
                  </div>
                  <Switch
                    id="event-alert-enabled"
                    checked={alert.enabled}
                    onChange={(e) => setAlert({ ...alert, enabled: e.target.checked })}
                  />
                </div>

                {!alert.enabled && (
                  <div className="flex items-center gap-2 p-3 bg-admin-surface-muted border border-admin-border text-xs text-admin-muted rounded-none">
                    <Info size={16} className="text-admin-muted shrink-0" />
                    <span>{t("settings.eventAlertDisabledHint")}</span>
                  </div>
                )}
              </div>

              {/* Progressive Disclosure: Config & Live Preview */}
              {alert.enabled && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Configuration Panel */}
                  <div className="lg:col-span-7 bg-admin-surface border border-admin-border p-6 space-y-5 rounded-none">
                    <div className="flex items-center gap-2 border-b border-admin-border pb-3">
                      <Sliders size={16} className="text-admin-muted" />
                      <h3 className="text-sm font-semibold text-admin-foreground">
                        {t("settings.displaySettings")}
                      </h3>
                    </div>

                    <Select
                      id="alert-event-id"
                      label={t("settings.eventToDisplay")}
                      value={alert.event_id}
                      onChange={(e) => setAlert({ ...alert, event_id: Number(e.target.value) })}
                      options={[
                        { value: 0, label: t("settings.eventAutoUpcoming") },
                        ...events.map((event) => ({
                          value: event.id,
                          label:
                            locale === "en"
                              ? event.title.en || event.title.th
                              : locale === "de"
                                ? event.title.de || event.title.en || event.title.th
                                : event.title.th || event.title.en || `#${event.id}`,
                        })),
                      ]}
                    />

                    {alert.event_id === 0 && (
                      <p className="text-xs text-admin-muted -mt-3 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500 shrink-0" />
                        {t("settings.preview.autoDescription")}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                  </div>

                  {/* Live Mockup Preview Panel */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-admin-focus" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                        {t("settings.preview.title")}
                      </h3>
                    </div>

                    {/* Simulated Modal Card */}
                    <div className="bg-admin-surface border border-admin-border shadow-lg p-5 rounded-none relative overflow-hidden">
                      <div className="absolute top-3 right-3 text-admin-muted hover:text-admin-foreground cursor-default">
                        <X size={16} />
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-admin-focus/10 text-admin-focus border border-admin-focus/20">
                          {t("settings.preview.badge")}
                        </span>
                      </div>

                      {selectedEventForPreview ? (
                        <div className="space-y-3">
                          {selectedEventForPreview.image_url ? (
                            <div className="h-32 w-full overflow-hidden border border-admin-border bg-admin-surface-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={selectedEventForPreview.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-24 w-full border border-dashed border-admin-border flex items-center justify-center bg-admin-surface-muted/50 text-xs text-admin-muted">
                              {t("settings.preview.noImage")}
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold text-sm text-admin-foreground line-clamp-1">
                              {locale === "en"
                                ? selectedEventForPreview.title.en || selectedEventForPreview.title.th
                                : locale === "de"
                                  ? selectedEventForPreview.title.de ||
                                    selectedEventForPreview.title.en ||
                                    selectedEventForPreview.title.th
                                  : selectedEventForPreview.title.th || selectedEventForPreview.title.en}
                            </h4>
                            <p className="text-xs text-admin-muted mt-1 line-clamp-2">
                              {getPreviewDescription(selectedEventForPreview, locale)}
                            </p>
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-admin-border">
                            <button
                              type="button"
                              className="px-3 py-1.5 text-xs text-admin-muted border border-admin-control-border hover:bg-admin-surface-muted"
                            >
                              {t("settings.preview.closeButton")}
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 text-xs bg-admin-focus text-white flex items-center gap-1 font-medium"
                            >
                              <span>{t("settings.preview.viewEvent")}</span>
                              <ExternalLink size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-admin-muted space-y-1">
                          <CalendarIcon size={24} className="mx-auto text-admin-muted/60 mb-2" />
                          <p>{t("settings.preview.noEvents")}</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-admin-surface-muted/60 border border-admin-border text-[11px] text-admin-muted space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-admin-body">
                        <Clock size={12} />
                        <span>{t("settings.preview.behaviorTitle")}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-admin-muted">
                        <li>
                          {t("settings.preview.delayBehavior", { seconds: alert.delay_seconds })}
                        </li>
                        <li>
                          {t("settings.preview.dismissBehavior", { hours: alert.dismiss_hours })}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GENERAL / DYNAMIC SETTINGS                                         */}
          {/* ========================================================================= */}
          {activeTab === "general" && (
            <div className="space-y-8">
              {/* AI & Integrations Card */}
              <div className="bg-admin-surface rounded-none border border-admin-border overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-admin-surface border-b border-admin-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={18} className="text-amber-500" />
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.aiSectionTitle")}
                    </h2>
                  </div>
                  <span className="text-xs text-admin-muted uppercase tracking-wider font-mono">
                    Integrations
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-admin-muted">
                    {t("settings.aiSectionDesc")}
                  </p>
                  <div className="p-4 bg-admin-surface-muted/30 border border-admin-border space-y-3">
                    <Switch
                      id="ai-translate-enabled"
                      label={t("settings.aiTranslateEnabled")}
                      checked={aiTranslateEnabled}
                      onChange={(e) => setAiTranslateEnabled(e.target.checked)}
                    />
                    <p className="text-xs text-admin-muted pl-6">
                      {t("settings.aiTranslateHelp")}
                    </p>
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                      <Info size={16} className="shrink-0 mt-0.5" />
                      <span>{t("settings.aiFreeTierNote")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Backup & Snapshot Card */}
              <div className="bg-admin-surface rounded-none border border-admin-border overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-admin-surface border-b border-admin-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Database size={18} className="text-admin-action" />
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.backupTitle")}
                    </h2>
                  </div>
                  <span className="text-xs text-admin-muted uppercase tracking-wider font-mono">
                    {t("settings.backupZeroCostBadge")}
                  </span>
                </div>
                <div className="p-6 space-y-5">
                  <p className="text-xs text-admin-muted">
                    {t("settings.backupDesc")}
                  </p>

                  {/* Last Backup Timestamps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Automated Cloud Backup Status */}
                    <div className="p-4 bg-admin-surface-muted/30 border border-admin-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-admin-foreground">
                          {t("settings.lastAutomatedBackup")}
                        </span>
                        {backupStatus?.automated_status === "success" && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-admin-surface border border-admin-border text-admin-foreground">
                            {t("settings.backupStatusSuccess")}
                          </span>
                        )}
                        {backupStatus?.automated_status === "failed" && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-admin-surface border border-admin-border text-admin-danger">
                            {t("settings.backupStatusFailed")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-admin-muted">
                        <Clock size={14} className="shrink-0 text-admin-muted" />
                        <span>{formatBackupDate(backupStatus?.last_automated_at)}</span>
                      </div>
                    </div>

                    {/* Manual JSON Snapshot Status */}
                    <div className="p-4 bg-admin-surface-muted/30 border border-admin-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-admin-foreground">
                          {t("settings.lastManualSnapshot")}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-admin-surface border border-admin-border text-admin-muted">
                          {backupStatus?.total_tables ?? 24} {t("settings.tablesIncluded")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-admin-muted">
                        <Clock size={14} className="shrink-0 text-admin-muted" />
                        <span>{formatBackupDate(backupStatus?.last_snapshot_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="p-4 bg-admin-surface-muted/30 border border-admin-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-admin-foreground">
                        JSON Application Snapshot
                      </div>
                      <div className="text-[11px] text-admin-muted">
                        Export complete database tables (Events, Monks, Gallery, Donations, Members, Community Q&A, Content CMS, Settings)
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadBackup}
                      disabled={isDownloadingBackup}
                      className="inline-flex items-center gap-2 shrink-0 text-xs"
                    >
                      {isDownloadingBackup ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-admin-action" />
                          <span>{t("settings.downloadingBackup")}</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} className="text-admin-action" />
                          <span>{t("settings.downloadBackup")}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Community Auto-Moderation & Word Filter Card */}
              <div className="bg-admin-surface rounded-none border border-admin-border overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-admin-surface border-b border-admin-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert size={18} className="text-rose-500" />
                    <h2 className="text-base font-semibold text-admin-foreground">
                      {t("settings.communityFilterSectionTitle")}
                    </h2>
                  </div>
                  <span className="text-xs text-admin-muted uppercase tracking-wider font-mono">
                    Community
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-admin-muted">
                    {t("settings.communityFilterSectionDesc")}
                  </p>
                  <div className="p-4 bg-admin-surface-muted/30 border border-admin-border space-y-4">
                    <Switch
                      id="community-filter-enabled"
                      label={t("settings.communityFilterEnabled")}
                      checked={communityFilterEnabled}
                      onChange={(e) => setCommunityFilterEnabled(e.target.checked)}
                    />
                    <p className="text-xs text-admin-muted pl-6">
                      {t("settings.communityFilterHelp")}
                    </p>
                    <div className="space-y-1.5 pt-2 border-t border-admin-border/60">
                      <label className="text-xs font-semibold text-admin-foreground">
                        {t("settings.communityBlockedWordsLabel")}
                      </label>
                      <Textarea
                        value={communityBlockedWords}
                        onChange={(e) => setCommunityBlockedWords(e.target.value)}
                        placeholder={t("settings.communityBlockedWordsPlaceholder")}
                        rows={3}
                        className="text-xs font-mono"
                      />
                      <p className="text-[11px] text-admin-muted">
                        {t("settings.communityBlockedWordsHelp")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(grouped).length === 0 ? (
                <div className="bg-admin-surface border border-admin-border p-8 text-center text-sm text-admin-muted rounded-none">
                  <Sliders size={28} className="mx-auto text-admin-muted/60 mb-2" />
                  <p>{t("settings.emptyGeneral")}</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => {
                  const subsections = categorizeSettings(items);

                  return (
                    <div
                      key={category}
                      className="bg-admin-surface rounded-none border border-admin-border overflow-hidden shadow-sm"
                    >
                      {/* Category Header */}
                      <div className="px-6 py-4 bg-admin-surface border-b border-admin-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Sliders size={18} className="text-admin-focus" />
                          <h2 className="text-base font-semibold text-admin-foreground">
                            {getCategoryLabel(category)}
                          </h2>
                        </div>
                        <span className="text-xs text-admin-muted uppercase tracking-wider font-mono">
                          {category}
                        </span>
                      </div>

                      {/* Subsections Content */}
                      <div className="p-6 space-y-6">
                        {subsections.map((sub, idx) => (
                          <div
                            key={sub.id}
                            className={cn(
                              "space-y-3",
                              idx > 0 && "pt-6 border-t border-admin-border/60",
                            )}
                          >
                            <div className="flex items-center gap-2 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                              {sub.icon}
                              <span>{sub.title}</span>
                            </div>

                            <div className={cn("grid gap-4", sub.gridCols || "grid-cols-1")}>
                              {sub.items.map((setting) => (
                                <div key={setting.id}>{renderInput(setting)}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SYSTEM MODULES / FEATURE FLAGS (SUPER ADMIN ONLY)                  */}
          {/* ========================================================================= */}
          {activeTab === "features" && isSuperAdmin && (
            <div className="space-y-6">
              <div className="bg-admin-surface border border-admin-border p-6 space-y-6 rounded-none shadow-sm">
                <div className="border-b border-admin-border pb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400" />
                      <h2 className="text-base font-semibold text-admin-foreground">
                        {t("settings.featuresSectionTitle")}
                      </h2>
                    </div>
                    <p className="text-xs text-admin-muted mt-1">
                      {t("settings.featuresSectionDesc")}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider">
                    {t("settings.superAdminOnlyBadge")}
                  </span>
                </div>

                <div className="divide-y divide-admin-border">
                  {/* 1. Public Account Auth */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
                        <span>{t("settings.featureAccountAuthTitle")}</span>
                        <span className="font-mono text-[11px] text-admin-muted">feature_public_account_auth</span>
                      </div>
                      <p className="text-xs text-admin-muted leading-relaxed">
                        {t("settings.featureAccountAuthDesc")}
                      </p>
                    </div>
                    <Switch
                      id="feature_public_account_auth"
                      checked={featureFlags.feature_public_account_auth}
                      onChange={(e) =>
                        setFeatureFlags((prev) => ({
                          ...prev,
                          feature_public_account_auth: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  {/* 2. Public Community Q&A Read */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
                        <span>{t("settings.featureCommunityReadTitle")}</span>
                        <span className="font-mono text-[11px] text-admin-muted">feature_public_community_read</span>
                      </div>
                      <p className="text-xs text-admin-muted leading-relaxed">
                        {t("settings.featureCommunityReadDesc")}
                      </p>
                    </div>
                    <Switch
                      id="feature_public_community_read"
                      checked={featureFlags.feature_public_community_read}
                      onChange={(e) =>
                        setFeatureFlags((prev) => ({
                          ...prev,
                          feature_public_community_read: e.target.checked,
                          feature_public_community_write: e.target.checked ? prev.feature_public_community_write : false,
                        }))
                      }
                    />
                  </div>

                  {/* 3. Community Write */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
                        <span>{t("settings.featureCommunityWriteTitle")}</span>
                        <span className="font-mono text-[11px] text-admin-muted">feature_public_community_write</span>
                      </div>
                      <p className="text-xs text-admin-muted leading-relaxed">
                        {t("settings.featureCommunityWriteDesc")}
                      </p>
                    </div>
                    <Switch
                      id="feature_public_community_write"
                      checked={featureFlags.feature_public_community_write}
                      disabled={!featureFlags.feature_public_community_read}
                      onChange={(e) =>
                        setFeatureFlags((prev) => ({
                          ...prev,
                          feature_public_community_write: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  {/* 4. Donations */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
                        <span>{t("settings.featureDonationsTitle")}</span>
                        <span className="font-mono text-[11px] text-admin-muted">feature_donations</span>
                      </div>
                      <p className="text-xs text-admin-muted leading-relaxed">
                        {t("settings.featureDonationsDesc")}
                      </p>
                    </div>
                    <Switch
                      id="feature_donations"
                      checked={featureFlags.feature_donations}
                      onChange={(e) =>
                        setFeatureFlags((prev) => ({
                          ...prev,
                          feature_donations: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  {/* 5. Event Registration */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
                        <span>{t("settings.featureEventRegistrationTitle")}</span>
                        <span className="font-mono text-[11px] text-admin-muted">feature_event_registration</span>
                      </div>
                      <p className="text-xs text-admin-muted leading-relaxed">
                        {t("settings.featureEventRegistrationDesc")}
                      </p>
                    </div>
                    <Switch
                      id="feature_event_registration"
                      checked={featureFlags.feature_event_registration}
                      onChange={(e) =>
                        setFeatureFlags((prev) => ({
                          ...prev,
                          feature_event_registration: e.target.checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
  );
}



