import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ReopenAccountForm } from "@/features/public/account/components/LifecycleForms";
import { AuthShell } from "@/features/public/account/components/AuthShell";

export default async function ReopenAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AuthShell
      context={{
        title: t("account.reopenRequestTitle"),
        subtitle: t("account.reopenRequestBody"),
        backHref: "/account/login",
        backLabel: t("back"),
      }}
    >
      <Suspense fallback={null}>
        <ReopenAccountForm />
      </Suspense>
    </AuthShell>
  );
}
