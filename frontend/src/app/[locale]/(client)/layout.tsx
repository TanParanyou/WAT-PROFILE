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
            <ServiceWorkerRegister />
            <Navbar />
            <CookieConsent />
            <main className="grow">{children}</main>
            <Footer />
            <StickySocials />
            <JsonLd />
            <OfflineBanner />
            <div id="public-modal-root" />
          </PublicSiteSettingsProvider>
        </AccountSessionProvider>
      </div>
    </PublicThemeProvider>
  );
}


