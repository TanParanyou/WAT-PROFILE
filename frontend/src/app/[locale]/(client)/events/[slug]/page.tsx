import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Calendar, MapPin } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import DetailNavigation from "@/components/common/DetailNavigation";
import { fetchPublicEventBySlug } from "@/features/public/events/api";
import { EventDetailContent } from "@/features/public/events/components/EventDetailContent";
import { getLocalizedText } from "@/features/public/events/mappers";
import type { PublicEventDto } from "@/features/public/events/types";
import { toPublicQueryError } from "@/features/public/shared/query-error";
import { getLocalizedPlainText } from "@/features/public/shared/rich-text";
import { formatDateRange } from "@/utils/formatters";
import { siteConfig } from "@/config/site.config";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const tEvents = await getTranslations({ locale, namespace: "EventsPage" });
  const titleFallback = `${tEvents("title")} - ${siteConfig.siteName.th}`;
  const descriptionFallback = tEvents("subtitle");

  try {
    const event = await fetchPublicEventBySlug(slug);
    const title = getLocalizedText(event.title, locale);
    const description = event.description ? getLocalizedPlainText(event.description, locale) : descriptionFallback;

    return {
      title: `${title} - ${siteConfig.siteName.th}`,
      description,
      openGraph: {
        title,
        description,
        images: event.image_url ? [event.image_url] : undefined,
        type: "article",
      },
      alternates: {
        canonical: `/${locale}/events/${slug}`,
        languages: {
          th: `/th/events/${slug}`,
          en: `/en/events/${slug}`,
          de: `/de/events/${slug}`,
        },
      },
    };
  } catch (error) {
    const queryError = toPublicQueryError(error);
    if (queryError.kind === "not-found") {
      return { title: titleFallback, description: descriptionFallback };
    }
    return {
      title: titleFallback,
      description: descriptionFallback,
      openGraph: {
        title: titleFallback,
        description: descriptionFallback,
        images: [{ url: siteConfig.seo.defaultOgImage, width: 1200, height: 630 }],
      },
    };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventDetailPage" });
  const tEvents = await getTranslations({ locale, namespace: "EventsPage" });

  let initialEvent: PublicEventDto | undefined;
  try {
    initialEvent = await fetchPublicEventBySlug(slug);
  } catch (error) {
    const queryError = toPublicQueryError(error);
    if (queryError.kind === "not-found") {
      notFound();
    }
  }

  const headerTitle = initialEvent ? getLocalizedText(initialEvent.title, locale) : tEvents("title");
  const headerSubtitle = initialEvent ? getLocalizedText(initialEvent.location, locale) : tEvents("subtitle");

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-zinc-950">
      <PageHeader title={headerTitle} subtitle={headerSubtitle}>
        {initialEvent ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-white/90 md:text-base">
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Calendar size={16} />
              {formatDateRange(initialEvent.start_date, initialEvent.end_date, locale)}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
              <MapPin size={16} />
              {getLocalizedText(initialEvent.location, locale)}
            </span>
          </div>
        ) : null}
      </PageHeader>

      <PageContainer>
        <DetailNavigation
          breadcrumbs={[
            { label: t("breadcrumbs.events"), href: "/events" },
            { label: headerTitle, active: true },
          ]}
          backHref="/events"
          backLabel={t("backToEvents")}
        />

        <EventDetailContent slug={slug} initialEvent={initialEvent} />
      </PageContainer>
    </div>
  );
}
