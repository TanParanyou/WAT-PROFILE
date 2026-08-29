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

interface SingleAlertBannerProps {
  alert: SiteAlert;
}

function SingleAlertBanner({ alert }: SingleAlertBannerProps) {
  const { isDismissed, dismiss } = useDismissibleAlert(alert.id, alert.updated_at);
  const getLocalizedText = useLocalizedText();

  if (isDismissed) return null;

  const title = getLocalizedText(alert.title);
  const message = getLocalizedText(alert.message);
  const actionText = alert.action_text ? getLocalizedText(alert.action_text) : '';

  const severityStyles: Record<SiteAlertSeverity, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
    info: {
      border: 'border-b border-site-border',
      bg: 'bg-site-surface text-site-foreground',
      text: 'text-site-foreground',
      icon: <Info className="w-4 h-4 shrink-0 text-site-accent" aria-hidden="true" />,
    },
    warning: {
      border: 'border-b border-site-accent',
      bg: 'bg-site-surface text-site-foreground',
      text: 'text-site-foreground',
      icon: <AlertTriangle className="w-4 h-4 shrink-0 text-site-accent" aria-hidden="true" />,
    },
    critical: {
      border: 'border-b border-site-danger',
      bg: 'bg-site-surface text-site-foreground',
      text: 'text-site-foreground',
      icon: <AlertCircle className="w-4 h-4 shrink-0 text-site-danger" aria-hidden="true" />,
    },
  };

  const style = severityStyles[alert.severity] || severityStyles.info;
  const isExternal = alert.action_url ? (alert.action_url.startsWith('http://') || alert.action_url.startsWith('https://')) : false;

  return (
    <div
      role="region"
      aria-label="Important Announcement"
      className={`w-full transition-colors ${style.border} ${style.bg} px-4 py-2.5 sm:px-6 relative z-50`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="mt-0.5 sm:mt-0">{style.icon}</div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {title && <span className="font-semibold text-xs uppercase tracking-wider">{title}:</span>}
            <span className="font-normal leading-relaxed">{message}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          {alert.action_url && actionText && (
            isExternal ? (
              <a
                href={alert.action_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider underline hover:opacity-80 py-1 text-site-accent"
              >
                <span>{actionText}</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ) : (
              <Link
                href={alert.action_url}
                className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider underline hover:opacity-80 py-1 text-site-accent"
              >
                <span>{actionText}</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )
          )}

          {alert.is_dismissible && (
            <button
              type="button"
              onClick={dismiss}
              className="p-1 text-site-muted hover:text-site-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-site-focus min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteAlertBanner() {
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/th' || pathname === '/en' || pathname === '/de';

  const { data: alerts = [] } = useQuery<SiteAlert[]>({
    queryKey: ['public-site-alerts'],
    queryFn: publicAlertService.getActiveAlerts,
    staleTime: 60 * 1000,
  });

  const visibleAlerts = alerts.filter((alert) => {
    if (!alert.is_active) return false;
    if (alert.scope === 'home_only' && !isHomePage) return false;
    return alert.display_type === 'top_banner';
  });

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="flex flex-col w-full">
      {visibleAlerts.map((alert) => (
        <SingleAlertBanner key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
