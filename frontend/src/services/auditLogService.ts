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
    const raw = res.data?.data || {};
    return {
      actions: raw.actions || [],
      entity_types: raw.entity_types || raw.entityTypes || [],
    };
  },
};
