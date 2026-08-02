import axios, { AxiosError } from "axios";
import {
  getAdminAccessToken,
  notifyAdminAuthLost,
  setAdminAccessToken,
} from "./adminAuthStore";
import type { AdminAuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const ADMIN_AUTH_PATHS = ["/auth/admin/login", "/auth/admin/refresh", "/auth/admin/logout"];

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _adminRetried?: boolean;
  }
}

const isExcludedPath = (url: string | undefined): boolean => {
  if (!url) return false;
  return ADMIN_AUTH_PATHS.some((path) => url.includes(path));
};

const adminApi = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// แนบ Admin access token จาก memory เท่านั้น
adminApi.interceptors.request.use((config) => {
  if (isExcludedPath(config.url)) {
    return config;
  }
  const token = getAdminAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh — หนึ่ง refresh สำหรับหลาย request ที่ 401 พร้อมกัน
let refreshPromise: Promise<string> | null = null;

function ensureAdminAccessToken(): Promise<string> {
  const current = getAdminAccessToken();
  if (current) {
    return Promise.resolve(current);
  }
  if (!refreshPromise) {
    refreshPromise = adminApi
      .post<ApiResponse<AdminAuthResponse>>("/auth/admin/refresh")
      .then((response) => {
        const token = response.data.data?.access_token;
        if (!token) {
          throw new Error("Admin refresh response missing access token");
        }
        setAdminAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

adminApi.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    if (
      axiosError.response?.status !== 401 ||
      !axiosError.config ||
      axiosError.config._adminRetried ||
      isExcludedPath(axiosError.config.url)
    ) {
      return Promise.reject(error);
    }
    axiosError.config._adminRetried = true;
    try {
      const token = await ensureAdminAccessToken();
      axiosError.config.headers.Authorization = `Bearer ${token}`;
      return adminApi(axiosError.config);
    } catch {
      notifyAdminAuthLost();
      return Promise.reject(error);
    }
  },
);

export default adminApi;
