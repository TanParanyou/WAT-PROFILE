import { z } from "zod";
import type {
  EventRegistrationDetail,
  RegistrationApiError,
  RegistrationErrorCode,
  RegistrationFormMessages,
} from "./types";
import { MAX_REGISTRATION_PARTICIPANTS } from "./types";

const participantShape = {
  id: z.number().int().positive().optional(),
  first_name: z.string(),
  last_name: z.string(),
  dietary_restrictions: z.string(),
  special_needs: z.string(),
  additional_notes: z.string(),
};

export function createRegistrationFormSchema(messages: RegistrationFormMessages) {
  const requiredText = z.string().trim().min(1, messages.required);
  const participant = z.object(participantShape).strict();
  return z
    .object({
      locale: z.enum(["th", "en", "de"]),
      contact: z
        .object({
          first_name: requiredText,
          last_name: requiredText,
          email: z.string().trim().toLowerCase().email(messages.emailInvalid),
          phone: z.string().trim(),
        })
        .strict(),
      participants: z.array(participant).min(1, messages.required).max(MAX_REGISTRATION_PARTICIPANTS, messages.maxParticipants),
      privacy_notice_version: requiredText,
      privacy_consent: z.boolean().refine((value) => value, messages.privacyRequired),
    })
    .strict();
}

export type RegistrationFormValues = z.infer<ReturnType<typeof createRegistrationFormSchema>>;

export const registrationErrorCodes: readonly RegistrationErrorCode[] = [
  "REGISTRATION_DISABLED",
  "REGISTRATION_CLOSED",
  "EVENT_FULL",
  "ALREADY_REGISTERED",
  "GROUP_LIMIT_EXCEEDED",
  "VALIDATION_ERROR",
  "MANAGE_TOKEN_INVALID",
  "MANAGE_TOKEN_EXPIRED",
  "REGISTRATION_NOT_EDITABLE",
  "REGISTRATION_NOT_FOUND",
  "REGISTRATION_UNAUTHORIZED",
  "REGISTRATION_CONFLICT",
  "REGISTRATION_RATE_LIMITED",
  "REGISTRATION_UNKNOWN",
];

function isRegistrationErrorCode(value: string): value is RegistrationErrorCode {
  return registrationErrorCodes.includes(value as RegistrationErrorCode);
}

export function isEventRegistrationDetail(value: unknown): value is EventRegistrationDetail {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "number" && typeof candidate.confirmation_code === "string" && Array.isArray(candidate.participants);
}

export function parseRegistrationDetail(value: unknown): EventRegistrationDetail {
  if (!isEventRegistrationDetail(value)) throw new Error("Invalid registration response");
  return value;
}

export function toRegistrationApiError(error: unknown): RegistrationApiError {
  if (isRegistrationApiError(error)) return error;
  const maybeAxios = error as { response?: { status?: unknown; data?: unknown }; message?: unknown };
  const response = maybeAxios && typeof maybeAxios === "object" ? maybeAxios.response : undefined;
  const payload = response && typeof response === "object" ? response.data : undefined;
  const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const codeValue = typeof body.code === "string" && isRegistrationErrorCode(body.code) ? body.code : "REGISTRATION_UNKNOWN";
  const fieldContainer = body.fields ?? body.field_errors;
  const fieldErrors = Array.isArray(fieldContainer)
    ? fieldContainer.flatMap((item): RegistrationApiError["fieldErrors"] => {
        if (typeof item !== "object" || item === null) return [];
        const field = (item as Record<string, unknown>).field;
        const message = (item as Record<string, unknown>).message;
        return typeof field === "string" && typeof message === "string" ? [{ field, message }] : [];
      })
    : typeof fieldContainer === "object" && fieldContainer !== null
      ? Object.entries(fieldContainer as Record<string, unknown>).flatMap(([field, message]) => typeof message === "string" ? [{ field, message }] : [])
      : [];
  const status = response && typeof response.status === "number" ? response.status : 0;
  const message = typeof body.error === "string" ? body.error : error instanceof Error ? error.message : "Registration request failed";
  const result = new Error(message) as RegistrationApiError;
  result.name = "RegistrationApiError";
  result.code = codeValue;
  result.status = status;
  result.fieldErrors = fieldErrors;
  result.traceId = typeof body.trace_id === "string" ? body.trace_id : undefined;
  return result;
}

function isRegistrationApiError(error: unknown): error is RegistrationApiError {
  if (!(error instanceof Error) || typeof error !== "object") return false;
  const candidate = error as Partial<RegistrationApiError>;
  return typeof candidate.code === "string" && isRegistrationErrorCode(candidate.code) && typeof candidate.status === "number" && Array.isArray(candidate.fieldErrors);
}
