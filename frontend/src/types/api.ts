// API Response types ตรง backend response format
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// MultiLangText ตรง backend MultiLangText JSONB
export interface MultiLangText {
    th: string;
    en: string;
    de: string;
}
