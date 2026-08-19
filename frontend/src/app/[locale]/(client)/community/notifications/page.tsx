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
  if (session.status !== "authenticated") return <PageContainer width="reading"><h1 className="font-heading text-4xl font-medium">{t("notificationsTitle")}</h1><p className="mt-4 text-site-muted">{t("signInToViewNotifications")}</p><Link href="/account/login" className="mt-6 inline-flex min-h-11 items-center border border-site-border px-4 text-sm font-semibold">{t("signIn")}</Link></PageContainer>;
  return <div className="min-h-screen bg-site-canvas"><PageContainer width="reading"><Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"><ArrowLeft size={16} /> {t("backToCommunity")}</Link><h1 className="mt-8 font-heading text-4xl font-medium text-site-foreground">{t("notificationsTitle")}</h1><p className="mt-3 text-site-muted">{t("notificationsSubtitle")}</p><div className="mt-8"><NotificationList /><NotificationPreferences /></div></PageContainer></div>;
}
