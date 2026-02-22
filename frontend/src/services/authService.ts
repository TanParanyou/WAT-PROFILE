import api from './api';
import type { LoginRequest, LoginResponse, RefreshResponse, User } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

const authService = {
    async login(data: LoginRequest): Promise<LoginResponse> {
        const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
        const result = res.data.data!;

        // เก็บ tokens ใน localStorage
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('refresh_token', result.refresh_token);

        return result;
    },

    async getProfile(): Promise<User> {
        const res = await api.get<ApiResponse<User>>('/auth/me');
        return res.data.data!;
    },

    async refreshToken(): Promise<string> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await api.post<ApiResponse<RefreshResponse>>('/auth/refresh', {
            refresh_token: refreshToken,
        });

        const newToken = res.data.data!.access_token;
        localStorage.setItem('access_token', newToken);
        return newToken;
    },

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    },
};

export default authService;
