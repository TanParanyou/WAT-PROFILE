import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { Building2, MapPin, Phone } from "lucide-react";
import { websiteCmsPublicService } from "@/services/websiteCmsService";
import { getLocalizedText } from "@/utils/localizedText";
import type { LocalizedText } from "@/types/common";

type ImpressumPageBody = {
  organization_name?: LocalizedText;
  address?: LocalizedText;
  phone?: string;
  email?: string;
};

function readImpressumBody(value: Record<string, unknown>): ImpressumPageBody {
  return {
    organization_name:
      typeof value.organization_name === "object" && value.organization_name !== null
        ? (value.organization_name as LocalizedText)
        : undefined,
    address:
      typeof value.address === "object" && value.address !== null
        ? (value.address as LocalizedText)
        : undefined,
    phone: typeof value.phone === "string" ? value.phone : undefined,
    email: typeof value.email === "string" ? value.email : undefined,
  };
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ImpressumPage" });
  const tSite = await getTranslations({ locale, namespace: "Site" });
  const cmsPage = await websiteCmsPublicService.getPage("impressum").catch(() => null);
  const body = cmsPage ? readImpressumBody(cmsPage.body) : {};
  const pageTitle = cmsPage ? getLocalizedText(cmsPage.title, locale) || t("title") : t("title");
  const organizationName = getLocalizedText(body.organization_name, locale);
  const address = getLocalizedText(body.address, locale);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <PageHeader title={pageTitle} subtitle={tSite("location")} />

      <PageContainer>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12">
            {/* Company Section */}
            <div className="mb-10">
              <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <Building2 className="text-primary" size={24} />
                {t("companyName")}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 ml-9">
                {organizationName}
              </p>
            </div>

            {/* Address Section */}
            <div className="mb-10">
              <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <MapPin className="text-primary" size={24} />
                {t("address")}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 ml-9 whitespace-pre-line">
                {address}
              </p>
            </div>

            {/* Contact Section */}
            <div>
              <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <Phone className="text-primary" size={24} />
                {t("contact")}
              </h2>
              <div className="ml-9 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900 dark:text-white min-w-20">
                    {t("phone")}:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {body.phone}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900 dark:text-white min-w-20">
                    {t("email")}:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {body.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
