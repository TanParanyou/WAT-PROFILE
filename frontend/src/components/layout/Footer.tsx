'use client';

import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { Link, usePathname } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePublicSiteSettings } from '@/features/public/settings/PublicSiteSettingsProvider';
import { isAccountPath } from '@/features/public/account/accountNavigation';
import { getLocalizedText } from '@/utils/localizedText';
import { STATIC_ASSETS } from '@/constants/assets';

export default function Footer() {
    const pathname = usePathname();
    const t = useTranslations('Footer');
    const tSite = useTranslations('Site');
    const locale = useLocale();
    const settings = usePublicSiteSettings();

    const menuItems = [
        { name: t('aboutUs'), href: '/about' },
        { name: t('events'), href: '/events' },
        { name: t('contactUs'), href: '/contact' },
    ];

    if (isAccountPath(pathname)) return null;

    return (
        <footer className="border-t border-site-border bg-site-canvas py-16 text-site-foreground">
            <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-[6vw]">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                    {/* Column 1: About */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="relative h-10 w-10 overflow-hidden border border-site-border bg-site-canvas">
                                <Image src={settings.logoUrl || STATIC_ASSETS.LOGO.DEFAULT} alt="" fill sizes="40px" className="object-contain p-1" />
                            </div>
                            <span className="font-heading text-xl font-medium text-site-foreground">
                                {tSite('name')}
                            </span>
                        </div>
                        <p className="mb-6 max-w-sm text-site-body">
                            {t('description')}
                        </p>
                        <div className="flex gap-4">
                            <a
                                href={settings.social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="flex size-10 items-center justify-center border border-site-border bg-site-canvas text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                            >
                                <Facebook size={20} />
                            </a>
                            <a
                                href={`mailto:${settings.email}`}
                                aria-label={t('email')}
                                className="flex size-10 items-center justify-center border border-site-border bg-site-canvas text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="mb-6 font-heading text-lg font-medium text-site-foreground">
                            {t('quickLinks')}
                        </h3>
                        <ul className="space-y-3">
                            {menuItems.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="text-site-body transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Contact Info */}
                    <div>
                        <h3 className="mb-6 font-heading text-lg font-medium text-site-foreground">
                            {t('contactInfo')}
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="mt-1 shrink-0 text-site-accent" size={20} />
                                <span className="text-site-body">
                                    {getLocalizedText(settings.address, locale)}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="shrink-0 text-site-accent" size={20} />
                                <a href={`tel:${settings.phone}`} className="text-site-body transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{settings.phone}</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="shrink-0 text-site-accent" size={20} />
                                <a href={`mailto:${settings.email}`} className="text-site-body transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{settings.email}</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-site-border pt-8 text-center text-sm text-site-muted">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <span>© {new Date().getFullYear()} {tSite('name')}. {t('allRightsReserved')}.</span>
                        <div className="flex gap-6 text-xs">
                            <Link href="/privacy" className="transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t('privacy')}</Link>
                            <Link href="/impressum" className="transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t('impressum')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
