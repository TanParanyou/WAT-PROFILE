import { publicApi } from "./publicService";
import type { ApiResponse } from "@/types/api";

export interface PublicPrivacyRequestPayload {
  subject_email?: string;
  subject_member_code?: string;
  request_type: "access" | "erasure";
  notes?: string;
  website?: string;
}

export interface PublicPrivacyRequestResponse {
  id: string;
  request_type: string;
  created_at: string;
  message: string;
}

export const publicPrivacyService = {
  async submitRequest(
    payload: PublicPrivacyRequestPayload,
  ): Promise<PublicPrivacyRequestResponse> {
    const res = await publicApi.post<ApiResponse<PublicPrivacyRequestResponse>>(
      "/privacy-requests",
      payload,
    );
    return res.data.data!;
  },
};
