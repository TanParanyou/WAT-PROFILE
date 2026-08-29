'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { AlertCircle, AlertTriangle, Info, X, ExternalLink, ChevronRight } from 'lucide-react';
import { publicAlertService } from '@/services/alertService';
import { useDismissibleAlert } from '@/hooks/useDismissibleAlert';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { SiteAlert, SiteAlertSeverity } from '@/types/alert';

interface SingleAlertModalProps {
  alert: SiteAlert;
}

function SingleAlertModal({ alert }: SingleAlertModalProps) {
  const { isDismissed, dismiss } = useDismissibleAlert(alert.id, alert.updated_at);
  const getLocalizedText = useLocalizedText();

  if (isDismissed) return null;

  const title = getLocalizedText(alert.title);
  const message = getLocalizedText(alert.message);
  const actionText = alert.action_text ? getLocalizedText(alert.action_text) : '';

  const severityHeaderStyles: Record<SiteAlertSeverity, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
    info: {
      border: 'border-b border-site-border',
      bg: 'bg-site-surface text-site-foreground',
      text: 'text-site-foreground',
      icon: <Info className="w-5 h-5 text-site-accent" aria-hidden="true" />,
    },
    warning: {
      border: 'border-b border-site-accent',
      bg: 'bg-site-surface text-site-foreground',
      text: 'text-site-accent',
      icon: <AlertTriangle className="w-5 h-5 text-site-accent" aria-hidden="true" />,
    },
    critical: {
      border: 'border-b border-site-danger',
      bg: 'bg-site-surface text-site-foreground',
      text: 'text-site-danger',
      icon: <AlertCircle className="w-5 h-5 text-site-danger" aria-hidden="true" />,
    },
  };

  const style = severityHeaderStyles[alert.severity] || severityHeaderStyles.info;
  const isExternal = alert.action_url ? (alert.action_url.startsWith('http://') || alert.action_url.startsWith('https://')) : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`alert-modal-title-${alert.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-site-scrim"
    >
      <div className="relative w-full max-w-lg border border-site-border bg-site-canvas text-site-foreground shadow-none">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-5 ${style.border} ${style.bg}`}>
          <div className="flex items-center gap-2.5">
            {style.icon}
            <h2 id={`alert-modal-title-${alert.id}`} className="text-base sm:text-lg font-serif font-medium tracking-tight">
              {title}
            </h2>
          </div>
          {alert.is_dismissible && (
            <button
              type="button"
              onClick={dismiss}
              className="p-1 text-site-muted hover:text-site-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-site-focus min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-sm sm:text-base leading-relaxed text-site-body">
          <p className="whitespace-pre-line">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-site-border bg-site-surface">
          {alert.is_dismissible && (
            <button
              type="button"
              onClick={dismiss}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider border border-site-border bg-site-canvas hover:bg-site-surface text-site-foreground transition-colors"
            >
              {getLocalizedText({ th: 'ปิด', en: 'Close', de: 'Schließen' })}
            </button>
          )}

          {alert.action_url && actionText && (
            isExternal ? (
              <a
                href={alert.action_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wider border border-site-action bg-site-action text-site-canvas hover:opacity-90 transition-opacity"
              >
                <span>{actionText}</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ) : (
              <Link
                href={alert.action_url}
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wider border border-site-action bg-site-action text-site-canvas hover:opacity-90 transition-opacity"
              >
                <span>{actionText}</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteAlertModal() {
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/th' || pathname === '/en' || pathname === '/de';

  const { data: alerts = [] } = useQuery<SiteAlert[]>({
    queryKey: ['public-site-alerts'],
    queryFn: publicAlertService.getActiveAlerts,
    staleTime: 60 * 1000,
  });

  const visibleModals = alerts.filter((alert) => {
    if (!alert.is_active) return false;
    if (alert.scope === 'home_only' && !isHomePage) return false;
    return alert.display_type === 'modal_popup';
  });

  if (visibleModals.length === 0) return null;

  return (
    <>
      {visibleModals.map((alert) => (
        <SingleAlertModal key={alert.id} alert={alert} />
      ))}
    </>
  );
}
