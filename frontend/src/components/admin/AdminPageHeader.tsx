'use client';

import React from 'react';
import { Link } from "@/navigation";
import { ChevronRight } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface AdminPageHeaderProps {
    title: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
}

export function AdminPageHeader({ title, breadcrumbs, actions }: AdminPageHeaderProps) {
    const t = useTranslations('Admin.sidebar');

    return (
        <div className="mb-6">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-admin-muted mb-2">
                    <Link
                        href="/admin"
                        className="hover:text-admin-foreground text-admin-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus rounded"
                    >
                        {t('dashboard')}
                    </Link>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <ChevronRight size={14} className="text-admin-muted" />
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-admin-foreground text-admin-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus rounded"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-admin-body font-medium">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Title + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-admin-foreground tracking-tight">{title}</h1>
                {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
