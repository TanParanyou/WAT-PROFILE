import { siteConfig } from "@/config/site.config";
import type { LocalizedText } from "@/types/common";
import type { EventsView, PublicSiteSettings } from "./types";

const readLocalized = (raw: Record<string, string>, prefix: string, fallback: LocalizedText): LocalizedText => ({
  th: raw[`${prefix}_th`] || fallback.th,
  en: raw[`${prefix}_en`] || fallback.en,
  de: raw[`${prefix}_de`] || fallback.de,
});

export function getFallbackPublicSiteSettings(): PublicSiteSettings {
  return {
    siteName: siteConfig.siteName,
    description: {
      th: siteConfig.seo.defaultDescription,
      en: siteConfig.seo.defaultDescription,
      de: siteConfig.seo.defaultDescription,
    },
    address: siteConfig.contact.address ?? { th: "", en: "", de: "" },
    phone: siteConfig.contact.phone ?? "",
    email: siteConfig.contact.email ?? "",
    social: {
      facebook: siteConfig.social.facebook ?? "",
      youtube: siteConfig.social.youtube ?? "",
      instagram: siteConfig.social.instagram ?? "",
      line: siteConfig.social.line ?? "",
    },
    logoUrl: siteConfig.logo.light,
    heroBgUrl: "/images/hero-bg.png",
    socialSidebarPosition: siteConfig.layout.socialSidebarPosition,
    defaultEventsView: "calendar",
  };
}

export function mapPublicSiteSettings(raw: Record<string, string>, fallback = getFallbackPublicSiteSettings()): PublicSiteSettings {
  const position = raw.social_sidebar_position === "right" ? "right" : raw.social_sidebar_position === "left" ? "left" : fallback.socialSidebarPosition;
  const defaultEventsView: EventsView = raw.events_default_view === "list" ? "list" : raw.events_default_view === "calendar" ? "calendar" : fallback.defaultEventsView;

  return {
    siteName: readLocalized(raw, "site_name", fallback.siteName),
    description: readLocalized(raw, "site_description", fallback.description),
    address: readLocalized(raw, "contact_address", fallback.address),
    phone: raw.contact_phone || fallback.phone,
    email: raw.contact_email || fallback.email,
    social: {
      facebook: raw.facebook_url || fallback.social.facebook,
      youtube: raw.youtube_url || fallback.social.youtube,
      instagram: raw.instagram_url || fallback.social.instagram,
      line: raw.line_url || fallback.social.line,
    },
    logoUrl: (raw.logo_url && raw.logo_url.trim()) ? raw.logo_url.trim() : fallback.logoUrl,
    heroBgUrl: (raw.hero_bg_url && raw.hero_bg_url.trim()) ? raw.hero_bg_url.trim() : fallback.heroBgUrl,
    socialSidebarPosition: position,
    defaultEventsView,
  };
}
