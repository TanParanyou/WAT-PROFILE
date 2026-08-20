import type { Metadata } from "next";
import type { LocalizedTextDto } from "../shared/api-types";
import type { SeoMetadata } from "./schema";
import { seoMetadataSchema } from "./schema";

import { siteConfig } from "@/config/site.config";
import { getLocalizedText } from "@/utils/localizedText";

export interface PublicMetadataInput {
  locale: string;
  pathname: string;
  seo: SeoMetadata;
  content: {
    title: string;
    description: string;
    image?: string;
  };
  messages: {
    title: string;
    description: string;
  };
  site?: {
    name: string;
    description: string;
    image: string;
  };
}

export function getDefaultSiteSeo(locale: string) {
  return {
    name: getLocalizedText(siteConfig.siteName, locale) || siteConfig.siteName.th,
    description: siteConfig.seo.defaultDescription,
    image: siteConfig.seo.defaultOgImage,
  };
}

export function normalizeSeo(value: unknown): SeoMetadata {
  return seoMetadataSchema.parse(value ?? {});
}

function localized(value: LocalizedTextDto, locale: string): string {
  if (locale === "th" || locale === "en" || locale === "de") {
    return value[locale] || value.en || value.th || value.de;
  }
  return value.en || value.th || value.de;
}

export function buildPublicMetadata(input: PublicMetadataInput): Metadata {
  const title = input.seo.title ? localized(input.seo.title, input.locale) : "";
  const description = input.seo.description ? localized(input.seo.description, input.locale) : "";
  const keywords = input.seo.keywords ? localized(input.seo.keywords, input.locale) : "";
  const defaultSite = getDefaultSiteSeo(input.locale);
  const site = input.site ?? defaultSite;
  const resolvedTitle = title || input.content.title || input.messages.title || site.name;
  const resolvedDescription = description || input.content.description || input.messages.description || site.description;
  const image = input.seo.og_image || input.content.image || site.image;

  const cleanPath = input.pathname.replace(/^\/(th|en|de)(\/|$)/, '/').replace(/^\/?/, '/');
  const normalizedPath = cleanPath === '/' ? '' : cleanPath;

  const languages: Record<string, string> = {
    th: `/th${normalizedPath}`,
    en: `/en${normalizedPath}`,
    de: `/de${normalizedPath}`,
    'x-default': `/th${normalizedPath}`,
  };

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: keywords || undefined,
    ...(input.seo.noindex
      ? { robots: { index: false, follow: false } }
      : {}),
    openGraph: {
      type: "website",
      locale: input.locale,
      title: resolvedTitle,
      description: resolvedDescription,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: input.seo.canonical_url || input.pathname,
      languages,
    },
  };
}
