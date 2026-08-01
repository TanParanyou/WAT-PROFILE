"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Users,
  Image,
  Heart,
  UserCheck,
  Mail,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { Loading } from "@/components/ui/Loading";
import { dashboardService, DashboardStats } from "@/services/adminService";
import type { PermissionResource } from "@/types/auth";
import type { LucideIcon } from "lucide-react";

interface StatCard {
  labelKey: string;
  icon: LucideIcon;
  resource: PermissionResource;
  statKey: keyof DashboardStats;
  href: string;
}

const stats: StatCard[] = [
  {
    labelKey: "events",
    icon: Calendar,
    resource: "events",
    statKey: "events",
    href: "/admin/events",
  },
  {
    labelKey: "monks",
    icon: Users,
    resource: "monks",
    statKey: "monks",
    href: "/admin/monks",
  },
  {
    labelKey: "gallery",
    icon: Image,
    resource: "gallery",
    statKey: "gallery",
    href: "/admin/gallery",
  },
  {
    labelKey: "schedules",
    icon: Clock,
    resource: "schedules",
    statKey: "schedules",
    href: "/admin/schedules",
  },
  {
    labelKey: "donations",
    icon: Heart,
    resource: "donations",
    statKey: "donations",
    href: "/admin/donations",
  },
  {
    labelKey: "members",
    icon: UserCheck,
    resource: "members",
    statKey: "members",
    href: "/admin/members",
  },
  {
    labelKey: "contacts",
    icon: Mail,
    resource: "contacts",
    statKey: "contacts",
    href: "/admin/contacts",
  },
];

export default function AdminDashboardPage() {
  const t = useTranslations("Admin");
  const { user } = useAuth();
  const { can } = usePermission();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getStats()
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const visibleStats = stats.filter((s) => can(s.resource, "read"));

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-admin-foreground">
          {t("dashboard.welcome")}, {user?.name}
        </h1>
        <p className="text-admin-muted mt-1">{t("dashboard.welcomeMessage")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          const count = data ? data[stat.statKey] : null;
          return (
            <Link
              key={stat.labelKey}
              href={stat.href}
              className="bg-admin-surface rounded-xl border border-admin-border p-6 hover:border-admin-focus transition-all focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center bg-admin-selected text-admin-selected-foreground border border-admin-control-border"
                >
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-admin-muted">
                    {t(`dashboard.${stat.labelKey}`)}
                  </p>
                  {isLoading ? (
                    <Loading size="sm" />
                  ) : (
                    <p className="text-2xl font-bold text-admin-foreground">
                      {count !== null ? count.toLocaleString() : "—"}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
