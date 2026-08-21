import { siteConfig } from "@/config/site.config";

export function toAbsoluteUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const baseDomain = siteConfig.domain.replace(/\/+$/, "");
  return `${baseDomain}${cleanPath}`;
}
