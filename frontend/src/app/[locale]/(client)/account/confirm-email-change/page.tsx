import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ConfirmEmailChangeForm } from "@/features/public/account/components/LifecycleForms";
import { AuthShell } from "@/features/public/account/components/AuthShell";

export default async function ConfirmEmailChangePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AuthShell
      context={{
        title: t("confirmEmailChange.title"),
        subtitle: t("confirmEmailChange.subtitle"),
        backHref: "/account?tab=security",
        backLabel: t("navigation.backToSecurity"),
      }}
    >
      <Suspense fallback={null}>
        <ConfirmEmailChangeForm />
      </Suspense>
    </AuthShell>
  );
}
