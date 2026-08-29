'use client';

import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Check, Facebook, Twitter } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ShareButtonsProps {
  title: string;
  description?: string;
}

export function ShareButtons({ title, description }: ShareButtonsProps) {
  const t = useTranslations('news');
  const [copied, setCopied] = useState(false);

  const getUrl = () => (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: getUrl(),
        });
      } catch {
        // Ignored if cancelled
      }
    }
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(getUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const handleLineShare = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(title);
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank', 'width=600,height=500');
  };

  const handleXShare = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
  };

  const isNativeShareSupported = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 border border-site-border bg-site-surface text-site-foreground">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-site-muted">
        <Share2 className="w-4 h-4 text-site-accent" />
        <span>{t('shareArticle')}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Facebook */}
        <button
          type="button"
          onClick={handleFacebookShare}
          className="p-2 border border-site-border bg-site-canvas hover:bg-site-surface text-site-foreground transition-colors"
          title="Share to Facebook"
          aria-label="Share to Facebook"
        >
          <Facebook className="w-4 h-4" />
        </button>

        {/* LINE */}
        <button
          type="button"
          onClick={handleLineShare}
          className="px-2.5 py-1 text-xs font-bold border border-site-border bg-site-canvas hover:bg-site-surface text-site-foreground transition-colors"
          title="Share to LINE"
          aria-label="Share to LINE"
        >
          LINE
        </button>

        {/* X / Twitter */}
        <button
          type="button"
          onClick={handleXShare}
          className="p-2 border border-site-border bg-site-canvas hover:bg-site-surface text-site-foreground transition-colors"
          title="Share to X"
          aria-label="Share to X"
        >
          <Twitter className="w-4 h-4" />
        </button>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-site-border bg-site-canvas hover:bg-site-surface text-site-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-site-accent" /> : <LinkIcon className="w-3.5 h-3.5" />}
          <span>{copied ? t('linkCopied') : t('copyLink')}</span>
        </button>

        {/* Native Web Share API if supported */}
        {isNativeShareSupported && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-site-action bg-site-action text-site-canvas hover:opacity-90 transition-opacity"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t('more')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
