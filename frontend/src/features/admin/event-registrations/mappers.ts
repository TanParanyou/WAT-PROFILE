import type { EventRegistrationListItem } from "@/features/public/event-registration/types";

export interface AdminRegistrationTableRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  event_title: string;
  status: string;
  created_at: string;
  participant_count: number;
  confirmation_code: string;
  dietary_restrictions?: string;
}

export function toAdminRegistrationTableRow(item: EventRegistrationListItem, locale: "th" | "en" | "de" = "th"): AdminRegistrationTableRow {
  const firstName = item.contact?.first_name || "";
  const lastName = item.contact?.last_name || "";
  const name = `${firstName} ${lastName}`.trim() || "-";
  const eventTitle = item.event?.title?.[locale] || item.event?.title?.th || item.event?.title?.en || item.event?.title?.de || "-";
  const dietary = item.participants?.map((p) => p.dietary_restrictions).filter(Boolean).join(", ") || "";
  return {
    id: item.id,
    name,
    email: item.contact?.email || "-",
    phone: item.contact?.phone || "-",
    event_title: eventTitle,
    status: item.registration_status || "pending",
    created_at: item.created_at || "",
    participant_count: item.participant_count || 0,
    confirmation_code: item.confirmation_code || "-",
    dietary_restrictions: dietary,
  };
}
