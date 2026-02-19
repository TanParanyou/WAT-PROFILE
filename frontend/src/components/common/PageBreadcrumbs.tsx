'use client';

import { Link } from '@/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface PageBreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
    const t = useTranslations('EventDetailPage.breadcrumbs');

    return (
        <nav className="flex text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                    <Link href="/" className="inline-flex items-center hover:text-primary transition-colors">
                        <Home size={16} className="mr-2" />
                        {t('home')}
                    </Link>
                </li>

                {items.map((item, index) => (
                    <li key={index}>
                        <div className="flex items-center">
                            <ChevronRight size={16} className="mx-1" />
                            {item.href && !item.active ? (
                                <Link href={item.href} className="hover:text-primary transition-colors">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className={`${item.active ? 'text-gray-900 dark:text-white font-medium' : ''}`}>
                                    {item.label}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
