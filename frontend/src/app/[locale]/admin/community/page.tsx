"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";

export default function AdminCommunityPage() {
  const t = useTranslations("Admin.community");
  return <PermissionGuard resource="community" action="read" fallback={<p className="border border-admin-danger p-5 text-sm text-admin-danger">{t("loadError")}</p>}><div><AdminPageHeader title={t("title")} breadcrumbs={[{ label: t("title") }]} /><p className="-mt-3 max-w-3xl text-sm text-admin-muted">{t("description")}</p><div className="mt-8 grid gap-4 md:grid-cols-3"><Link href="/admin/community/moderation" className="border border-admin-border bg-admin-surface p-5 hover:bg-admin-surface-muted"><h2 className="font-semibold text-admin-foreground">{t("queue")}</h2><p className="mt-2 text-sm text-admin-muted">{t("items")}, {t("reports")}, {t("revisions")}</p></Link><Link href="/admin/community/categories" className="border border-admin-border bg-admin-surface p-5 hover:bg-admin-surface-muted"><h2 className="font-semibold text-admin-foreground">{t("categories")}</h2><p className="mt-2 text-sm text-admin-muted">{t("categorySave")}</p></Link><Link href="/admin/community/members" className="border border-admin-border bg-admin-surface p-5 hover:bg-admin-surface-muted"><h2 className="font-semibold text-admin-foreground">{t("members")}</h2><p className="mt-2 text-sm text-admin-muted">{t("restrict")}, {t("unrestrict")}, {t("ban")}</p></Link></div></div></PermissionGuard>;
}
