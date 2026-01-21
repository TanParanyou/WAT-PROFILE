'use client';

import { siteConfig } from '@/config/site.config';
import { useTranslations } from 'next-intl';

export default function ImpressumPage() {
    const t = useTranslations('ImpressumPage');

    return (
        <div className="bg-white dark:bg-zinc-950 min-h-screen">
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
                <h1 className="text-4xl font-heading font-bold mb-8">{t('title')}</h1>
                <div className="prose prose-lg dark:prose-invert max-w-4xl">
                    <h2>{t('companyName')}</h2>
                    <p>{siteConfig.siteName.en}</p>

                    <h2>{t('address')}</h2>
                    <p>{siteConfig.contact.address?.en}</p>

                    <h2>{t('contact')}</h2>
                    <p>
                        Phone: {siteConfig.contact.phone}<br />
                        Email: {siteConfig.contact.email}
                    </p>
                </div>
            </div>
        </div>
    );
}
