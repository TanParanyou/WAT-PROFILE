import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/routing";
import { Providers } from "../providers";
import "../globals.css";
import { siteConfig } from "@/config/site.config";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.theme.colorPrimary },
    { media: "(prefers-color-scheme: dark)", color: "#1a120b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: {
    default: siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.defaultDescription,
  keywords: siteConfig.seo.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.siteShortName || siteConfig.siteName.th,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.defaultLocale,
    url: siteConfig.domain,
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    siteName: siteConfig.siteName.th,
    images: [
      {
        url: siteConfig.seo.defaultOgImage,
        width: 1200,
        height: 630,
        alt: siteConfig.siteName.th,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    images: [siteConfig.seo.defaultOgImage],
    creator: "@watloungporsai", // Placeholder or remove if not available
  },
  alternates: {
    canonical: "/",
    languages: {
      th: "/th",
      en: "/en",
      de: "/de",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: siteConfig.seo.verification?.google,
    other: siteConfig.seo.verification?.bing
      ? { "msvalidate.01": siteConfig.seo.verification.bing }
      : undefined,
  },
};


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "th" | "en" | "de")) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
