import adminApi from "./adminApi";
import { setAdminAccessToken } from "./adminAuthStore";
import type { AdminAuthResponse, LoginRequest } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

const adminAuthService = {
  async login(data: LoginRequest): Promise<AdminAuthResponse> {
    const res = await adminApi.post<ApiResponse<AdminAuthResponse>>(
      "/auth/admin/login",
      data,
    );
    const result = res.data.data;
    if (!result) {
      throw new Error("Admin login response missing data");
    }
    setAdminAccessToken(result.access_token);
    return result;
  },

  async refresh(): Promise<AdminAuthResponse> {
    const res = await adminApi.post<ApiResponse<AdminAuthResponse>>(
      "/auth/admin/refresh",
    );
    const result = res.data.data;
    if (!result) {
      throw new Error("Admin session refresh response missing data");
    }
    setAdminAccessToken(result.access_token);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await adminApi.post("/auth/admin/logout");
    } finally {
      setAdminAccessToken(null);
    }
  },
};

export default adminAuthService;
