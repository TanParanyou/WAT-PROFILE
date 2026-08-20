'use client';

import { useState, useEffect } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';
import Image from 'next/image';
import IosInstallModal from './IosInstallModal';

const DISMISS_KEY = 'pwa_prompt_dismissed_until';
const DISMISS_DAYS = 7;

export default function PwaInstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIosModal, setShowIosModal] = useState(false);
  const t = useTranslations('Pwa');

  useEffect(() => {
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    const isCurrentlyDismissed = !!(dismissedUntil && Number(dismissedUntil) > Date.now());

    if (!isCurrentlyDismissed) {
      const timer = setTimeout(() => {
        setIsDismissed(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    const dismissExpiry = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(dismissExpiry));
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    const installed = await promptInstall();
    if (installed) {
      setIsDismissed(true);
    }
  };

  const shouldShowBanner = !isInstalled && !isDismissed && (canInstall || isIOS);

  return (
    <>
      {shouldShowBanner && (
        <div
          role="region"
          aria-label={t('installBannerTitle')}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md border border-site-border bg-site-canvas p-4 text-site-foreground sm:bottom-6"
        >
          <div className="flex items-start gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden border border-site-border bg-site-surface">
              <Image src="/icons/icon-192x192.png" alt="" fill sizes="48px" className="object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-medium text-site-foreground text-sm truncate">
                  {t('installBannerTitle')}
                </h4>
                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label={t('dismiss')}
                  className="-mr-1 -mt-1 p-1 text-site-muted hover:text-site-foreground transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mt-1 text-xs text-site-body line-clamp-2">
                {t('installBannerDesc')}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 border border-site-border bg-site-action px-4 py-2 text-xs font-medium text-site-inverse transition-colors hover:bg-site-surface hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  <Download size={14} />
                  {t('installButton')}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2 py-2 text-xs font-medium text-site-muted hover:text-site-foreground transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  {t('dismiss')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <IosInstallModal
        isOpen={showIosModal}
        onClose={() => setShowIosModal(false)}
      />
    </>
  );
}
