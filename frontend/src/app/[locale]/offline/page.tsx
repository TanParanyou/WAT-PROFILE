'use client';

import { useTranslations, useLocale } from 'next-intl';
import { WifiOff, RefreshCw, Home, Phone, MapPin } from 'lucide-react';
import { Link } from '@/navigation';
import Image from 'next/image';
import { STATIC_ASSETS } from '@/constants/assets';
import { usePublicSiteSettings } from '@/features/public/settings/PublicSiteSettingsProvider';
import { getLocalizedText } from '@/utils/localizedText';

export default function OfflinePage() {
  const t = useTranslations('Pwa');
  const tSite = useTranslations('Site');
  const locale = useLocale();
  const settings = usePublicSiteSettings();

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const formattedAddress = getLocalizedText(settings.address, locale);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mx-auto w-full max-w-md border border-site-border bg-site-canvas p-8">
        {/* Temple Logo & Wifi Off Icon */}
        <div className="relative mx-auto mb-6 flex size-20 items-center justify-center border border-site-border bg-site-surface">
          <div className="relative size-12 overflow-hidden">
            <Image
              src={settings.logoUrl || STATIC_ASSETS.LOGO.DEFAULT}
              alt=""
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center border border-site-border bg-site-canvas text-site-accent">
            <WifiOff size={14} aria-hidden="true" />
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="font-heading text-2xl font-medium text-site-foreground">
          {t('offlineTitle')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-site-body">
          {t('offlineDesc')}
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-action px-6 py-3 text-sm font-medium text-site-inverse transition-colors hover:bg-site-surface hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('retry')}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-3 text-sm font-medium text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            <Home size={16} aria-hidden="true" />
            {t('backToHome')}
          </Link>
        </div>

        {/* Contact Info (if available) */}
        {(settings.phone || formattedAddress) && (
          <div className="mt-10 border-t border-site-border pt-6 text-left">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-site-muted">
              {tSite('name')}
            </h2>
            <div className="mt-3 space-y-2 text-xs text-site-body">
              {settings.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0 text-site-accent" aria-hidden="true" />
                  <a
                    href={`tel:${settings.phone}`}
                    className="transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                  >
                    {settings.phone}
                  </a>
                </div>
              )}
              {formattedAddress && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-site-accent" aria-hidden="true" />
                  <span>{formattedAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
