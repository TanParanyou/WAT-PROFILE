import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { DonationReportForm } from "@/features/public/donations/DonationReportForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DonationReportPage" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/donate/report`,
    seo: normalizeSeo({}),
    content: { title: t("title"), description: t("subtitle") },
    messages: { title: t("title"), description: t("subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function DonationReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DonationReportPage" });
  return (
    <main className="bg-site-surface px-6 py-[clamp(4rem,9vw,8rem)] text-site-foreground sm:px-10 lg:px-[8vw]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 grid gap-5">
          <Link href="/#donate" className="w-fit text-sm font-semibold text-site-accent underline decoration-site-accent/40 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t("backToDonation")}</Link>
          <p className="text-sm text-site-muted">{t("title")}</p>
          <h1 className="max-w-[18ch] text-balance font-heading text-[clamp(2.5rem,6vw,5.5rem)] font-normal leading-[1.08]">{t("title")}</h1>
          <p className="max-w-[65ch] text-lg leading-8 text-site-body">{t("subtitle")}</p>
        </div>
        <DonationReportForm />
      </div>
    </main>
  );
}
