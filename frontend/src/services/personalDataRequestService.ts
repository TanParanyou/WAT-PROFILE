import adminApi from "./adminApi";
import type { ApiResponse } from "@/types/api";
import type { PersonalDataCandidate, PersonalDataRequest, PersonalDataRequestItem } from "@/types/personal-data-request";

export const personalDataRequestService = {
  async list(): Promise<PersonalDataRequest[]> { const res = await adminApi.get<ApiResponse<PersonalDataRequest[]>>("/admin/privacy-requests"); return res.data.data || []; },
  async create(input: { subject_email?: string; subject_member_code?: string; request_type: string; notes?: string }): Promise<PersonalDataRequest> { const res = await adminApi.post<ApiResponse<PersonalDataRequest>>("/admin/privacy-requests", input); return res.data.data!; },
  async get(id: string): Promise<PersonalDataRequest> { const res = await adminApi.get<ApiResponse<PersonalDataRequest>>(`/admin/privacy-requests/${id}`); return res.data.data!; },
  async search(email: string, memberCode: string): Promise<PersonalDataCandidate[]> { const res = await adminApi.get<ApiResponse<PersonalDataCandidate[]>>("/admin/privacy-requests/search", { params: { email: email || undefined, member_code: memberCode || undefined } }); return res.data.data || []; },
  async verify(id: string, method: string, evidence: string): Promise<PersonalDataRequest> { const res = await adminApi.post<ApiResponse<PersonalDataRequest>>(`/admin/privacy-requests/${id}/verify`, { method, evidence }); return res.data.data!; },
  async sendVerification(id: string): Promise<void> { await adminApi.post(`/admin/privacy-requests/${id}/send-verification`); },
  async select(id: string, items: PersonalDataRequestItem[]): Promise<PersonalDataRequest> { const res = await adminApi.post<ApiResponse<PersonalDataRequest>>(`/admin/privacy-requests/${id}/items`, { items }); return res.data.data!; },
  async complete(id: string): Promise<{ affected_count: number }> { const res = await adminApi.post<ApiResponse<{ affected_count: number }>>(`/admin/privacy-requests/${id}/complete`); return res.data.data!; },
  async export(id: string): Promise<Blob> { const res = await adminApi.get(`/admin/privacy-requests/${id}/export`, { responseType: "blob" }); return res.data as Blob; },
};
