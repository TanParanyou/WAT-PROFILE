"use client";

import HeroSection from "@/components/home/HeroSection";
import WelcomeSection from "@/components/home/WelcomeSection";
import EventsSection from "@/components/home/EventsSection";
import VisitSection from "@/components/home/VisitSection";
import DonationSection from "@/components/home/DonationSection";
import EventAlertModal from "@/components/home/EventAlertModal";

export default function HomeContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection />
      <WelcomeSection />
      <EventsSection />
      <VisitSection />
      <DonationSection />
      <EventAlertModal />
    </div>
  );
}
