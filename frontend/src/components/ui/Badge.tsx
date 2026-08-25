import React from 'react';
import { Link } from '@/navigation';
import { cn } from '@/utils/cn';

export type BadgeVariant =
  | 'default'
  | 'muted'
  | 'accent'
  | 'danger'
  | 'action'
  | 'outline'
  | 'dark';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  as?: React.ElementType;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border border-site-border bg-site-surface text-site-foreground',
  muted: 'border border-site-border/60 bg-site-surface/50 text-site-muted',
  accent: 'border border-site-border bg-site-surface text-site-accent',
  danger: 'border border-site-danger bg-site-danger-surface text-site-danger',
  action: 'border border-site-border bg-site-action text-site-on-action',
  outline: 'border border-site-border bg-transparent text-site-foreground',
  dark: 'bg-black/75 text-white border border-white/20 backdrop-blur-sm',
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-2 py-0.5 gap-1 font-medium',
  sm: 'text-[11px] px-2.5 py-1 gap-1 font-medium',
  md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
};

export const Badge = React.forwardRef<HTMLElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'sm',
      icon,
      rightIcon,
      href,
      target,
      rel,
      as: Component = 'span',
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      'inline-flex items-center',
      variantClasses[variant],
      sizeClasses[size],
      href &&
        'transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus',
      className
    );

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          className={classes}
          {...(props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {icon}
          {children}
          {rightIcon}
        </Link>
      );
    }

    const Tag = Component;

    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        className={classes}
        {...props}
      >
        {icon}
        {children}
        {rightIcon}
      </Tag>
    );
  }
);

Badge.displayName = 'Badge';
