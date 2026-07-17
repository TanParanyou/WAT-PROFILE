import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { publicContentService } from "@/services/publicContentService";
import { getLocalizedText } from "@/utils/localizedText";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });
  const pageData = await publicContentService.getPublicPrivacy().catch(() => null);
  
  const title = pageData ? getLocalizedText(pageData.title, locale) || t("title") : t("title");
  
  const lastUpdatedStr = pageData?.body.last_updated || pageData?.updated_at;
  const subtitle = lastUpdatedStr
    ? `${t("lastUpdated")}: ${new Date(lastUpdatedStr).toLocaleDateString(locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US")}`
    : "";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <PageHeader title={title} subtitle={subtitle} />

      <PageContainer>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-16">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
            {pageData && pageData.body.content ? (
              <RichTextContent value={pageData.body.content} locale={locale} defaultLocale="th" className="text-gray-600 dark:text-gray-300" />
            ) : (
              <>
                <p className="lead text-gray-600 dark:text-gray-300">
                  {t("introduction")}
                </p>
                <div className="my-8 h-px bg-gray-100 dark:bg-gray-800 w-full" />
                <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
                  {t("collectionTitle")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  {t("collectionDesc")}
                </p>
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
