import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import DetailNavigation from "@/components/common/DetailNavigation";
import { fetchPublicMonkBySlug } from "@/features/public/monks/api";
import { getLocalizedText } from "@/features/public/monks/mappers";
import { MonkDetailContent } from "@/features/public/monks/components/MonkDetailContent";
import { toPublicQueryError } from "@/features/public/shared/query-error";
import type { PublicMonkDto } from "@/features/public/monks/types";
import { buildPublicMetadata } from "@/features/public/seo/metadata";
import { emptySeoMetadata } from "@/features/public/seo/schema";
import { siteConfig } from "@/config/site.config";
import { serializeJsonLd } from "@/utils/jsonLd";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "MonksPage" });

  try {
    const monk = await fetchPublicMonkBySlug(slug);
    const name = getLocalizedText(monk.name, locale) || t("title");
    const title = monk.title ? getLocalizedText(monk.title, locale) : "";

    const description = title ? `${name}, ${title}` : name;
    return buildPublicMetadata({
      locale,
      pathname: `/${locale}/monks/${slug}`,
      seo: emptySeoMetadata,
      content: { title: name, description, image: monk.image_url ?? undefined },
      messages: { title: name, description },
    });
  } catch (error) {
    const queryError = toPublicQueryError(error);
    return queryError.kind === "not-found" ? { title: t("title") } : { title: t("title") };
  }
}

export default async function MonkDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "MonksPage" });

  let initialMonk: PublicMonkDto | undefined;
  try {
    initialMonk = await fetchPublicMonkBySlug(slug);
  } catch (error) {
    const queryError = toPublicQueryError(error);
    if (queryError.kind === "not-found") {
      notFound();
    }
  }

  const monkName = initialMonk ? getLocalizedText(initialMonk.name, locale) : t("title");
  const monkTitle = initialMonk?.title ? getLocalizedText(initialMonk.title, locale) : undefined;

  const monkSchema = initialMonk ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: monkName,
    jobTitle: monkTitle || 'Buddhist Monk',
    image: initialMonk.image_url || undefined,
    worksFor: {
      '@type': 'Organization',
      name: siteConfig.siteName.th,
      url: siteConfig.domain,
    },
  } : null;

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('title') || 'Monks',
        item: `${siteConfig.domain}/${locale}/monks`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: monkName,
        item: `${siteConfig.domain}/${locale}/monks/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-site-canvas text-site-foreground">
      {monkSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(monkSchema) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbsSchema) }}
      />
      <PageHeader variant="color" align="left" width="content" title={monkName} subtitle={monkTitle} />
      <PageContainer width="content">
        <DetailNavigation
          breadcrumbs={[{ label: t("title"), href: "/monks" }, { label: monkName, active: true }]}
          backHref="/monks"
          backLabel={t("backButton")}
        />
        <MonkDetailContent slug={slug} initialMonk={initialMonk} />
      </PageContainer>
    </div>
  );
}
