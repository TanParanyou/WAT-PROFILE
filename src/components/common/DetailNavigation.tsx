'use client';

import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import { ReactNode } from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface DetailNavigationProps {
    breadcrumbs: BreadcrumbItem[];
    backHref: string;
    backLabel: string;
    actions?: ReactNode;
}

export default function DetailNavigation({ breadcrumbs, backHref, backLabel, actions }: DetailNavigationProps) {
    return (
        <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/20 dark:border-white/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Breadcrumbs & Back */}
            <div className="flex flex-col gap-1">
                <PageBreadcrumbs items={breadcrumbs} />
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors font-medium group w-fit mt-1"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    {backLabel}
                </Link>
            </div>

            {/* Actions (if any) */}
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
