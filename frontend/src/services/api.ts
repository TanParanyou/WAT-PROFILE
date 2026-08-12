import axios from "axios";

const baseUrlEnv = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const API_BASE = baseUrlEnv.replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — แนบ access token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — auto refresh token เมื่อ 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ถ้า 401 + ยังไม่เคย retry + ไม่ใช่ request refresh/login
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newToken = res.data.data?.access_token;
        if (newToken) {
          localStorage.setItem("access_token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed — clear tokens + redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (
          typeof window !== "undefined" &&
          window.location.pathname.includes("/admin")
        ) {
          const locale = window.location.pathname.split("/")[1];
          window.location.href = `/${locale}/admin/login`;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
