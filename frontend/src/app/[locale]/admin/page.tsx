"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Calendar,
  Users,
  Image as ImageIcon,
  Heart,
  UserCheck,
  Mail,
  Clock,
  Plus,
  ArrowRight,
  ShieldAlert,
  HeartHandshake,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { Loading } from "@/components/ui/Loading";
import { dashboardService, type DashboardOverview } from "@/services/adminService";
import type { PermissionResource } from "@/types/auth";
import type { LucideIcon } from "lucide-react";

interface StatCard {
  labelKey: string;
  icon: LucideIcon;
  resource: PermissionResource;
  statKey: "events" | "monks" | "gallery" | "schedules" | "donations" | "members" | "contacts";
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
    icon: ImageIcon,
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
  const locale = useLocale();
  const { user } = useAuth();
  const { can } = usePermission();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTaskFilter, setActiveTaskFilter] = useState<"all" | "donation" | "registration" | "contact" | "privacy">("all");

  useEffect(() => {
    dashboardService
      .getOverview()
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const visibleStats = stats.filter((s) => can(s.resource, "read"));
  const pendingTasks = data?.pending_tasks;
  const totalPending = pendingTasks?.total_unread ?? 0;
  const items = pendingTasks?.items ?? [];
  const upcomingEvents = data?.upcoming_events ?? [];

  const filteredTasks = items.filter((item) => {
    if (activeTaskFilter === "all") return true;
    return item.type === activeTaskFilter;
  });

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "donation":
        return <HeartHandshake size={16} className="text-admin-warning" />;
      case "registration":
        return <UserCheck size={16} className="text-admin-success" />;
      case "contact":
        return <Mail size={16} className="text-admin-info" />;
      case "privacy":
        return <ShieldAlert size={16} className="text-admin-danger" />;
      default:
        return <Sparkles size={16} className="text-admin-muted" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Quick Actions */}
      <div className="bg-admin-surface border border-admin-border p-6 rounded-none shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-none bg-admin-action inline-block" />
            <h1 className="text-xl sm:text-2xl font-bold text-admin-foreground">
              {t("dashboard.welcome")}, {user?.name || "Admin"}
            </h1>
          </div>
          <p className="text-sm text-admin-muted mt-1">
            {t("dashboard.welcomeMessage")}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {can("events", "create") && (
            <Link
              href="/admin/events/new"
              className="inline-flex min-h-11 items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-admin-action text-admin-on-action hover:bg-admin-action-hover transition-colors rounded-none focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Plus size={15} />
              <span>{t("dashboard.createEvent")}</span>
            </Link>
          )}
          {can("gallery", "create") && (
            <Link
              href="/admin/gallery/upload"
              className="inline-flex min-h-11 items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-admin-control-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted transition-colors rounded-none focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <ImageIcon size={15} className="text-admin-muted" />
              <span>{t("dashboard.uploadGallery")}</span>
            </Link>
          )}
          {can("donations", "create") && (
            <Link
              href="/admin/donations"
              className="inline-flex min-h-11 items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-admin-control-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted transition-colors rounded-none focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Heart size={15} className="text-admin-muted" />
              <span>{t("dashboard.recordDonation")}</span>
            </Link>
          )}
          {can("schedules", "read") && (
            <Link
              href="/admin/schedules"
              className="inline-flex min-h-11 items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-admin-control-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted transition-colors rounded-none focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <Clock size={15} className="text-admin-muted" />
              <span>{t("dashboard.manageSchedule")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          const count = data?.stats ? data.stats[stat.statKey] : null;
          return (
            <Link
              key={stat.labelKey}
              href={stat.href}
              className="bg-admin-surface rounded-none border border-admin-border p-4 hover:border-admin-focus transition-all group focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="h-8 w-8 rounded-none flex items-center justify-center bg-admin-surface-muted text-admin-muted group-hover:text-admin-action group-hover:bg-admin-selected transition-colors border border-admin-border/60">
                  <Icon size={16} />
                </div>
                {isLoading ? (
                  <Loading size="sm" />
                ) : (
                  <span className="text-xl font-bold font-mono text-admin-foreground">
                    {count !== null ? count.toLocaleString() : "—"}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-admin-muted group-hover:text-admin-foreground transition-colors truncate">
                {t(`dashboard.${stat.labelKey}`)}
              </p>
            </Link>
          );
        })}
      </div>

      {/* 2-Column Actionable Hub: Urgent To-Do Queue & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: To-Do Queue (7 Cols) */}
        <div className="lg:col-span-7 bg-admin-surface rounded-none border border-admin-border shadow-sm flex flex-col">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-admin-warning" />
              <h2 className="text-base font-semibold text-admin-foreground">
                {t("dashboard.pendingTasksTitle")}
              </h2>
            </div>
            {totalPending > 0 ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-admin-danger-surface text-admin-danger border border-admin-danger/20 font-mono">
                {t("dashboard.pendingTasksBadge", { count: totalPending })}
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-admin-success-surface text-admin-success border border-admin-success/20 font-mono">
                {t("dashboard.zeroPending")}
              </span>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-admin-border bg-admin-surface text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTaskFilter("all")}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                activeTaskFilter === "all"
                  ? "bg-admin-action text-admin-on-action"
                  : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
              }`}
            >
              {t("dashboard.filterAll", { count: totalPending })}
            </button>
            {pendingTasks && pendingTasks.pending_donations > 0 && (
              <button
                type="button"
                onClick={() => setActiveTaskFilter("donation")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeTaskFilter === "donation"
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                }`}
              >
                {t("dashboard.filterDonations", { count: pendingTasks.pending_donations })}
              </button>
            )}
            {pendingTasks && pendingTasks.pending_registrations > 0 && (
              <button
                type="button"
                onClick={() => setActiveTaskFilter("registration")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeTaskFilter === "registration"
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                }`}
              >
                {t("dashboard.filterRegistrations", { count: pendingTasks.pending_registrations })}
              </button>
            )}
            {pendingTasks && pendingTasks.pending_contacts > 0 && (
              <button
                type="button"
                onClick={() => setActiveTaskFilter("contact")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeTaskFilter === "contact"
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                }`}
              >
                {t("dashboard.filterContacts", { count: pendingTasks.pending_contacts })}
              </button>
            )}
            {pendingTasks && pendingTasks.pending_privacy > 0 && (
              <button
                type="button"
                onClick={() => setActiveTaskFilter("privacy")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeTaskFilter === "privacy"
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                }`}
              >
                {t("dashboard.filterPrivacy", { count: pendingTasks.pending_privacy })}
              </button>
            )}
          </div>

          {/* Task List */}
          <div className="flex-1 divide-y divide-admin-border overflow-y-auto max-h-[380px]">
            {filteredTasks.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <CheckCircle2 size={32} className="mx-auto text-admin-success mb-2 opacity-80" />
                <p className="text-sm font-medium text-admin-foreground">
                  {t("dashboard.noPendingTasks")}
                </p>
                <p className="text-xs text-admin-muted mt-1">
                  {t("dashboard.allTasksResolved")}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-admin-surface-muted/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-admin-surface-muted border border-admin-border shrink-0 mt-0.5">
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-admin-foreground truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-admin-muted line-clamp-1 mt-0.5">
                        {task.message}
                      </p>
                      <span className="text-[10px] text-admin-muted/70 font-mono mt-1 inline-block">
                        {new Date(task.created_at).toLocaleString(locale === "th" ? "th-TH" : "en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={task.link}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground transition-colors"
                  >
                    <span>{t("dashboard.checkTask")}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Upcoming Events (5 Cols) */}
        <div className="lg:col-span-5 bg-admin-surface rounded-none border border-admin-border shadow-sm flex flex-col">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={18} className="text-admin-info" />
              <h2 className="text-base font-semibold text-admin-foreground">
                {t("dashboard.upcomingEventsTitle")}
              </h2>
            </div>
            <Link
              href="/admin/events"
              className="text-xs text-admin-action hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>{t("dashboard.viewAllUpcoming")}</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Events List */}
          <div className="flex-1 divide-y divide-admin-border overflow-y-auto max-h-[380px]">
            {upcomingEvents.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Calendar size={32} className="mx-auto text-admin-muted/60 mb-2" />
                <p className="text-sm text-admin-muted font-medium">
                  {t("dashboard.noUpcomingEvents")}
                </p>
              </div>
            ) : (
              upcomingEvents.map((ev) => {
                const eventTitle = (ev.title && (ev.title[locale] || ev.title["th"] || ev.title["en"] || ev.title["de"])) || "Event";
                const eventLoc = ev.location ? (ev.location[locale] || ev.location["th"] || ev.location["en"] || ev.location["de"] || "") : "";

                return (
                  <div
                    key={ev.id}
                    className="p-4 hover:bg-admin-surface-muted/50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Date Block */}
                      <div className="shrink-0 w-12 text-center p-1.5 bg-admin-surface-muted border border-admin-border">
                        <span className="block text-[10px] uppercase font-bold text-admin-muted font-mono">
                          {new Date(ev.start_date).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", {
                            month: "short",
                          })}
                        </span>
                        <span className="block text-base font-bold text-admin-foreground font-mono">
                          {new Date(ev.start_date).getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/admin/events/${ev.id}`}
                          className="text-xs font-semibold text-admin-foreground hover:text-admin-action hover:underline truncate block"
                        >
                          {eventTitle}
                        </Link>
                        {eventLoc && (
                          <p className="text-[11px] text-admin-muted flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={11} className="shrink-0" />
                            <span>{eventLoc}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-admin-success-surface text-admin-success border border-admin-success/30 font-mono">
                            <UserCheck size={10} />
                            {t("dashboard.registeredParticipants", {
                              count: ev.registrations_count,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/events/${ev.id}`}
                      className="shrink-0 p-2 text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted transition-colors"
                      title={eventTitle}
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
