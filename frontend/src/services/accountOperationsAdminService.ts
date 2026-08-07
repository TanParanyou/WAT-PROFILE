import adminApi from "./adminApi";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { AdminListParams } from "@/features/admin-list/types";
import { serializeAdminListParams } from "@/features/admin-list/url";
import type {
  AccountOperationReason,
  AdminAccountSecurityEvent,
  AdminAccountSummary,
} from "@/features/admin-accounts/types";

function requireData<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error || "Admin account operation failed");
  }
  return response.data;
}

function buildListUrl(params: AdminListParams): string {
  const query = serializeAdminListParams(params);
  return query.toString() ? `/admin/account-operations?${query}` : "/admin/account-operations";
}

export const accountOperationsAdminService = {
  async getPaginated(
    params: AdminListParams,
  ): Promise<PaginatedResponse<AdminAccountSummary>> {
    const response = await adminApi.get<PaginatedResponse<AdminAccountSummary>>(
      buildListUrl(params),
    );
    return response.data;
  },

  async getById(id: string): Promise<AdminAccountSummary> {
    const response = await adminApi.get<ApiResponse<AdminAccountSummary>>(
      `/admin/account-operations/${id}`,
    );
    return requireData(response.data);
  },

  async getSecurityEvents(
    id: string,
    params: AdminListParams,
  ): Promise<PaginatedResponse<AdminAccountSecurityEvent>> {
    const query = serializeAdminListParams(params);
    const url = `/admin/account-operations/${id}/security-events${query.toString() ? `?${query}` : ""}`;
    const response = await adminApi.get<PaginatedResponse<AdminAccountSecurityEvent>>(url);
    return response.data;
  },

  async disable(id: string, reason: AccountOperationReason): Promise<AdminAccountSummary> {
    const response = await adminApi.post<ApiResponse<AdminAccountSummary>>(
      `/admin/account-operations/${id}/disable`,
      { reason },
    );
    return requireData(response.data);
  },

  async enable(id: string, reason: AccountOperationReason): Promise<AdminAccountSummary> {
    const response = await adminApi.post<ApiResponse<AdminAccountSummary>>(
      `/admin/account-operations/${id}/enable`,
      { reason },
    );
    return requireData(response.data);
  },

  async logoutAll(id: string, reason: AccountOperationReason): Promise<AdminAccountSummary> {
    const response = await adminApi.post<ApiResponse<AdminAccountSummary>>(
      `/admin/account-operations/${id}/logout-all`,
      { reason },
    );
    return requireData(response.data);
  },
};
