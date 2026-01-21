import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Providers } from '../providers';
import { Prompt, Chonburi } from 'next/font/google';
import '../globals.css';
import { siteConfig } from '@/config/site.config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: siteConfig.seo.defaultTitle,
        template: siteConfig.seo.titleTemplate,
    },
    description: siteConfig.seo.defaultDescription,
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
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
