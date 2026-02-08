'use client';

import { siteConfig } from '@/config/site.config';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import { Building2, Mail, MapPin, Phone } from 'lucide-react';

export default function ImpressumPage() {
    const t = useTranslations('ImpressumPage');
    const tSite = useTranslations('Site');

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={tSite('location')}
            />

            <PageContainer>
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12">

                        {/* Company Section */}
                        <div className="mb-10">
                            <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <Building2 className="text-primary" size={24} />
                                {t('companyName')}
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 ml-9">
                                {siteConfig.siteName.en}
                            </p>
                        </div>

                        {/* Address Section */}
                        <div className="mb-10">
                            <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <MapPin className="text-primary" size={24} />
                                {t('address')}
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 ml-9 whitespace-pre-line">
                                {siteConfig.contact.address?.en}
                            </p>
                        </div>

                        {/* Contact Section */}
                        <div>
                            <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <Phone className="text-primary" size={24} />
                                {t('contact')}
                            </h2>
                            <div className="ml-9 space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-900 dark:text-white min-w-20">{t('phone')}:</span>
                                    <span className="text-gray-600 dark:text-gray-400">{siteConfig.contact.phone}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-900 dark:text-white min-w-20">{t('email')}:</span>
                                    <span className="text-gray-600 dark:text-gray-400">{siteConfig.contact.email}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
