import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import AboutContent from './AboutContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'AboutPage' });

    return {
        title: t('title'),
        description: t('missionDesc'),
    };
}

export default function AboutPage() {
    return <AboutContent />;
}
