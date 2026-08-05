"use client";

import { useState } from "react";
import type { Account } from "../types";

type AccountAvatarSize = "sm" | "md" | "lg" | "xl";

interface AccountAvatarProps {
  account: Pick<Account, "display_name" | "avatar_url">;
  size?: AccountAvatarSize;
  alt?: string;
  className?: string;
}

const sizeClasses: Record<AccountAvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-2xl",
  xl: "size-28 text-4xl",
};

export function AccountAvatar({
  account,
  size = "md",
  alt = "",
  className = "",
}: AccountAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = getInitials(account.display_name);
  const imageFailed = failedUrl === account.avatar_url;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-site-border bg-site-surface font-heading font-semibold text-site-foreground ${sizeClasses[size]} ${className}`}
    >
      {account.avatar_url && !imageFailed ? (
        // Account avatars can come from OAuth providers or the configured
        // storage host, so a plain image keeps this component provider-agnostic.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={account.avatar_url}
          alt={alt}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(account.avatar_url)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts.at(-1)?.slice(0, 1) ?? ""}`.toUpperCase();
}
