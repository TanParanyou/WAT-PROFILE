import type { Metadata } from "next";
import type { LocalizedTextDto } from "../shared/api-types";
import type { SeoMetadata } from "./schema";
import { seoMetadataSchema } from "./schema";

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
  site: {
    name: string;
    description: string;
    image: string;
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
  const resolvedTitle = title || input.content.title || input.messages.title || input.site.name;
  const resolvedDescription = description || input.content.description || input.messages.description || input.site.description;
  const image = input.seo.og_image || input.content.image || input.site.image;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: keywords || undefined,
    robots: input.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: input.seo.canonical_url || input.pathname },
  };
}
