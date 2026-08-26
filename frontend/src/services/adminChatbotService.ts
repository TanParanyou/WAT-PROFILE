import adminApi from "./adminApi";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  ChatbotKnowledgeBaseItem,
  ChatbotKnowledgeBaseInput,
  ChatbotListOptions,
} from "@/types/chatbot";

export const adminChatbotService = {
  async getKnowledgeBaseList(
    options: ChatbotListOptions = {},
  ): Promise<PaginatedResponse<ChatbotKnowledgeBaseItem>> {
    const params = {
      page: options.page ?? 1,
      limit: options.limit ?? 10,
      ...(options.search ? { search: options.search } : {}),
      ...(options.category && options.category !== "all"
        ? { category: options.category }
        : {}),
      ...(options.active_only ? { active_only: true } : {}),
    };
    const res = await adminApi.get<PaginatedResponse<ChatbotKnowledgeBaseItem>>(
      "/admin/chatbot/knowledge-base",
      { params },
    );
    return res.data;
  },

  async getKnowledgeBaseById(id: number): Promise<ChatbotKnowledgeBaseItem> {
    const res = await adminApi.get<ApiResponse<ChatbotKnowledgeBaseItem>>(
      `/admin/chatbot/knowledge-base/${id}`,
    );
    if (!res.data.data) {
      throw new Error(res.data.error || "Failed to fetch knowledge base item");
    }
    return res.data.data;
  },

  async createKnowledgeBase(
    data: ChatbotKnowledgeBaseInput,
  ): Promise<ChatbotKnowledgeBaseItem> {
    const res = await adminApi.post<ApiResponse<ChatbotKnowledgeBaseItem>>(
      "/admin/chatbot/knowledge-base",
      data,
    );
    if (!res.data.data) {
      throw new Error(res.data.error || "Failed to create knowledge base item");
    }
    return res.data.data;
  },

  async updateKnowledgeBase(
    id: number,
    data: ChatbotKnowledgeBaseInput,
  ): Promise<ChatbotKnowledgeBaseItem> {
    const res = await adminApi.put<ApiResponse<ChatbotKnowledgeBaseItem>>(
      `/admin/chatbot/knowledge-base/${id}`,
      data,
    );
    if (!res.data.data) {
      throw new Error(res.data.error || "Failed to update knowledge base item");
    }
    return res.data.data;
  },

  async toggleActive(id: number): Promise<ChatbotKnowledgeBaseItem> {
    const res = await adminApi.patch<ApiResponse<ChatbotKnowledgeBaseItem>>(
      `/admin/chatbot/knowledge-base/${id}/toggle-active`,
    );
    if (!res.data.data) {
      throw new Error(res.data.error || "Failed to toggle status");
    }
    return res.data.data;
  },

  async deleteKnowledgeBase(id: number): Promise<void> {
    await adminApi.delete(`/admin/chatbot/knowledge-base/${id}`);
  },
};
