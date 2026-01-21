'use client';

import { siteConfig } from '@/config/site.config';
import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');
    const tSite = useTranslations('Site');

    const menuItems = [
        { name: t('aboutUs'), href: '/about' },
        { name: t('events'), href: '/events' },
        { name: t('donate'), href: '/donate' },
        { name: t('contactUs'), href: '/contact' },
    ];

    return (
        <footer className="bg-zinc-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Column 1: About */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                W
                            </div>
                            <span className="font-heading font-bold text-lg text-primary">
                                {tSite('name')}
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                            {siteConfig.seo.defaultDescription}
                        </p>
                        <div className="flex gap-4">
                            <a
                                href={siteConfig.social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary hover:scale-110 transition-all shadow-sm border border-gray-100 dark:border-gray-700"
                            >
                                <Facebook size={20} />
                            </a>
                            <a
                                href={`mailto:${siteConfig.social.email}`}
                                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary hover:scale-110 transition-all shadow-sm border border-gray-100 dark:border-gray-700"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="font-heading font-bold text-lg mb-6 text-gray-800 dark:text-gray-100">
                            {t('quickLinks')}
                        </h3>
                        <ul className="space-y-3">
                            {menuItems.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Contact Info */}
                    <div>
                        <h3 className="font-heading font-bold text-lg mb-6 text-gray-800 dark:text-gray-100">
                            {t('contactInfo')}
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="text-primary mt-1 shrink-0" size={20} />
                                <span className="text-gray-600 dark:text-gray-400">
                                    {siteConfig.contact.address?.th}
                                    <br />
                                    {siteConfig.contact.address?.en}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="text-primary shrink-0" size={20} />
                                <span className="text-gray-600 dark:text-gray-400">
                                    {siteConfig.contact.phone}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="text-primary shrink-0" size={20} />
                                <span className="text-gray-600 dark:text-gray-400">
                                    {siteConfig.contact.email}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-500 dark:text-gray-500 text-sm">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <span>© {new Date().getFullYear()} {tSite('name')}. All rights reserved.</span>
                        <div className="flex gap-6 text-xs">
                            <Link href="/privacy" className="hover:text-primary transition-colors">{t('privacy')}</Link>
                            <Link href="/impressum" className="hover:text-primary transition-colors">{t('impressum')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
