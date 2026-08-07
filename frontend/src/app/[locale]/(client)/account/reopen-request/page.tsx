import { getTranslations } from "next-intl/server";
import { ReopenRequestForm } from "@/features/public/account/components/LifecycleForms";
import { AuthShell } from "@/features/public/account/components/AuthShell";

export default async function ReopenRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AuthShell
      context={{
        title: t("reopen.title"),
        subtitle: t("reopen.subtitle"),
        backHref: "/account/login",
        backLabel: t("navigation.backToLogin"),
      }}
    >
      <ReopenRequestForm />
    </AuthShell>
  );
}
