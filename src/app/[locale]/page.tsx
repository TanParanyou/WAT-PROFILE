import HeroSection from '@/components/home/HeroSection';
import WelcomeSection from '@/components/home/WelcomeSection';
import EventsSection from '@/components/home/EventsSection';
import DonationSection from '@/components/home/DonationSection';
import EventAlertModal from '@/components/home/EventAlertModal';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'WelcomeSection' });
  const tSite = await getTranslations({ locale, namespace: 'Site' });

  return {
    title: tSite('name'),
    description: t('description'),
  };
}


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <WelcomeSection />
      <EventsSection />
      <DonationSection />
      <EventAlertModal />
    </div>
  );
}
