'use client';

import { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import IosInstallModal from './IosInstallModal';

interface PwaInstallButtonProps {
  className?: string;
  variant?: 'button' | 'link' | 'navbar' | 'mobile-menu' | 'footer';
  onInstalled?: () => void;
}

export default function PwaInstallButton({
  className = '',
  variant = 'button',
  onInstalled,
}: PwaInstallButtonProps) {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);
  const t = useTranslations('Pwa');

  if (isInstalled || (!canInstall && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }
    const result = await promptInstall();
    if (result && onInstalled) {
      onInstalled();
    }
  };

  // Navbar compact icon button (Desktop)
  if (variant === 'navbar') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex size-11 shrink-0 items-center justify-center border border-site-border bg-site-canvas text-site-foreground transition-colors hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus ${className}`}
          title={t('installApp')}
          aria-label={t('installApp')}
        >
          <Download className="size-5 shrink-0" aria-hidden="true" />
        </button>

        <IosInstallModal
          isOpen={showIosModal}
          onClose={() => setShowIosModal(false)}
        />
      </>
    );
  }

  // Mobile navigation drawer full-width button
  if (variant === 'mobile-menu') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`flex min-h-12 w-full items-center justify-center gap-2.5 border border-site-border bg-site-surface px-4 py-3 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-canvas hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${className}`}
        >
          <Download className="size-4 shrink-0 text-site-accent" aria-hidden="true" />
          <span>{t('installApp')}</span>
        </button>

        <IosInstallModal
          isOpen={showIosModal}
          onClose={() => setShowIosModal(false)}
        />
      </>
    );
  }

  // Footer / Text link
  if (variant === 'link' || variant === 'footer') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-2 text-sm text-site-body transition-colors hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${className}`}
        >
          <Download className="size-4 shrink-0 text-site-accent" aria-hidden="true" />
          <span>{t('installApp')}</span>
        </button>

        <IosInstallModal
          isOpen={showIosModal}
          onClose={() => setShowIosModal(false)}
        />
      </>
    );
  }

  // Default standard button (0px radius, 44px min-height, asymmetric padding)
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex min-h-11 items-center justify-center gap-2.5 border border-site-border bg-site-canvas px-6 pb-3 pt-3.5 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${className}`}
      >
        <Download className="size-4 shrink-0 text-site-accent" aria-hidden="true" />
        <span>{t('installApp')}</span>
      </button>

      <IosInstallModal
        isOpen={showIosModal}
        onClose={() => setShowIosModal(false)}
      />
    </>
  );
}
