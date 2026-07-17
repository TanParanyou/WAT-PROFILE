import type { LocalizedRichText } from "@/lib/rich-text/document";
import type { LocalizedText } from "./common";

export interface SeoMetadata {
  title: LocalizedText;
  description: LocalizedText;
  keywords: LocalizedText;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
}

// About
export interface BuildingItem {
  name: LocalizedText;
  description: LocalizedText;
}

export interface AboutBody {
  intro: {
    heading: LocalizedText;
    description: LocalizedText;
    founded: LocalizedText;
    location: LocalizedText;
  };
  objective: {
    heading: LocalizedText;
    subtitle: LocalizedText;
    content?: LocalizedRichText;
  };
  administration: {
    heading: LocalizedText;
    content?: LocalizedRichText;
  };
  history: {
    heading: LocalizedText;
    content?: LocalizedRichText;
  };
  buildings: {
    heading: LocalizedText;
    items?: BuildingItem[];
  };
  sangha: {
    heading: LocalizedText;
    mission: LocalizedText;
    content?: LocalizedRichText;
  };
}

export interface AboutContentFormData {
  title: LocalizedText;
  description: LocalizedText;
  seo: SeoMetadata;
  body: AboutBody;
  updated_at?: string;
}

// Contact
export interface ContactOpeningHours {
  days: LocalizedText;
  time: LocalizedText;
  notice: LocalizedText;
}

export interface ContactMap {
  name: LocalizedText;
  embed_url: string;
  directions_url: string;
}

export interface ContactTransport {
  parking: LocalizedText;
  public_transport: LocalizedText[];
  driving: LocalizedText;
}

export interface ContactSocials {
  facebook: string;
  instagram: string;
  messenger: string;
  line: string;
  youtube: string;
}

export interface ContactBank {
  bank_name: LocalizedText;
  account_name: LocalizedText;
  account_number: string;
  iban: string;
  bic: string;
}

export interface ContactFormSettings {
  enabled: boolean;
  success_message: LocalizedText;
  privacy_page_link: string;
}

export interface ContactBody {
  address: LocalizedText;
  phone: string;
  email: string;
  opening_hours: ContactOpeningHours;
  map: ContactMap;
  transport: ContactTransport;
  socials: ContactSocials;
  bank: ContactBank;
  contact_form: ContactFormSettings;
}

export interface ContactContentFormData {
  title: LocalizedText;
  description: LocalizedText;
  seo: SeoMetadata;
  body: ContactBody;
  updated_at?: string;
}

// Privacy
export interface PrivacyBody {
  content?: LocalizedRichText;
  last_updated?: string;
}

export interface PrivacyContentFormData {
  title: LocalizedText;
  seo: SeoMetadata;
  body: PrivacyBody;
  updated_at?: string;
}

// Impressum
export interface ImpressumBody {
  organization_name: LocalizedText;
  legal_form: LocalizedText;
  address: LocalizedText;
  phone: string;
  email: string;
  representative: LocalizedText;
  registry_court: LocalizedText;
  registry_number: string;
  vat_id: string;
  content_responsibility: LocalizedText;
}

export interface ImpressumContentFormData {
  title: LocalizedText;
  description: LocalizedText;
  seo: SeoMetadata;
  body: ImpressumBody;
  updated_at?: string;
}
