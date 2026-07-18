export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message?: string;
}

export interface LocalizedTextDto {
  th: string;
  en: string;
  de: string;
}

export type { LocalizedRichText as LocalizedRichTextDto } from "@/lib/rich-text/document";

export function unwrapApiData<T>(payload: ApiSuccess<T>): T {
  return payload.data;
}
