import axios from "axios";
import { publicApi } from "@/services/publicService";
import type { ApiSuccess } from "@/features/public/shared/api-types";

export interface PublicDonationCategory {
  id: number;
  name: {
    th?: string;
    en?: string;
    de?: string;
  };
}

export interface SelfReportedDonationPayload {
  amount: number;
  currency: "EUR";
  donation_date: string;
  donation_time: string;
  donation_method: "bank_transfer" | "paypal";
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  category_id?: number | null;
  locale: "th" | "en" | "de";
  receipt_requested: boolean;
  privacy_acknowledged: boolean;
  proof: File;
}

export class PublicDonationApiError extends Error {
  readonly fields: Record<string, string>;
  readonly status?: number;

  constructor(message: string, fields: Record<string, string>, status?: number) {
    super(message);
    this.name = "PublicDonationApiError";
    this.fields = fields;
    this.status = status;
  }
}

export function isPublicDonationApiError(error: unknown): error is PublicDonationApiError {
  return error instanceof PublicDonationApiError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapData<T>(payload: unknown): T {
  if (!isRecord(payload) || payload.success !== true || !("data" in payload)) {
    throw new Error("Invalid public donation response");
  }
  return payload.data as T;
}

function isDonationCategory(value: unknown): value is PublicDonationCategory {
  if (!isRecord(value) || typeof value.id !== "number" || !isRecord(value.name)) return false;
  const name = value.name;
  return ["th", "en", "de"].every((locale) => name[locale] === undefined || typeof name[locale] === "string");
}

function toDonationApiError(error: unknown): PublicDonationApiError {
  if (axios.isAxiosError(error)) {
    const payload: unknown = error.response?.data;
    if (isRecord(payload)) {
      const fields = isRecord(payload.fields)
        ? Object.fromEntries(Object.entries(payload.fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
        : {};
      const message = typeof payload.error === "string" ? payload.error : "Unable to submit donation";
      return new PublicDonationApiError(message, fields, error.response?.status);
    }
    return new PublicDonationApiError("Unable to submit donation", {}, error.response?.status);
  }
  if (error instanceof Error) return new PublicDonationApiError(error.message, {});
  return new PublicDonationApiError("Unable to submit donation", {});
}

export async function getPublicDonationCategories(): Promise<PublicDonationCategory[]> {
  const response = await publicApi.get<ApiSuccess<unknown>>("/donation-categories");
  const data = unwrapData<unknown>(response.data);
  if (!Array.isArray(data) || !data.every(isDonationCategory)) {
    throw new Error("Invalid public donation categories response");
  }
  return data;
}

export async function submitSelfReportedDonation(payload: SelfReportedDonationPayload): Promise<unknown> {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    form.append(key, value instanceof File ? value : String(value));
  }

  try {
    const response = await publicApi.post<ApiSuccess<unknown>>("/donations", form, { headers: { "Content-Type": "multipart/form-data" } });
    return unwrapData(response.data);
  } catch (error) {
    throw toDonationApiError(error);
  }
}
