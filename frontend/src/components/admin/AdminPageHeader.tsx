'use client';

import React from 'react';
import { Link } from "@/navigation";
import { ChevronRight } from 'lucide-react';

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
    return (
        <div className="mb-6">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <Link href="/admin" className="hover:text-gray-700">
                        Dashboard
                    </Link>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <ChevronRight size={14} />
                            {crumb.href ? (
                                <Link href={crumb.href} className="hover:text-gray-700">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-gray-700">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Title + Actions */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
