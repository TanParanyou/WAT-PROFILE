import { publicApi } from './publicService';
import { createAdminService } from './adminService';
import {
  NewsArticle,
  NewsCategory,
  NewsQueryParams,
} from '@/types/news';
import { PaginatedResponse } from '@/types/api';

// Admin News Services
export const adminNewsService = createAdminService<NewsArticle>('news');
export const adminNewsCategoryService = createAdminService<NewsCategory>('news-categories');

// Public News Fetchers
export const publicNewsService = {
  getArticles: async (params?: NewsQueryParams): Promise<PaginatedResponse<NewsArticle>> => {
    const res = await publicApi.get<PaginatedResponse<NewsArticle>>('/news', { params });
    return res.data;
  },

  getArticleBySlug: async (slug: string): Promise<NewsArticle> => {
    const res = await publicApi.get<{ success: boolean; data: NewsArticle }>(`/news/${slug}`);
    return res.data.data;
  },

  getCategories: async (): Promise<NewsCategory[]> => {
    const res = await publicApi.get<{ success: boolean; data: NewsCategory[] }>('/news/categories');
    return res.data.data;
  },
};
