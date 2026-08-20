import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { DonationReportPageContent } from "@/features/public/donations/DonationReportPageContent";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DonationReportPage" });
  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/donate/report`,
    seo: normalizeSeo({}),
    content: { title: t("title"), description: t("subtitle") },
    messages: { title: t("title"), description: t("subtitle") },
  });
}

export default function DonationReportPage() {
  return (
    <main className="bg-site-surface px-6 py-[clamp(4rem,9vw,8rem)] text-site-foreground sm:px-10 lg:px-[8vw]">
      <div className="mx-auto max-w-2xl">
        <DonationReportPageContent />
      </div>
    </main>
  );
}
