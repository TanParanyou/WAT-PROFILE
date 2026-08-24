"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { useAdminCommunityQueue } from "../queries";
import {
  LayoutDashboard,
  ShieldAlert,
  FolderTree,
  UserX,
} from "lucide-react";

export function CommunityAdminTabs() {
  const t = useTranslations("Admin.community");
  const pathname = usePathname();
  const queueQuery = useAdminCommunityQueue();

  const queue = queueQuery.data;
  const pendingCount =
    (queue?.items?.length ?? 0) +
    (queue?.revisions?.length ?? 0) +
    (queue?.reports?.length ?? 0);

  const tabs = [
    {
      href: "/admin/community",
      label: t("tabOverview"),
      icon: LayoutDashboard,
      isActive: pathname === "/admin/community",
    },
    {
      href: "/admin/community/moderation",
      label: t("tabQueue"),
      icon: ShieldAlert,
      isActive: pathname.startsWith("/admin/community/moderation"),
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: "bg-admin-warning text-admin-on-action",
    },
    {
      href: "/admin/community/categories",
      label: t("tabCategories"),
      icon: FolderTree,
      isActive: pathname.startsWith("/admin/community/categories"),
    },
    {
      href: "/admin/community/members",
      label: t("tabMembers"),
      icon: UserX,
      isActive: pathname.startsWith("/admin/community/members"),
    },
  ];

  return (
    <nav
      aria-label="Community Admin Navigation"
      className="flex flex-wrap items-center gap-2 border-b border-admin-border pb-3"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
              tab.isActive
                ? "border-admin-focus bg-admin-selected text-admin-selected-foreground"
                : "border-admin-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs font-bold ${
                  tab.badgeColor || "bg-admin-surface-muted text-admin-foreground"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
