import adminApi from "./adminApi";
import type { ApiResponse } from "@/types/api";
import type {
  AnalyticsOverview,
  TrendDataPoint,
  TopResourceItem,
  ResourceStats,
} from "@/types/analytics";

export const analyticsAdminService = {
  async getOverview(params?: { from?: string; to?: string }): Promise<AnalyticsOverview> {
    const res = await adminApi.get<ApiResponse<AnalyticsOverview>>("/admin/analytics/overview", {
      params,
    });
    return res.data.data!;
  },

  async getTrends(params?: {
    resource_type?: string;
    from?: string;
    to?: string;
  }): Promise<TrendDataPoint[]> {
    const res = await adminApi.get<ApiResponse<TrendDataPoint[]>>("/admin/analytics/trends", {
      params,
    });
    return res.data.data || [];
  },

  async getTopResources(params?: {
    resource_type?: string;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<TopResourceItem[]> {
    const res = await adminApi.get<ApiResponse<TopResourceItem[]>>("/admin/analytics/top-resources", {
      params,
    });
    return res.data.data || [];
  },

  async getResourceStats(
    type: string,
    id: string | number,
    params?: { from?: string; to?: string },
  ): Promise<ResourceStats> {
    const res = await adminApi.get<ApiResponse<ResourceStats>>(
      `/admin/analytics/resources/${type}/${id}`,
      { params },
    );
    return res.data.data!;
  },
};
