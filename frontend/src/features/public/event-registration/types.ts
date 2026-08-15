import type { AccountLocale } from "../account/types";

export type RegistrationLocale = AccountLocale;
export type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "attended";
export type RegistrationType = "guest" | "account" | "member";
export type AvailabilityState = "disabled" | "closed" | "started" | "full" | "available";
export const MAX_REGISTRATION_PARTICIPANTS = 10;

export type RegistrationErrorCode =
  | "REGISTRATION_DISABLED"
  | "REGISTRATION_CLOSED"
  | "EVENT_FULL"
  | "ALREADY_REGISTERED"
  | "GROUP_LIMIT_EXCEEDED"
  | "VALIDATION_ERROR"
  | "MANAGE_TOKEN_INVALID"
  | "MANAGE_TOKEN_EXPIRED"
  | "REGISTRATION_NOT_EDITABLE"
  | "REGISTRATION_NOT_FOUND"
  | "REGISTRATION_UNAUTHORIZED"
  | "REGISTRATION_CONFLICT"
  | "REGISTRATION_UNKNOWN";

export interface RegistrationAvailability {
  enabled: boolean;
  deadline: string | null;
  max_participants: number | null;
  reserved_participants: number;
  remaining_capacity: number | null;
  availability: AvailabilityState;
  can_register: boolean;
  unavailable_code: RegistrationErrorCode | null;
}

export interface RegistrationContact {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface RegistrationParticipantInput {
  id?: number;
  first_name: string;
  last_name: string;
  dietary_restrictions: string;
  special_needs: string;
  additional_notes: string;
}

export interface RegistrationParticipant extends RegistrationParticipantInput {
  id: number;
  attendance_status: "registered" | "attended" | "cancelled";
  attended_at?: string | null;
  cancelled_at?: string | null;
}

export interface RegistrationEventSummary {
  id: number;
  slug: string;
  title: { th: string; en: string; de: string };
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
}

export interface EventRegistrationDetail {
  id: number;
  registration_type: RegistrationType;
  registration_status: RegistrationStatus;
  confirmation_code: string;
  contact: RegistrationContact;
  participants: readonly RegistrationParticipant[];
  participant_count: number;
  event: RegistrationEventSummary;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
}

export interface AdminEventRegistrationDetail extends EventRegistrationDetail {
  user_id?: string | null;
  member_id?: number | null;
  privacy_notice_version?: string;
  privacy_consent_at?: string | null;
  cancellation_reason?: string;
  cancellation_origin?: string;
}

export type EventRegistrationListItem = EventRegistrationDetail;

export interface RegistrationCreateInput {
  locale: RegistrationLocale;
  contact: RegistrationContact;
  participants: readonly RegistrationParticipantInput[];
  privacy_notice_version: string;
  privacy_consent: boolean;
}

export interface RegistrationUpdateInput {
  locale: RegistrationLocale;
  contact: RegistrationContact;
  participants: readonly RegistrationParticipantInput[];
}

export interface RegistrationManageInput extends RegistrationUpdateInput {
  token: string;
}

export interface RegistrationCancelInput {
  token?: string;
  reason?: string;
}

export interface AdminRegistrationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: readonly RegistrationStatus[];
  event_id?: readonly number[];
  registration_type?: readonly RegistrationType[];
}

export interface AdminRegistrationPage {
  items: readonly EventRegistrationListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface RegistrationFieldError {
  field: string;
  message: string;
}

export interface RegistrationApiError extends Error {
  code: RegistrationErrorCode;
  status: number;
  fieldErrors: readonly RegistrationFieldError[];
  traceId?: string;
}

export interface RegistrationFormMessages {
  required: string;
  emailInvalid: string;
  maxParticipants: string;
  privacyRequired: string;
}
