'use client';

import { useTranslations } from 'next-intl';
import { Share, PlusSquare, X } from 'lucide-react';
import Image from 'next/image';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function IosInstallModal({ isOpen, onClose, isAdmin = false }: IosInstallModalProps) {
  const t = useTranslations(isAdmin ? 'Admin.pwa' : 'Pwa');

  if (!isOpen) return null;

  const overlayClass = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs';
  const containerClass = isAdmin
    ? 'w-full max-w-sm border border-admin-border bg-admin-surface p-6 text-admin-foreground shadow-lg'
    : 'w-full max-w-sm border border-site-border bg-site-canvas p-6 text-site-foreground shadow-lg';

  const headerBorderClass = isAdmin ? 'border-b border-admin-border' : 'border-b border-site-border';
  const iconBoxClass = isAdmin ? 'border border-admin-border bg-admin-surface-muted' : 'border border-site-border bg-site-surface';
  const closeBtnClass = isAdmin ? 'text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground' : 'text-site-muted hover:bg-site-surface hover:text-site-foreground';
  const stepNumClass = isAdmin ? 'bg-admin-surface-muted text-admin-action border border-admin-border' : 'bg-site-surface text-site-accent border border-site-border';
  const footerBorderClass = isAdmin ? 'border-t border-admin-border' : 'border-t border-site-border';
  const footerBtnClass = isAdmin
    ? 'w-full border border-admin-border bg-admin-surface-muted py-2.5 text-sm font-medium text-admin-foreground hover:bg-admin-surface'
    : 'w-full border border-site-border bg-site-surface py-2.5 text-sm font-medium text-site-foreground hover:bg-site-surface/80';

  return (
    <div className={overlayClass} onClick={onClose} role="dialog" aria-modal="true">
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between pb-4 ${headerBorderClass}`}>
          <div className="flex items-center gap-3">
            <div className={`relative size-10 overflow-hidden ${iconBoxClass}`}>
              <Image src="/icons/icon-192x192.png" alt="" fill sizes="40px" className="object-cover" />
            </div>
            <h3 className="font-heading font-medium text-base">
              {t('iosGuideTitle')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className={`p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${closeBtnClass}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <div className={`flex size-7 shrink-0 items-center justify-center font-semibold text-xs ${stepNumClass}`}>
              1
            </div>
            <div className="flex-1 pt-0.5">
              <p className="flex items-center gap-1.5 flex-wrap">
                {t('iosGuideStep1')}
                <Share size={16} className="inline text-blue-500" aria-hidden="true" />
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`flex size-7 shrink-0 items-center justify-center font-semibold text-xs ${stepNumClass}`}>
              2
            </div>
            <div className="flex-1 pt-0.5">
              <p className="flex items-center gap-1.5 flex-wrap">
                {t('iosGuideStep2')}
                <PlusSquare size={16} className="inline text-site-accent" aria-hidden="true" />
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`flex size-7 shrink-0 items-center justify-center font-semibold text-xs ${stepNumClass}`}>
              3
            </div>
            <div className="flex-1 pt-0.5">
              <p>{t('iosGuideStep3')}</p>
            </div>
          </div>
        </div>

        <div className={`mt-6 pt-4 ${footerBorderClass}`}>
          <button
            type="button"
            onClick={onClose}
            className={`transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${footerBtnClass}`}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
