import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { websiteCmsPublicService } from "@/services/websiteCmsService";
import { getLocalizedText } from "@/utils/localizedText";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import type { LocalizedText } from "@/types/common";

type PrivacySection = {
  title?: LocalizedText;
  content?: unknown;
};

type PrivacyPageBody = {
  last_updated?: string;
  sections?: PrivacySection[];
};

function readPrivacyBody(value: Record<string, unknown>): PrivacyPageBody {
  const sections = Array.isArray(value.sections) ? value.sections : [];
  return {
    last_updated:
      typeof value.last_updated === "string" && value.last_updated.trim()
        ? value.last_updated
        : undefined,
    sections: sections.filter((section): section is PrivacySection => typeof section === "object" && section !== null),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });
  const cmsPage = await websiteCmsPublicService.getPage("privacy").catch(() => null);
  const body = cmsPage ? readPrivacyBody(cmsPage.body) : { sections: [] };
  const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t("title") : t("title");
  const subtitle = body.last_updated
    ? `${t("lastUpdated")}: ${body.last_updated}`
    : `${t("lastUpdated")}: 2025-01-01`;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <PageHeader title={title} subtitle={subtitle} />

      <PageContainer>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-16">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
            {body.sections?.length ? (
              body.sections.map((section, index) => (
                <section key={`${index}-${getLocalizedText(section.title, locale)}`} className="not-prose mb-10 last:mb-0">
                  <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
                    {getLocalizedText(section.title, locale)}
                  </h2>
                  <RichTextContent value={section.content} locale={locale} defaultLocale="th" className="text-gray-600 dark:text-gray-300" />
                </section>
              ))
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
