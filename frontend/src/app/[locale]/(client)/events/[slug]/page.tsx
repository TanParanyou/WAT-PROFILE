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
import { buildPublicMetadata } from "@/features/public/seo/metadata";
import { emptySeoMetadata } from "@/features/public/seo/schema";
import { serializeJsonLd } from "@/utils/jsonLd";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const tEvents = await getTranslations({ locale, namespace: "EventsPage" });
  const titleFallback = tEvents("title");
  const descriptionFallback = tEvents("subtitle");

  try {
    const event = await fetchPublicEventBySlug(slug);
    const title = getLocalizedText(event.title, locale) || titleFallback;
    const description = event.description ? getLocalizedPlainText(event.description, locale) : descriptionFallback;

    return buildPublicMetadata({
      locale,
      pathname: `/${locale}/events/${slug}`,
      seo: emptySeoMetadata,
      content: { title, description, image: event.image_url ?? undefined },
      messages: { title: titleFallback, description: descriptionFallback },
    });
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
  const eventLocation = initialEvent ? getLocalizedText(initialEvent.location, locale) : "";
  const headerSubtitle = eventLocation || tEvents("subtitle");
  const hasCoverImage = Boolean(initialEvent?.image_url);

  // Structured Data schemas
  const eventSchema = initialEvent ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: headerTitle,
    description: initialEvent.description ? getLocalizedPlainText(initialEvent.description, locale) : headerSubtitle,
    startDate: initialEvent.start_date,
    endDate: initialEvent.end_date || initialEvent.start_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: initialEvent.online_join_url
      ? 'https://schema.org/MixedEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: eventLocation || siteConfig.siteName.th,
      address: siteConfig.contact.address ? getLocalizedText(siteConfig.contact.address, locale) : undefined,
    },
    image: initialEvent.image_url ? [initialEvent.image_url] : undefined,
    organizer: {
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
        name: t('breadcrumbs.events') || 'Events',
        item: `${siteConfig.domain}/${locale}/events`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: headerTitle,
        item: `${siteConfig.domain}/${locale}/events/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {eventSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventSchema) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbsSchema) }}
      />
      <PageHeader
        variant={hasCoverImage ? "image" : "color"}
        align="left"
        width="content"
        title={headerTitle}
        subtitle={headerSubtitle}
        imageSrc={initialEvent?.image_url}
        imageAlt={headerTitle}
      >
        {initialEvent ? (
          <div
            className={`flex flex-wrap gap-x-6 gap-y-3 border-t pt-5 text-sm md:text-base ${
              hasCoverImage
                ? "border-white/30 text-white/90"
                : "border-site-border text-site-body"
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar
                size={16}
                aria-hidden="true"
                className={hasCoverImage ? "text-white/80" : "text-site-accent"}
              />
              {formatDateRange(initialEvent.start_date, initialEvent.end_date, locale)}
            </span>
            {eventLocation ? (
              <span className="flex items-center gap-2">
                <MapPin
                  size={16}
                  aria-hidden="true"
                  className={hasCoverImage ? "text-white/80" : "text-site-accent"}
                />
                {eventLocation}
              </span>
            ) : null}
          </div>
        ) : null}
      </PageHeader>

      <PageContainer width="content">
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
