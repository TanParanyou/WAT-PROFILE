export type ContactLocale = "th" | "en" | "de";

export type ContactField = "name" | "email" | "subject" | "message" | "locale";

export interface ContactSubmitInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: ContactLocale;
  website: string;
}

export type ContactErrorCode = "CONTACT_RATE_LIMITED" | "CONTACT_UNKNOWN";

export interface ContactErrorFields {
  [field: string]: string;
}

export interface PublicContactApiErrorOptions {
  code: ContactErrorCode;
  fields: ContactErrorFields;
  status: number;
  retryAfterSeconds: number;
  traceId?: string;
}

export class PublicContactApiError extends Error {
  readonly code: ContactErrorCode;
  readonly fields: ContactErrorFields;
  readonly status: number;
  readonly retryAfterSeconds: number;
  readonly traceId?: string;

  constructor(message: string, options: PublicContactApiErrorOptions) {
    super(message);
    this.name = "PublicContactApiError";
    this.code = options.code;
    this.fields = options.fields;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.traceId = options.traceId;
  }
}

export function isPublicContactApiError(error: unknown): error is PublicContactApiError {
  return error instanceof PublicContactApiError;
}
