'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

export function AdminOfflineBanner() {

  const isOnline = useOnlineStatus();
  const t = useTranslations('Admin.pwa');

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 border-t border-admin-border bg-admin-surface px-4 py-2.5 text-xs font-medium text-admin-foreground shadow-md"
    >
      <WifiOff className="size-4 shrink-0 text-admin-danger animate-pulse" aria-hidden="true" />
      <span>{t('offlineBanner')}</span>
    </div>
  );
}
