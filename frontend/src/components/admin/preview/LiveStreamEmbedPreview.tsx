"use client";

import React from "react";
import { Radio, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { TestLinkButton } from "./TestLinkButton";

function extractYouTubeVideoId(url: string): string | null {
  try {
    const trimmed = url.trim();
    // 1. URLs like youtu.be/<id>
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) return shortMatch[1];

    // 2. URLs like youtube.com/watch?v=<id> or youtube.com/live/<id> or youtube.com/embed/<id>
    const fullMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*?v=|live\/|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (fullMatch && fullMatch[1]) return fullMatch[1];
  } catch {
    return null;
  }
  return null;
}

function getYouTubeEmbedUrl(url: string): { embedUrl: string; videoId: string } | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return {
    embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
    videoId,
  };
}

function getFacebookEmbedUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (trimmed.includes("facebook.com") || trimmed.includes("fb.watch")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false`;
    }
  } catch {
    return null;
  }
  return null;
}

export function LiveStreamEmbedPreview({
  streamUrl,
}: {
  streamUrl?: string;
}) {
  const t = useTranslations("Admin.previews");
  const cleanUrl = (streamUrl || "").trim();
  const isValidUrl = cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://");

  const yt = isValidUrl ? getYouTubeEmbedUrl(cleanUrl) : null;
  const fbEmbed = isValidUrl ? getFacebookEmbedUrl(cleanUrl) : null;
  const embedSrc = yt ? yt.embedUrl : fbEmbed;

  return (
    <div className="space-y-3 border border-admin-border p-4 bg-admin-surface rounded-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-red-600 animate-pulse" />
          <h4 className="text-sm font-semibold text-admin-foreground">
            {t("liveStreamTitle")}
          </h4>
        </div>
        {isValidUrl ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-success bg-admin-success-surface px-2 py-0.5 border border-admin-border">
            <CheckCircle2 size={12} /> {t("liveStreamValid")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-warning bg-admin-warning-surface px-2 py-0.5 border border-admin-border">
            <AlertCircle size={12} /> {t("liveStreamNoUrl")}
          </span>
        )}
      </div>

      {embedSrc ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full border border-admin-border bg-black overflow-hidden">
            <iframe
              src={embedSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Live Stream Preview"
              className="w-full h-full"
            />
          </div>
          {yt && (
            <p className="text-[11px] text-admin-muted flex items-center justify-between">
              <span>YouTube Video ID: <code className="font-mono">{yt.videoId}</code></span>
              <a
                href={cleanUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-admin-action hover:underline font-medium"
              >
                <span>{t("testLiveStream")}</span>
                <ArrowRight size={13} />
              </a>
            </p>
          )}
        </div>
      ) : isValidUrl ? (
        <div className="border border-red-800 bg-red-50 p-4 dark:bg-red-950/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-900 dark:text-red-200">
            <Radio size={14} className="text-red-600" />
            <span>{t("liveStreamCustomLink")}</span>
          </div>
          <p className="text-xs text-red-800 dark:text-red-300 break-all font-mono">
            {cleanUrl}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-admin-surface-muted border border-dashed border-admin-border space-y-2">
          <Radio size={28} className="text-admin-muted" />
          <p className="text-sm font-medium text-admin-foreground">{t("liveStreamPlaceholderTitle")}</p>
          <p className="text-xs text-admin-muted max-w-md">{t("liveStreamPlaceholderDesc")}</p>
        </div>
      )}

      {isValidUrl && !yt && (
        <div className="flex justify-end pt-1">
          <TestLinkButton href={cleanUrl} label={t("testLiveStream")} />
        </div>
      )}
    </div>
  );
}
