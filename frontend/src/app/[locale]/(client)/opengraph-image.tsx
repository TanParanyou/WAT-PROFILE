import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site.config";
import { getLocalizedText } from "@/utils/localizedText";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const siteName = getLocalizedText(siteConfig.siteName, locale) || siteConfig.siteName.th;
  const tagline = getLocalizedText(siteConfig.tagline, locale) || siteConfig.seo.defaultDescription;
  const location = siteConfig.contact.addressDetails
    ? `${siteConfig.contact.addressDetails.addressLocality}, ${siteConfig.contact.addressDetails.addressCountry}`
    : "Biebergemünd, Germany";

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
              Buddhist Meditation Center
            </span>
          </div>

          <span
            style={{
              fontSize: 20,
              color: "#666666",
            }}
          >
            {location}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#333333",
              margin: 0,
            }}
          >
            {siteName}
          </h1>
          <p
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#666666",
              margin: 0,
              maxWidth: "950px",
            }}
          >
            {tagline}
          </p>
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
            Wat Loung Por Sai
          </span>
          <span
            style={{
              fontSize: 18,
              color: "#666666",
            }}
          >
            ศูนย์รวมจิตใจและการปฏิบัติธรรม
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
