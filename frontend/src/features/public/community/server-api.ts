import { API_BASE } from "@/services/api";
import {
  communityCategoryListSchema,
  communityQuestionDetailSchema,
  communityQuestionListSchema,
} from "./schema";
import type {
  CommunityCategory,
  CommunityQuestionDetail,
  CommunityQuestionList,
  CommunityQuestionListOptions,
} from "./types";

async function fetchCommunityServer<T>(path: string, schema: { parse: (value: unknown) => T }): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1/public${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Community request failed with ${response.status}`);
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("Invalid Community response envelope");
  }
  return schema.parse(payload.data);
}

export function fetchCommunityCategoriesServer(): Promise<CommunityCategory[]> {
  return fetchCommunityServer("/community/categories", communityCategoryListSchema);
}

export function fetchCommunityQuestionsServer(
  options: CommunityQuestionListOptions = {},
): Promise<CommunityQuestionList> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return fetchCommunityServer(`/community/questions${suffix}`, communityQuestionListSchema);
}

export function fetchCommunityQuestionServer(id: string): Promise<CommunityQuestionDetail> {
  return fetchCommunityServer(`/community/questions/${encodeURIComponent(id)}`, communityQuestionDetailSchema);
}
