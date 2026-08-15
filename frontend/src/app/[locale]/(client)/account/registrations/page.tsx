import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/features/public/account/components/AccountShell";
import { AccountRegistrationsContent } from "@/features/public/event-registration/components/AccountRegistrationsContent";

export default async function AccountRegistrationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventRegistration" });
  return <AccountShell context={{ title: t("accountRegistrationsTitle"), subtitle: t("accountRegistrationsSubtitle"), backHref: "/account", backLabel: t("backToAccount") }}><AccountRegistrationsContent /></AccountShell>;
}
