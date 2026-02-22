'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/Button';
import type { ButtonProps } from '@/components/ui/Button';
import type { PermissionAction, PermissionResource } from '@/types/auth';

interface PermissionButtonProps extends ButtonProps {
    resource: PermissionResource;
    action: PermissionAction;
}

/**
 * PermissionButton — Button ที่ไม่แสดงเลยถ้าไม่มีสิทธิ์
 */
export function PermissionButton({ resource, action, ...buttonProps }: PermissionButtonProps) {
    const { can } = usePermission();

    if (!can(resource, action)) return null;

    return <Button {...buttonProps} />;
}
