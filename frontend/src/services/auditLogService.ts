import { createAdminService } from "./adminService";
import { AuditLog } from "@/types/auditLog";
import api from "./api";

// Create base CRUD admin service for Audit Logs
const baseAuditLogService = createAdminService<AuditLog>("/admin/audit-logs");

// Add specific functionality if needed, normally audit logs are read-only.
export const auditLogAdminService = {
  ...baseAuditLogService,

  // Custom fetch if we need filters
  getList: async (params?: {
    page?: number;
    limit?: number;
    entity_type?: string;
    action?: string;
  }) => {
    const response = await api.get("/admin/audit-logs", { params });
    return response.data;
  },
};
