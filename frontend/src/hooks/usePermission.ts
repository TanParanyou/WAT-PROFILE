import { useCallback } from 'react';
import { useAuth } from './useAuth';
import type { PermissionAction, PermissionResource } from '@/types/auth';

/**
 * Permission hook — ตรวจสิทธิ์ user ตาม resource + action
 * Logic ตรงกับ backend HasPermission (role.go)
 */
export function usePermission() {
    const { user } = useAuth();

    // ตรวจ permission เดียว
    const can = useCallback(
        (resource: PermissionResource, action: PermissionAction): boolean => {
            if (!user?.role?.permissions) return false;

            const permission = user.role.permissions[resource];
            if (!permission) return false;

            // "all" = มีสิทธิ์ทุก action
            if (permission === 'all') return true;

            // string เดี่ยว
            if (typeof permission === 'string') return permission === action;

            // array of actions
            if (Array.isArray(permission)) {
                return permission.includes('all') || permission.includes(action);
            }

            return false;
        },
        [user]
    );

    // ตรวจว่ามีสิทธิ์อย่างน้อย 1 action
    const canAny = useCallback(
        (resource: PermissionResource, actions: PermissionAction[]): boolean => {
            return actions.some((action) => can(resource, action));
        },
        [can]
    );

    // ตรวจว่ามีสิทธิ์ทุก action
    const canAll = useCallback(
        (resource: PermissionResource, actions: PermissionAction[]): boolean => {
            return actions.every((action) => can(resource, action));
        },
        [can]
    );

    // ตรวจว่าเป็น admin (role name = "admin")
    const isAdmin = user?.role?.name === 'admin';

    return { can, canAny, canAll, isAdmin };
}
