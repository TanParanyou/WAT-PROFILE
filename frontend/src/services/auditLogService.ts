import { createAdminService } from "./adminService";
import type { AuditLog } from "@/types/auditLog";
import api from "./adminApi";

const baseAuditLogService = createAdminService<AuditLog>("audit-logs");

export const auditLogAdminService = {
  ...baseAuditLogService,

  getList: async (params?: Record<string, unknown>) => {
    const response = await api.get("/admin/audit-logs", { params });
    return response.data;
  },

  async getFilterOptions(): Promise<{ actions: string[]; entity_types: string[] }> {
    const res = await api.get("/admin/audit-logs/filter-options");
    return res.data.data || { actions: [], entity_types: [] };
  },
};
