import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickySocials from "@/components/layout/StickySocials";
import CookieConsent from "@/components/layout/CookieConsent";
import JsonLd from "@/components/seo/JsonLd";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import OfflineBanner from "@/components/pwa/OfflineBanner";
import { PublicSiteSettingsProvider } from "@/features/public/settings/PublicSiteSettingsProvider";
import { PublicThemeProvider } from "@/components/public/theme/PublicThemeProvider";
import { AccountSessionProvider } from "@/features/public/account/AccountSessionProvider";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { SiteAlertBanner } from "@/components/public/SiteAlertBanner";
import { SiteAlertModal } from "@/components/public/SiteAlertModal";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicThemeProvider>
      <div className="public-theme flex min-h-screen flex-col bg-site-canvas text-site-foreground">
        <AccountSessionProvider>
          <PublicSiteSettingsProvider>
            <AnalyticsTracker />
            <ServiceWorkerRegister />
            <div className="fixed top-0 left-0 right-0 z-50 w-full flex flex-col">
              <SiteAlertBanner />
              <Navbar />
            </div>
            <SiteAlertModal />
            <CookieConsent />
            <main className="grow">{children}</main>
            <Footer />
            <StickySocials />
            <ChatWidget />
            <JsonLd />
            <OfflineBanner />
            <div id="public-modal-root" />
          </PublicSiteSettingsProvider>
        </AccountSessionProvider>
      </div>
    </PublicThemeProvider>
  );
}


