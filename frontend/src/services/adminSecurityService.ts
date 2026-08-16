import adminApi from "./adminApi";
import type { ApiResponse } from "@/types/api";
import type {
  SecurityPreferences,
  TOTPSetupResponse,
  TOTPVerifySetupRequest,
  TOTPVerifySetupResponse,
  TOTPDisableRequest,
  RegenerateBackupCodesRequest,
  RegenerateBackupCodesResponse,
  AdminSessionItem,
} from "@/types/security";

const adminSecurityService = {
  async setup2FA(): Promise<TOTPSetupResponse> {
    const res = await adminApi.post<ApiResponse<TOTPSetupResponse>>("/admin/2fa/setup");
    if (!res.data.data) {
      throw new Error("Missing 2FA setup data");
    }
    return res.data.data;
  },

  async verify2FASetup(data: TOTPVerifySetupRequest): Promise<TOTPVerifySetupResponse> {
    const res = await adminApi.post<ApiResponse<TOTPVerifySetupResponse>>(
      "/admin/2fa/verify-setup",
      data,
    );
    if (!res.data.data) {
      throw new Error("Missing 2FA verification response");
    }
    return res.data.data;
  },

  async disable2FA(data: TOTPDisableRequest): Promise<void> {
    await adminApi.post("/admin/2fa/disable", data);
  },

  async regenerateBackupCodes(
    data: RegenerateBackupCodesRequest,
  ): Promise<RegenerateBackupCodesResponse> {
    const res = await adminApi.post<ApiResponse<RegenerateBackupCodesResponse>>(
      "/admin/2fa/regenerate-backup-codes",
      data,
    );
    if (!res.data.data) {
      throw new Error("Missing regenerated backup codes");
    }
    return res.data.data;
  },

  async getSessions(): Promise<AdminSessionItem[]> {
    const res = await adminApi.get<ApiResponse<AdminSessionItem[]>>("/admin/sessions");
    return res.data.data || [];
  },

  async revokeSession(id: string): Promise<void> {
    await adminApi.delete(`/admin/sessions/${id}`);
  },

  async revokeOtherSessions(): Promise<{ revoked_count: number }> {
    const res = await adminApi.delete<ApiResponse<{ revoked_count: number }>>(
      "/admin/sessions/other",
    );
    return res.data.data || { revoked_count: 0 };
  },

  async getSecurityPreferences(): Promise<SecurityPreferences> {
    const res = await adminApi.get<ApiResponse<SecurityPreferences>>(
      "/admin/security/preferences",
    );
    if (!res.data.data) {
      throw new Error("Missing security preferences");
    }
    return res.data.data;
  },

  async updateSecurityPreferences(
    data: Partial<SecurityPreferences>,
  ): Promise<SecurityPreferences> {
    const res = await adminApi.put<ApiResponse<SecurityPreferences>>(
      "/admin/security/preferences",
      data,
    );
    if (!res.data.data) {
      throw new Error("Missing updated security preferences");
    }
    return res.data.data;
  },
};

export default adminSecurityService;
