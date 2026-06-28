import type { LocalizedText } from "./common";

export interface SocialLinks {
  facebook?: string;
  messenger?: string;
  instagram?: string;
  line?: string;
  youtube?: string;
}

export interface OpeningHours {
  days: LocalizedText;
  time: string;
  remark?: LocalizedText;
}

export interface TransportInfo {
  parking?: LocalizedText;
  directionsUrl?: string;
  public?: Array<{
    icon: "train" | "bus" | "walk" | "car";
    text: LocalizedText;
  }>;
  car?: {
    text: LocalizedText;
  };
}

export interface MapSettings {
  embedUrl?: string;
  locationName?: string;
}

export interface BankAccountSettings {
  name: string;
  account?: string;
  iban?: string;
  bic?: string;
}

export interface GlobalContactSettings {
  address: LocalizedText;
  phone: string;
  email: string;
  social: SocialLinks;
  openingHours: OpeningHours;
  transport: TransportInfo;
  map: MapSettings;
  bank: BankAccountSettings;
}

export interface SiteSettings {
  contact: GlobalContactSettings;
}
