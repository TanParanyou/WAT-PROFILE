'use client';

import { Link } from '@/navigation';
import { Home, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotFound() {
    const t = useTranslations('NotFoundPage');

    return (
        <div className="flex min-h-screen items-center justify-center bg-site-canvas px-4 py-16 text-site-foreground">
            <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center border border-site-border bg-site-surface text-site-foreground">
                    <Search size={32} />
                </div>
                <h1 className="mb-2 font-heading text-6xl font-medium tracking-tight text-site-foreground">
                    404
                </h1>
                <h2 className="mb-3 font-heading text-2xl font-medium text-site-foreground">
                    {t('title')}
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-site-muted">
                    {t('description')}
                </p>
                <Link
                    href="/"
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-action px-6 py-3 text-sm font-medium text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                    <Home size={18} />
                    {t('backToHome')}
                </Link>
            </div>
        </div>
    );
}

