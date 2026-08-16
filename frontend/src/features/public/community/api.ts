import { publicApi } from "@/services/publicService";
import type { ApiSuccess } from "@/features/public/shared/api-types";
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

function toQuery(options: CommunityQuestionListOptions): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(options).filter((entry): entry is [string, string | number] =>
      typeof entry[1] === "string" || typeof entry[1] === "number",
    ),
  );
}

export async function fetchCommunityCategories(): Promise<CommunityCategory[]> {
  const response = await publicApi.get<ApiSuccess<unknown>>("/community/categories");
  return communityCategoryListSchema.parse(response.data.data);
}

export async function fetchCommunityQuestions(
  options: CommunityQuestionListOptions = {},
): Promise<CommunityQuestionList> {
  const response = await publicApi.get<ApiSuccess<unknown>>("/community/questions", {
    params: Object.keys(toQuery(options)).length > 0 ? toQuery(options) : undefined,
  });
  return communityQuestionListSchema.parse(response.data.data);
}

export async function fetchCommunityQuestion(id: string): Promise<CommunityQuestionDetail> {
  const response = await publicApi.get<ApiSuccess<unknown>>(`/community/questions/${id}`);
  return communityQuestionDetailSchema.parse(response.data.data);
}
