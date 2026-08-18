import adminApi from "./adminApi";

export interface AiTranslateRequest {
  text: string;
  source_lang?: "th" | "en" | "de";
  target_langs?: ("th" | "en" | "de")[];
}

export interface AiTranslateResponse {
  translations: Record<"th" | "en" | "de", string>;
}

export const aiTranslationService = {
  translateDraft: async (payload: AiTranslateRequest): Promise<AiTranslateResponse> => {
    const res = await adminApi.post<{ success: boolean; data: AiTranslateResponse }>(
      "/admin/ai/translate",
      payload
    );
    return res.data.data;
  },
};
