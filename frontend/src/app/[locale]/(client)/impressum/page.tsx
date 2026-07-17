import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { Building2, MapPin, Phone, Scale, UserCheck, ShieldCheck } from "lucide-react";
import { publicContentService } from "@/services/publicContentService";
import { getLocalizedText } from "@/utils/localizedText";

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ImpressumPage" });
  const tSite = await getTranslations({ locale, namespace: "Site" });
  const pageData = await publicContentService.getPublicImpressum().catch(() => null);

  const pageTitle = pageData ? getLocalizedText(pageData.title, locale) || t("title") : t("title");
  const organizationName = pageData ? getLocalizedText(pageData.body.organization_name, locale) : "";
  const legalForm = pageData ? getLocalizedText(pageData.body.legal_form, locale) : "";
  const address = pageData ? getLocalizedText(pageData.body.address, locale) : "";
  const phone = pageData ? pageData.body.phone : "";
  const email = pageData ? pageData.body.email : "";
  const representative = pageData ? getLocalizedText(pageData.body.representative, locale) : "";
  const registryCourt = pageData ? getLocalizedText(pageData.body.registry_court, locale) : "";
  const registryNumber = pageData ? pageData.body.registry_number : "";
  const vatId = pageData ? pageData.body.vat_id : "";
  const contentResponsibility = pageData ? getLocalizedText(pageData.body.content_responsibility, locale) : "";
  const hasContent = !!(
    organizationName ||
    legalForm ||
    address ||
    phone ||
    email ||
    representative ||
    registryCourt ||
    registryNumber ||
    vatId ||
    contentResponsibility
  );

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <PageHeader title={pageTitle} subtitle={tSite("location")} />

      <PageContainer>
        <div className="max-w-3xl mx-auto">
          {!pageData || !hasContent ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-400">
              {t("noData")}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12 space-y-10">
            {/* Company / Organization Section */}
            <div>
              <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <Building2 className="text-primary" size={24} />
                ข้อมูลสมาคม / สมาคมผู้จัดตั้ง
              </h2>
              <div className="ml-9 space-y-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {organizationName}
                </p>
                {legalForm && (
                  <p className="text-sm text-zinc-500">
                    รูปแบบทางกฎหมาย: {legalForm}
                  </p>
                )}
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <MapPin className="text-primary" size={24} />
                ที่ตั้งสมาคม
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 ml-9 whitespace-pre-line leading-relaxed">
                {address}
              </p>
            </div>

            {/* Representative Section */}
            {representative && (
              <div>
                <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <UserCheck className="text-primary" size={24} />
                  ผู้แทนทางกฎหมาย (Vertreten durch)
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 ml-9">
                  {representative}
                </p>
              </div>
            )}

            {/* Registration Details */}
            {(registryCourt || registryNumber || vatId) && (
              <div>
                <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <Scale className="text-primary" size={24} />
                  ข้อมูลจดทะเบียน (Registereintragung)
                </h2>
                <div className="ml-9 space-y-3 text-base text-gray-600 dark:text-gray-400">
                  {registryCourt && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white min-w-28">จดทะเบียนศาล:</span>
                      <span>{registryCourt}</span>
                    </div>
                  )}
                  {registryNumber && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white min-w-28">เลขที่ทะเบียน:</span>
                      <span className="font-mono">{registryNumber}</span>
                    </div>
                  )}
                  {vatId && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white min-w-28">เลขผู้เสียภาษี (USt-IdNr.):</span>
                      <span className="font-mono">{vatId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div>
              <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <Phone className="text-primary" size={24} />
                {t("contact")}
              </h2>
              <div className="ml-9 space-y-4">
                {phone && (
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 dark:text-white min-w-20">
                      {t("phone")}:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-mono">
                      {phone}
                    </span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 dark:text-white min-w-20">
                      {t("email")}:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-mono">
                      {email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Responsibility for content */}
            {contentResponsibility && (
              <div>
                <h2 className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <ShieldCheck className="text-primary" size={24} />
                  ผู้รับผิดชอบเนื้อหา (Verantwortlich für den Inhalt)
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 ml-9 leading-relaxed">
                  {contentResponsibility}
                </p>
              </div>
            )}
          </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
