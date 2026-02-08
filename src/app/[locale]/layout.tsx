import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StickySocials from '@/components/layout/StickySocials';
import CookieConsent from '@/components/layout/CookieConsent';
import { Providers } from '../providers';
import JsonLd from '@/components/seo/JsonLd';
import { Prompt, Chonburi } from 'next/font/google';
import '../globals.css';
import { siteConfig } from '@/config/site.config';
import type { Metadata } from 'next';

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
    openGraph: {
        type: 'website',
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
        card: 'summary_large_image',
        title: siteConfig.seo.defaultTitle,
        description: siteConfig.seo.defaultDescription,
        images: [siteConfig.seo.defaultOgImage],
        creator: '@watloungporsai', // Placeholder or remove if not available
    },
    alternates: {
        canonical: '/',
        languages: {
            th: '/th',
            en: '/en',
            de: '/de',
        },
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png', // Assuming this exists or will be added
    },
};

const prompt = Prompt({
    subsets: ['thai', 'latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-prompt',
    display: 'swap',
});

const chonburi = Chonburi({
    subsets: ['thai', 'latin'],
    weight: ['400'],
    variable: '--font-chonburi',
    display: 'swap',
});

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${prompt.variable} ${chonburi.variable} antialiased flex flex-col min-h-screen`}>
                <NextIntlClientProvider messages={messages}>
                    <Providers>
                        <Navbar />
                        <main className="grow">{children}</main>
                        <Footer />
                        <StickySocials />
                        <CookieConsent />
                        <JsonLd />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
