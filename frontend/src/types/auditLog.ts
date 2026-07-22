import { User } from "./auth";

export interface AuditLog {
  id: string;
  user_id: string | null;
  user?: User;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  trace_id: string;
  created_at: string;
}
