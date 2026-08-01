// Permission map ตรง backend PermissionsMap JSONB
// ค่าเป็น "all" | "read" | "create" | "update" | "delete" | string[]
export type PermissionsMap = Record<string, string | string[]>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionsMap;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role_id: string | null;
  role?: Role;
  email_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}


// Permission action types
export type PermissionAction = "read" | "create" | "update" | "delete";

// Permission resources ตาม backend
export type PermissionResource =
  | "events"
  | "monks"
  | "gallery"
  | "schedules"
  | "donations"
  | "members"
  | "contacts"
  | "settings"
  | "users"
  | "registrations"
  | "audit_logs"
  | "website";
