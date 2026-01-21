import HeroSection from '@/components/home/HeroSection';
import WelcomeSection from '@/components/home/WelcomeSection';
import EventsSection from '@/components/home/EventsSection';
import DonationSection from '@/components/home/DonationSection';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <WelcomeSection />
      <EventsSection />
      <DonationSection />
    </div>
  );
}
