'use client';

import { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import IosInstallModal from '@/components/pwa/IosInstallModal';

interface AdminPwaInstallButtonProps {
  className?: string;
  variant?: 'icon' | 'button';
}

export default function AdminPwaInstallButton({
  className = '',
  variant = 'icon',
}: AdminPwaInstallButtonProps) {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);
  const t = useTranslations('Admin.pwa');

  if (isInstalled || (!canInstall && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }
    await promptInstall();
  };

  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-2 border border-admin-border bg-admin-surface px-3 py-2 text-xs font-medium text-admin-foreground transition-colors hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus ${className}`}
        >
          <Download size={15} className="shrink-0 text-admin-action" aria-hidden="true" />
          <span>{t('installApp')}</span>
        </button>

        <IosInstallModal
          isOpen={showIosModal}
          onClose={() => setShowIosModal(false)}
          isAdmin
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex size-11 min-h-11 min-w-11 items-center justify-center rounded-none p-2 text-admin-muted transition-colors hover:bg-admin-surface-muted hover:text-admin-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus ${className}`}
        title={t('installApp')}
        aria-label={t('installApp')}
      >
        <Download size={19} aria-hidden="true" />
      </button>

      <IosInstallModal
        isOpen={showIosModal}
        onClose={() => setShowIosModal(false)}
        isAdmin
      />
    </>
  );
}
