import { publicApi } from "@/services/publicService";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";

export async function fetchPublicSiteSettings(): Promise<Record<string, string>> {
  const response = await publicApi.get<ApiSuccess<Record<string, string>>>("/settings");
  return unwrapApiData(response.data);
}
