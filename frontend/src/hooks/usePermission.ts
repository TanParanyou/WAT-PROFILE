import { useCallback } from "react";
import { useAuth } from "./useAuth";
import type { PermissionAction, PermissionResource } from "@/types/auth";

/**
 * Permission hook — ตรวจสิทธิ์ user ตาม resource + action
 * Logic ตรงกับ backend HasPermission (models/role.go)
 * - Super Admin: ตัดสินจาก is_system = true && admin_access = true (มีสิทธิ์ทุก resource อัตโนมัติ)
 * - Global Wildcard: {"*": "all"} หรือ {"*": "*"}
 * - Granular Permissions: ตรวจสอบ action ตาม resource
 */
export function usePermission() {
  const { user } = useAuth();
  const role = user?.role;

  // Super Admin: ตัดสินจาก flag ล้วนๆ (is_system = true && admin_access = true)
  const isSuperAdmin = Boolean(role?.is_system && role?.admin_access);

  // Admin Access: มีสิทธิ์เข้าถึง Admin portal
  const isAdmin = isSuperAdmin || Boolean(role?.admin_access);

  // ตรวจสอบ permission เดียว
  const can = useCallback(
    (resource: PermissionResource, action: PermissionAction): boolean => {
      if (!role || !role.is_active) return false;

      // 1. Super Admin มีสิทธิ์ทุก action ในทุก resource โดยอัตโนมัติ
      if (isSuperAdmin) return true;

      if (!role.permissions) return false;

      // 2. Global wildcard permission check (e.g. {"*": "all"} or {"*": "*"})
      const globalPerm = role.permissions["*"];
      if (globalPerm) {
        if (globalPerm === "all" || globalPerm === "*" || globalPerm === action) {
          return true;
        }
      }

      const permission = role.permissions[resource];
      if (!permission) return false;

      // 3. ตรวจสอบสิทธิ์ราย resource
      if (permission === "all" || permission === "*" || permission === action) {
        return true;
      }

      // Handle comma-separated action string like "read,create" or "crud"
      if (typeof permission === "string") {
        const parts = permission.split(",").map((p) => p.trim());
        if (parts.includes(action) || parts.includes("all") || parts.includes("*")) {
          return true;
        }
        if (
          permission === "crud" &&
          (action === "create" || action === "read" || action === "update" || action === "delete")
        ) {
          return true;
        }
      }

      // Handle array of actions
      if (Array.isArray(permission)) {
        return (
          permission.includes("all") ||
          permission.includes("*") ||
          permission.includes(action)
        );
      }

      return false;
    },
    [role, isSuperAdmin],
  );

  // ตรวจว่ามีสิทธิ์อย่างน้อย 1 action
  const canAny = useCallback(
    (resource: PermissionResource, actions: PermissionAction[]): boolean => {
      return actions.some((action) => can(resource, action));
    },
    [can],
  );

  // ตรวจว่ามีสิทธิ์ทุก action
  const canAll = useCallback(
    (resource: PermissionResource, actions: PermissionAction[]): boolean => {
      return actions.every((action) => can(resource, action));
    },
    [can],
  );

  return { can, canAny, canAll, isAdmin, isSuperAdmin };
}
