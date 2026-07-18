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

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    const monk = await fetchPublicMonkBySlug(slug);
    const name = getLocalizedText(monk.name, locale);
    const title = monk.title ? getLocalizedText(monk.title, locale) : "";

    return {
      title: `${name} - Wat Loung Por Sai`,
      description: title ? `${name}, ${title}` : name,
      openGraph: {
        title: name,
        description: title ? `${name}, ${title}` : name,
        images: monk.image_url ? [monk.image_url] : undefined,
      },
    };
  } catch (error) {
    const queryError = toPublicQueryError(error);
    return queryError.kind === "not-found" ? { title: "Monk Not Found" } : { title: "Monk" };
  }
}

export default async function MonkDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations("MonksPage");

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

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-zinc-950">
      <PageHeader title={monkName} subtitle={monkTitle} />
      <PageContainer>
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
