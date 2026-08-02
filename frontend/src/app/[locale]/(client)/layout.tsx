import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickySocials from "@/components/layout/StickySocials";
import CookieConsent from "@/components/layout/CookieConsent";
import JsonLd from "@/components/seo/JsonLd";
import { PublicSiteSettingsProvider } from "@/features/public/settings/PublicSiteSettingsProvider";
import { PublicThemeProvider } from "@/components/public/theme/PublicThemeProvider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicThemeProvider>
      <div className="public-theme flex min-h-screen flex-col bg-site-canvas text-site-foreground">
        <PublicSiteSettingsProvider>
          <Navbar />
          <main className="grow">{children}</main>
          <Footer />
          <StickySocials />
          <CookieConsent />
          <JsonLd />
        </PublicSiteSettingsProvider>
      </div>
    </PublicThemeProvider>
  );
}
