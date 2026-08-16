import axios from "axios";
import { publicApi } from "@/services/publicService";
import { accountApi } from "@/features/public/account/api";
import type { ApiSuccess } from "@/features/public/shared/api-types";
import {
  communityCategoryListSchema,
  communityAcceptanceSchema,
  communityAnswerMutationSchema,
  communityCommentMutationSchema,
  communityHelpfulSchema,
  communityMemberActivitySchema,
  communityQuestionMutationSchema,
  communityQuestionDetailSchema,
  communityQuestionListSchema,
  communityReportSchema,
  communityNotificationPageSchema,
  communityNotificationPreferencesSchema,
  communityViewerStateSchema,
} from "./schema";
import type {
  CommunityCategory,
  CommunityAcceptanceResult,
  CommunityAnswerMutation,
  CommunityCommentMutation,
  CommunityHelpfulResult,
  CommunityLocale,
  CommunityMemberActivity,
  CommunityQuestionMutation,
  CommunityQuestionDetail,
  CommunityQuestionList,
  CommunityQuestionListOptions,
  CommunityReport,
  CommunityReportReason,
  CommunityNotificationPage,
  CommunityNotificationPreferences,
  CommunityViewerState,
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

function parseCommunityEnvelope<T>(payload: unknown, schema: { parse: (value: unknown) => T }): T {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("Invalid Community response envelope");
  }
  return schema.parse(payload.data);
}

export interface CommunityApiError {
  code: string;
  message: string;
  status: number;
  fieldErrors: Array<{ field: string; message: string }>;
  retryAfterSeconds: number;
  currentVersion?: number;
}

export function toCommunityApiError(error: unknown): CommunityApiError {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (typeof payload === "object" && payload !== null) {
      const candidate = payload as Record<string, unknown>;
      const details = typeof candidate.details === "object" && candidate.details !== null ? candidate.details as Record<string, unknown> : null;
      const fields = Array.isArray(candidate.fields) ? candidate.fields : [];
      return {
        code: typeof candidate.code === "string" ? candidate.code : "COMMUNITY_UNKNOWN",
        message: typeof candidate.error === "string" ? candidate.error : error.message,
        status: error.response?.status ?? 0,
        fieldErrors: fields.flatMap((field) => {
          if (typeof field !== "object" || field === null) return [];
          const value = field as Record<string, unknown>;
          return typeof value.field === "string" && typeof value.message === "string" ? [{ field: value.field, message: value.message }] : [];
        }),
        retryAfterSeconds: typeof candidate.retry_after_seconds === "number" ? candidate.retry_after_seconds : 0,
        currentVersion: details && typeof details.current_version === "number" ? details.current_version : undefined,
      };
    }
  }
  return { code: "COMMUNITY_UNKNOWN", message: error instanceof Error ? error.message : "Community request failed", status: 0, fieldErrors: [], retryAfterSeconds: 0 };
}

export async function createCommunityQuestion(input: {
  category_id: string;
  locale: CommunityLocale;
  title: string;
  body: CommunityQuestionMutation["body"];
}, idempotencyKey: string): Promise<CommunityQuestionMutation> {
  const response = await accountApi.post<unknown>("/accounts/community/questions", input, { headers: { "Idempotency-Key": idempotencyKey } });
  return parseCommunityEnvelope(response.data, communityQuestionMutationSchema);
}

export async function fetchOwnedCommunityQuestion(id: string): Promise<CommunityQuestionMutation> {
  const response = await accountApi.get<unknown>(`/accounts/community/questions/${encodeURIComponent(id)}`);
  return parseCommunityEnvelope(response.data, communityQuestionMutationSchema);
}

export async function updateCommunityQuestion(id: string, input: { title: string; body: CommunityQuestionMutation["body"]; expected_version: number }): Promise<CommunityQuestionMutation> {
  const response = await accountApi.patch<unknown>(`/accounts/community/questions/${encodeURIComponent(id)}`, input);
  return parseCommunityEnvelope(response.data, communityQuestionMutationSchema);
}

export async function deleteCommunityQuestion(id: string, version: number): Promise<void> {
  await accountApi.delete<unknown>(`/accounts/community/questions/${encodeURIComponent(id)}`, { params: { version } });
}

export async function fetchCommunityActivity(): Promise<CommunityMemberActivity> {
  const response = await accountApi.get<unknown>("/accounts/community/activity");
  return parseCommunityEnvelope(response.data, communityMemberActivitySchema);
}

export async function fetchCommunityViewerState(id: string): Promise<CommunityViewerState> {
  const response = await accountApi.get<unknown>(`/accounts/community/questions/${encodeURIComponent(id)}/viewer`);
  return parseCommunityEnvelope(response.data, communityViewerStateSchema);
}

export async function createCommunityAnswer(questionID: string, input: { body: CommunityAnswerMutation["answer"]["body"] }, idempotencyKey: string): Promise<CommunityAnswerMutation> {
  const response = await accountApi.post<unknown>(`/accounts/community/questions/${encodeURIComponent(questionID)}/answers`, input, { headers: { "Idempotency-Key": idempotencyKey } });
  return parseCommunityEnvelope(response.data, communityAnswerMutationSchema);
}

export async function updateCommunityAnswer(answerID: string, input: { body: CommunityAnswerMutation["answer"]["body"]; expected_version: number }): Promise<CommunityAnswerMutation> {
  const response = await accountApi.patch<unknown>(`/accounts/community/answers/${encodeURIComponent(answerID)}`, input);
  return parseCommunityEnvelope(response.data, communityAnswerMutationSchema);
}

export async function createCommunityComment(questionID: string, input: { answer_id?: string; body: CommunityCommentMutation["comment"]["body"] }, idempotencyKey: string): Promise<CommunityCommentMutation> {
  const response = await accountApi.post<unknown>(`/accounts/community/questions/${encodeURIComponent(questionID)}/comments`, input, { headers: { "Idempotency-Key": idempotencyKey } });
  return parseCommunityEnvelope(response.data, communityCommentMutationSchema);
}

export async function updateCommunityComment(commentID: string, input: { body: CommunityCommentMutation["comment"]["body"]; expected_version: number }): Promise<CommunityCommentMutation> {
  const response = await accountApi.patch<unknown>(`/accounts/community/comments/${encodeURIComponent(commentID)}`, input);
  return parseCommunityEnvelope(response.data, communityCommentMutationSchema);
}

export async function acceptCommunityAnswer(answerID: string, expectedVersion: number): Promise<CommunityAcceptanceResult> {
  const response = await accountApi.post<unknown>(`/accounts/community/answers/${encodeURIComponent(answerID)}/accept`, { expected_version: expectedVersion });
  return parseCommunityEnvelope(response.data, communityAcceptanceSchema);
}

export async function setCommunityHelpful(answerID: string, helpful: boolean): Promise<CommunityHelpfulResult> {
  const method = helpful ? "put" : "delete";
  const response = await accountApi.request<unknown>({ method, url: `/accounts/community/answers/${encodeURIComponent(answerID)}/helpful` });
  return parseCommunityEnvelope(response.data, communityHelpfulSchema);
}

export async function createCommunityReport(input: { question_id?: string; answer_id?: string; comment_id?: string; reason: CommunityReportReason; details?: string }): Promise<CommunityReport> {
  const response = await accountApi.post<unknown>("/accounts/community/reports", input);
  return parseCommunityEnvelope(response.data, communityReportSchema);
}

export async function fetchCommunityNotifications(options: { unread_only?: boolean; limit?: number; cursor?: string } = {}): Promise<CommunityNotificationPage> {
  const response = await accountApi.get<unknown>("/accounts/community/notifications", { params: options });
  return parseCommunityEnvelope(response.data, communityNotificationPageSchema);
}

export async function markCommunityNotificationRead(id: string): Promise<void> {
  await accountApi.post(`/accounts/community/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllCommunityNotificationsRead(): Promise<void> {
  await accountApi.post("/accounts/community/notifications/read-all");
}

export async function fetchCommunityNotificationPreferences(): Promise<CommunityNotificationPreferences> {
  const response = await accountApi.get<unknown>("/accounts/community/notifications/preferences");
  return parseCommunityEnvelope(response.data, communityNotificationPreferencesSchema);
}

export async function updateCommunityNotificationPreferences(input: CommunityNotificationPreferences): Promise<void> {
  await accountApi.put("/accounts/community/notifications/preferences", input);
}
