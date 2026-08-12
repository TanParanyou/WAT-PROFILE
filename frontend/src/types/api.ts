import type { AdminPagination } from "@/features/admin-list/types";

// API Response types ตรง backend response format
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    message?: string;
    fields?: Record<string, string>;
    details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: AdminPagination;
}

export interface MultiLangText {
    th: string;
    en: string;
    de: string;
}

export interface MultiLangError {
    th?: { message?: string };
    en?: { message?: string };
    de?: { message?: string };
    message?: string;
}

