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
}

export function toAdminRegistrationTableRow(item: EventRegistrationListItem, locale: "th" | "en" | "de" = "th"): AdminRegistrationTableRow {
  return {
    id: item.id,
    name: `${item.contact.first_name} ${item.contact.last_name}`.trim(),
    email: item.contact.email,
    phone: item.contact.phone,
    event_title: item.event.title[locale],
    status: item.registration_status,
    created_at: item.created_at,
    participant_count: item.participant_count,
  };
}
