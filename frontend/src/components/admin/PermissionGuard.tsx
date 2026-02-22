'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import type { PermissionAction, PermissionResource } from '@/types/auth';

interface PermissionGuardProps {
    resource: PermissionResource;
    action: PermissionAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * PermissionGuard — ซ่อน UI ที่ไม่มีสิทธิ์
 * ไม่ render เลยถ้าไม่มี permission (ไม่ใช่แค่ disable)
 */
export function PermissionGuard({ resource, action, children, fallback = null }: PermissionGuardProps) {
    const { can } = usePermission();

    if (!can(resource, action)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
