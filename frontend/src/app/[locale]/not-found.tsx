'use client';

import { Link } from '@/navigation';
import { Home, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotFound() {
    const t = useTranslations('NotFoundPage');

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={40} />
                </div>
                <h1 className="text-6xl font-heading font-bold text-primary mb-4">404</h1>
                <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-3">
                    {t('title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {t('description')}
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                    <Home size={18} />
                    {t('backToHome')}
                </Link>
            </div>
        </div>
    );
}
