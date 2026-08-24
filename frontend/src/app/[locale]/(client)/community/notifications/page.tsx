"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import PageContainer from "@/components/layout/PageContainer";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { ArrowLeft } from "lucide-react";
import { NotificationList } from "@/features/public/community/components/NotificationList";
import { NotificationPreferences } from "@/features/public/community/components/NotificationPreferences";

export default function CommunityNotificationsPage() {
  const t = useTranslations("Community");
  const session = useAccountSession();
  if (session.status !== "authenticated") {
    return (
      <div className="min-h-screen bg-site-canvas pt-[76px] sm:pt-[88px]">
        <PageContainer width="reading">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-medium">{t("notificationsTitle")}</h1>
          <p className="mt-3 text-sm sm:text-base text-site-muted">{t("signInToViewNotifications")}</p>
          <Link href="/account/login" className="mt-6 inline-flex min-h-11 items-center border border-site-border px-5 text-sm font-semibold">{t("signIn")}</Link>
        </PageContainer>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-site-canvas pt-[76px] sm:pt-[88px]">
      <PageContainer width="reading">
        <Link href="/community" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
          <ArrowLeft size={16} /> {t("backToCommunity")}
        </Link>
        <h1 className="mt-4 sm:mt-6 font-heading text-2xl sm:text-3xl md:text-4xl font-medium text-site-foreground">{t("notificationsTitle")}</h1>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-site-muted">{t("notificationsSubtitle")}</p>
        <div className="mt-6 sm:mt-8">
          <NotificationList />
          <NotificationPreferences />
        </div>
      </PageContainer>
    </div>
  );
}
