import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site.config";
import { fetchPublicEventBySlug } from "@/features/public/events/api";
import { getLocalizedText } from "@/features/public/events/mappers";
import { formatDateRange } from "@/utils/formatters";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const fallbackTitle =
    locale === "de"
      ? "Veranstaltungen & Aktivitäten"
      : locale === "en"
        ? "Events & Activities"
        : "งานบุญและกิจกรรม";
  let title = fallbackTitle;
  let dateText = "";
  let locationText = "";

  try {
    const event = await fetchPublicEventBySlug(slug);
    title = getLocalizedText(event.title, locale) || fallbackTitle;
    dateText = formatDateRange(event.start_date, event.end_date, locale);
    locationText = getLocalizedText(event.location, locale);
  } catch {
    // Graceful fallback
  }

  const siteName = getLocalizedText(siteConfig.siteName, locale) || siteConfig.siteName.th;
  let hostName = "watloungporsai.de";
  try {
    hostName = new URL(siteConfig.domain).hostname;
  } catch {
    // Fallback host
  }
  const bottomTagline =
    locale === "de"
      ? "Buddhistisches Meditationszentrum in Deutschland"
      : locale === "en"
        ? "Buddhist Meditation Center in Germany"
        : "ศูนย์รวมจิตใจชาวพุทธในเยอรมนี";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FFFEF2",
          border: "16px solid #333333",
          padding: "60px 70px",
          fontFamily: "sans-serif",
          color: "#333333",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                backgroundColor: "#945C26",
              }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#945C26",
              }}
            >
              Event & Activity
            </span>
          </div>

          <span
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: "#666666",
            }}
          >
            {siteName}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <h1
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#333333",
              margin: 0,
              maxHeight: "190px",
              overflow: "hidden",
            }}
          >
            {title}
          </h1>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "30px",
              fontSize: 24,
              color: "#666666",
            }}
          >
            {dateText ? (
              <span style={{ display: "flex", alignItems: "center" }}>
                🗓️ {dateText}
              </span>
            ) : null}
            {locationText ? (
              <span style={{ display: "flex", alignItems: "center" }}>
                📍 {locationText}
              </span>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #333333",
            paddingTop: "24px",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "#333333",
            }}
          >
            {hostName}
          </span>
          <span
            style={{
              fontSize: 18,
              color: "#666666",
            }}
          >
            {bottomTagline}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
