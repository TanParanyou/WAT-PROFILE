import { publicApi } from "@/services/publicService";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";
import type {
  ChatMessageRequestDto,
  ChatMessageResponseDto,
  QuickQuestionDto,
} from "./types";

export async function sendChatMessage(
  payload: ChatMessageRequestDto,
): Promise<ChatMessageResponseDto> {
  const response = await publicApi.post<ApiSuccess<ChatMessageResponseDto>>(
    "/chatbot/message",
    payload,
  );
  return unwrapApiData(response.data);
}

export async function fetchQuickQuestions(
  locale?: string,
): Promise<QuickQuestionDto[]> {
  const response = await publicApi.get<ApiSuccess<QuickQuestionDto[]>>(
    "/chatbot/quick-questions",
    {
      params: locale ? { locale } : undefined,
    },
  );
  return unwrapApiData(response.data);
}
