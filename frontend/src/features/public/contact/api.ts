import axios from "axios";
import { publicApi } from "@/services/publicService";
import type { ContactSubmitInput, ContactErrorCode, ContactErrorFields, PublicContactApiError } from "./types";
import { PublicContactApiError as PublicContactApiErrorClass } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFields(value: unknown): ContactErrorFields {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function toCode(value: unknown): ContactErrorCode {
  return value === "CONTACT_RATE_LIMITED" ? value : "CONTACT_UNKNOWN";
}

function toRetryAfterSeconds(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return 0;
}

function toHeaderRetryAfter(value: unknown): number {
  if (!isRecord(value)) return 0;
  return toRetryAfterSeconds(value["retry-after"] ?? value["Retry-After"]);
}

function toPublicContactApiError(error: unknown): PublicContactApiError {
  if (axios.isAxiosError(error)) {
    const payload: unknown = error.response?.data;
    const fields = isRecord(payload) ? toFields(payload.fields) : {};
    const message = isRecord(payload) && typeof payload.error === "string" ? payload.error : "Unable to receive message";
    const code = isRecord(payload) ? toCode(payload.code) : "CONTACT_UNKNOWN";
    const retryAfterSeconds = isRecord(payload) && "retry_after_seconds" in payload
      ? toRetryAfterSeconds(payload.retry_after_seconds)
      : toHeaderRetryAfter(error.response?.headers);
    const traceId = isRecord(payload) && typeof payload.trace_id === "string" ? payload.trace_id : undefined;
    return new PublicContactApiErrorClass(message, {
      code,
      fields,
      status: error.response?.status ?? 0,
      retryAfterSeconds,
      traceId,
    });
  }
  if (error instanceof Error) {
    return new PublicContactApiErrorClass(error.message, {
      code: "CONTACT_UNKNOWN",
      fields: {},
      status: 0,
      retryAfterSeconds: 0,
    });
  }
  return new PublicContactApiErrorClass("Unable to receive message", {
    code: "CONTACT_UNKNOWN",
    fields: {},
    status: 0,
    retryAfterSeconds: 0,
  });
}

export async function submitPublicContact(input: ContactSubmitInput): Promise<void> {
  try {
    const response = await publicApi.post<unknown>("/contact", input);
    if (!isRecord(response.data) || response.data.success !== true) {
      throw new Error("Invalid public contact response");
    }
  } catch (error: unknown) {
    if (error instanceof PublicContactApiErrorClass) throw error;
    throw toPublicContactApiError(error);
  }
}

export { toPublicContactApiError };
