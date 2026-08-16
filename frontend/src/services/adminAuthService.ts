import adminApi from "./adminApi";
import { setAdminAccessToken } from "./adminAuthStore";
import type {
  AdminAuthResponse,
  LoginRequest,
  MFALoginRequest,
  UpdateProfileRequest,
  User,
} from "@/types/auth";
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
    if (result.access_token) {
      setAdminAccessToken(result.access_token);
    }
    return result;
  },

  async mfaVerify(data: MFALoginRequest): Promise<AdminAuthResponse> {
    const res = await adminApi.post<ApiResponse<AdminAuthResponse>>(
      "/auth/admin/mfa-verify",
      data,
    );
    const result = res.data.data;
    if (!result) {
      throw new Error("Admin MFA verification response missing data");
    }
    if (result.access_token) {
      setAdminAccessToken(result.access_token);
    }
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
    if (result.access_token) {
      setAdminAccessToken(result.access_token);
    }
    return result;
  },

  async logout(): Promise<void> {
    try {
      await adminApi.post("/auth/admin/logout");
    } finally {
      setAdminAccessToken(null);
    }
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const res = await adminApi.put<ApiResponse<User>>("/admin/me", data);
    const user = res.data.data;
    if (!user) {
      throw new Error("Admin profile update response missing data");
    }
    return user;
  },
};

export default adminAuthService;
