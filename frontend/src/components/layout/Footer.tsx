'use client';

import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePublicSiteSettings } from '@/features/public/settings/PublicSiteSettingsProvider';
import { getLocalizedText } from '@/utils/localizedText';

export default function Footer() {
    const t = useTranslations('Footer');
    const tSite = useTranslations('Site');
    const locale = useLocale();
    const settings = usePublicSiteSettings();

    const menuItems = [
        { name: t('aboutUs'), href: '/about' },
        { name: t('events'), href: '/events' },
        { name: t('contactUs'), href: '/contact' },
    ];

    return (
        <footer className="bg-white py-16 dark:bg-zinc-950">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                    {/* Column 1: About */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white dark:bg-zinc-800">
                                <Image src={settings.logoUrl || '/images/icon/logo.png'} alt="" fill sizes="40px" className="object-contain p-1" />
                            </div>
                            <span className="font-heading text-xl font-bold text-gray-800 dark:text-gray-100">
                                {tSite('name')}
                            </span>
                        </div>
                        <p className="mb-6 max-w-sm text-gray-600 dark:text-gray-400">
                            {getLocalizedText(settings.description, locale)}
                        </p>
                        <div className="flex gap-4">
                            <a
                                href={settings.social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="flex size-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-sm transition-all hover:scale-110 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-300"
                            >
                                <Facebook size={20} />
                            </a>
                            <a
                                href={`mailto:${settings.email}`}
                                aria-label={t('email')}
                                className="flex size-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-sm transition-all hover:scale-110 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-300"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="mb-6 font-heading text-lg font-bold text-gray-800 dark:text-gray-100">
                            {t('quickLinks')}
                        </h3>
                        <ul className="space-y-3">
                            {menuItems.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="text-gray-600 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:text-gray-400">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Contact Info */}
                    <div>
                        <h3 className="mb-6 font-heading text-lg font-bold text-gray-800 dark:text-gray-100">
                            {t('contactInfo')}
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="mt-1 shrink-0 text-primary" size={20} />
                                <span className="text-gray-600 dark:text-gray-400">
                                    {getLocalizedText(settings.address, locale)}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="shrink-0 text-primary" size={20} />
                                <a href={`tel:${settings.phone}`} className="text-gray-600 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:text-gray-400">{settings.phone}</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="shrink-0 text-primary" size={20} />
                                <a href={`mailto:${settings.email}`} className="text-gray-600 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:text-gray-400">{settings.email}</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-500">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <span>© {new Date().getFullYear()} {tSite('name')}. {t('allRightsReserved')}.</span>
                        <div className="flex gap-6 text-xs">
                            <Link href="/privacy" className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{t('privacy')}</Link>
                            <Link href="/impressum" className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{t('impressum')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
