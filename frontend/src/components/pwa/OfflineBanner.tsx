'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const t = useTranslations('Pwa');

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 border-t border-site-border bg-site-surface px-4 py-3 text-sm font-medium text-site-foreground"
    >
      <WifiOff className="size-4 shrink-0 text-site-accent" aria-hidden="true" />
      <span>{t('offlineBanner')}</span>
    </div>
  );
}
