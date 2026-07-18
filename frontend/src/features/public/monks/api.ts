import { publicApi } from "@/services/publicService";
import type { ApiSuccess } from "../shared/api-types";
import { unwrapApiData } from "../shared/api-types";
import type { PublicMonkDto } from "./types";

export async function fetchPublicMonks(): Promise<PublicMonkDto[]> {
  const response = await publicApi.get<ApiSuccess<PublicMonkDto[]>>("/monks");
  return unwrapApiData(response.data);
}

export async function fetchPublicMonkBySlug(slug: string): Promise<PublicMonkDto> {
  const response = await publicApi.get<ApiSuccess<PublicMonkDto>>(`/monks/${slug}`);
  return unwrapApiData(response.data);
}
