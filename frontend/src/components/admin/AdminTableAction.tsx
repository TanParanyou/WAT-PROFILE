'use client';

import React from 'react';
import { Link } from '@/navigation';
import { cn } from '@/utils/cn';
import { Tooltip } from '@/components/ui/Tooltip';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import type { PermissionAction, PermissionResource } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export type TableActionVariant = 'default' | 'danger' | 'primary' | 'success';

export interface AdminTableActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  variant?: TableActionVariant;
  disabled?: boolean;
  isLoading?: boolean;
  resource?: PermissionResource;
  action?: PermissionAction;
  className?: string;
  target?: string;
  rel?: string;
}

const variantStyles: Record<TableActionVariant, string> = {
  default:
    'text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground hover:border-admin-border',
  danger:
    'text-admin-muted hover:bg-admin-danger-surface hover:text-admin-danger hover:border-admin-danger/30',
  primary:
    'text-admin-action hover:bg-admin-surface-muted hover:text-admin-action-hover hover:border-admin-action/30',
  success:
    'text-admin-success hover:bg-admin-success-surface hover:text-admin-success hover:border-admin-success/30',
};

export function AdminTableAction({
  icon,
  label,
  onClick,
  href,
  variant = 'default',
  disabled = false,
  isLoading = false,
  resource,
  action,
  className,
  target,
  rel,
}: AdminTableActionProps) {
  const baseClasses = cn(
    'inline-flex h-9 w-9 items-center justify-center rounded-none border border-transparent transition-all duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus',
    'active:scale-95 disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent',
    variantStyles[variant],
    className
  );

  let element: React.ReactElement;

  if (href && !disabled && !isLoading) {
    element = (
      <Link
        href={href}
        className={baseClasses}
        aria-label={label}
        target={target}
        rel={rel}
      >
        {icon}
      </Link>
    );
  } else {
    element = (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className={baseClasses}
        aria-label={label}
      >
        {isLoading ? <Loader2 size={16} className="animate-spin text-current" /> : icon}
      </button>
    );
  }

  const actionWithTooltip = (
    <Tooltip content={label} disabled={disabled || isLoading}>
      {element}
    </Tooltip>
  );

  if (resource && action) {
    return (
      <PermissionGuard resource={resource} action={action}>
        {actionWithTooltip}
      </PermissionGuard>
    );
  }

  return actionWithTooltip;
}

export function AdminTableActionGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex items-center gap-1', className)}>{children}</div>;
}
