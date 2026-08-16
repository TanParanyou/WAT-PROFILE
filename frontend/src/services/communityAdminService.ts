import adminApi from "./adminApi";
import type { ApiResponse } from "@/types/api";
import { adminCommunityCategoryListSchema, adminCommunityCategorySchema, adminCommunityQueueSchema } from "@/features/admin-community/schema";
import type { AdminCategoryInput, AdminCommunityCategory, AdminCommunityQueue } from "@/features/admin-community/types";

function unwrap<T>(response: ApiResponse<unknown>, schema: { parse(value: unknown): T }): T {
  if (!response.success) throw new Error("Community Admin request failed");
  return schema.parse(response.data);
}

export const communityAdminService = {
  async queue(limit = 50): Promise<AdminCommunityQueue> {
    const response = await adminApi.get<ApiResponse<unknown>>("/admin/community/queue", { params: { limit } });
    return unwrap(response.data, adminCommunityQueueSchema);
  },
  async categories(): Promise<AdminCommunityCategory[]> {
    const response = await adminApi.get<ApiResponse<unknown>>("/admin/community/categories");
    return unwrap(response.data, adminCommunityCategoryListSchema);
  },
  async saveCategory(input: AdminCategoryInput, id?: string): Promise<AdminCommunityCategory> {
    const response = id ? await adminApi.put<ApiResponse<unknown>>(`/admin/community/categories/${id}`, input) : await adminApi.post<ApiResponse<unknown>>("/admin/community/categories", input);
    return unwrap(response.data, adminCommunityCategorySchema);
  },
  async deleteCategory(id: string, reason: string): Promise<void> {
    await adminApi.delete(`/admin/community/categories/${id}`, { data: { reason } });
  },
  async reorderCategories(ids: string[]): Promise<void> {
    await adminApi.put("/admin/community/categories/reorder", { ids });
  },
  async moderate(target: AdminCommunityQueue["items"][number]["target_type"], id: string, action: string, reason: string): Promise<void> {
    await adminApi.post(`/admin/community/moderate/${target}/${id}`, { action, reason });
  },
  async decideReport(id: string, decision: "resolve" | "dismiss", reason: string): Promise<void> {
    await adminApi.post(`/admin/community/reports/${id}/${decision}`, { reason });
  },
  async decideRevision(id: string, approve: boolean, reason: string): Promise<void> {
    await adminApi.post(`/admin/community/revisions/${id}/decision`, { approve, reason });
  },
  async officialAnswer(id: string, reason: string): Promise<void> {
    await adminApi.post(`/admin/community/answers/${id}/official`, { reason });
  },
  async restrictMember(id: string, action: "restrict" | "unrestrict" | "ban", reason: string): Promise<void> {
    await adminApi.post(`/admin/community/members/${id}/restriction`, { action, reason });
  },
};
