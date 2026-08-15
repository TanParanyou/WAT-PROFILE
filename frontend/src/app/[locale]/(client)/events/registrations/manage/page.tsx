import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import { RegistrationManageContent } from "@/features/public/event-registration/components/RegistrationManageContent";

interface Props { params: Promise<{ locale: string }> }

export default async function EventRegistrationManagePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventRegistration" });
  return <div className="min-h-screen bg-site-canvas"><PageHeader variant="color" align="left" title={t("manageTitle")} subtitle={t("manageDescription")} /><RegistrationManageContent /></div>;
}
