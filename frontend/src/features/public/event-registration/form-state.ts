import type { RegistrationFormValues } from "./schema";
import type { RegistrationLocale } from "./types";

export const EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION =
  process.env.NEXT_PUBLIC_EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION ?? "2026-08";

export function createRegistrationDefaults(locale: RegistrationLocale): RegistrationFormValues {
  return {
    locale,
    contact: { first_name: "", last_name: "", email: "", phone: "" },
    participants: [{ first_name: "", last_name: "", dietary_restrictions: "", special_needs: "", additional_notes: "" }],
    privacy_notice_version: EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION,
    privacy_consent: false,
  };
}

export function managementTokenFromHash(hash: string): string | null {
  const normalized = hash.replace(/^#/, "");
  const params = new URLSearchParams(normalized);
  const token = params.get("token")?.trim();
  return token || null;
}

export function managementUrl(token: string): string {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/events/registrations/manage#token=${encodeURIComponent(token)}`;
}
