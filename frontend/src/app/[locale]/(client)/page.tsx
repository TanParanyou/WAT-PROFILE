import HomeContent from './HomeContent';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PublicHome' });
  const tSite = await getTranslations({ locale, namespace: 'Site' });

  return {
    title: tSite('name'),
    description: t('heroFallbackDescription'),
  };
}


export default function Home() {
  return <HomeContent />;
}
