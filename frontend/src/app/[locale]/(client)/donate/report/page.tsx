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
          <Link href="/#donate" className="inline-flex min-h-11 w-fit items-center px-2 py-2 text-sm font-semibold text-site-accent underline decoration-site-accent/40 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">{t("backToDonation")}</Link>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-site-muted">{t("afterTransfer")}</p>
          <h1 className="max-w-[18ch] text-balance font-heading text-[clamp(2.5rem,6vw,5.5rem)] font-normal leading-[1.08]">{t("title")}</h1>
          <p className="max-w-[65ch] text-lg leading-8 text-site-body">{t("subtitle")}</p>
        </div>
        <div className="mb-10 grid gap-4 border-y border-site-border py-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
          <span className="h-2 w-2 bg-site-action sm:ml-1" aria-hidden="true" />
          <p className="text-sm leading-6 text-site-body">{t("afterTransferHint")}</p>
        </div>
        <DonationReportForm />
      </div>
    </main>
  );
}
