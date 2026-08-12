import type { LocalizedText } from "@/types/common";

export type EventsView = "calendar" | "list";

export interface PublicSiteSettings {
  siteName: LocalizedText;
  description: LocalizedText;
  address: LocalizedText;
  phone: string;
  email: string;
  social: {
    facebook: string;
    youtube: string;
    instagram: string;
    line: string;
  };
  logoUrl: string;
  heroBgUrl: string;
  socialSidebarPosition: "left" | "right";
  defaultEventsView: EventsView;
}
