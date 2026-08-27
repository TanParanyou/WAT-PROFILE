"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Mail, UserCheck, HeartHandshake, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminNotificationService, type AdminNotificationItem } from "@/services/adminNotificationService";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";

export function AdminNotificationCenter() {
  const t = useTranslations("Admin.header.notifications");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "contact" | "registration" | "donation">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => adminNotificationService.getNotifications(),
    refetchInterval: 30_000, // Background polling every 30 seconds
    staleTime: 15_000,
  });

  const totalUnread = data?.total_unread ?? 0;
  const items = data?.items ?? [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    return item.type === activeFilter;
  });

  const getItemIcon = (type: AdminNotificationItem["type"]) => {
    switch (type) {
      case "contact":
        return <Mail size={16} className="text-admin-info" />;
      case "registration":
        return <UserCheck size={16} className="text-admin-success" />;
      case "donation":
        return <HeartHandshake size={16} className="text-admin-warning" />;
      default:
        return <Bell size={16} className="text-admin-muted" />;
    }
  };

  const handleItemClick = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            void refetch();
          }
        }}
        className="relative p-2 rounded-none hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center"
        title={t("title")}
        aria-label={t("title")}
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {totalUnread > 0 && (
          <span className="absolute top-2 right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-admin-danger text-[10px] font-bold text-white shadow-sm ring-2 ring-admin-surface">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Notifications Popover Menu */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-admin-surface border border-admin-border shadow-xl z-50 rounded-none overflow-hidden animate-in fade-in-50 zoom-in-95 max-h-[calc(100vh-5rem)] flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-admin-border bg-admin-surface-muted/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-admin-foreground">{t("title")}</span>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium bg-admin-danger-surface text-admin-danger border border-admin-danger/20 shrink-0">
                  {t("unreadCount", { count: totalUnread })}
                </span>
              )}
            </div>
            {isLoading && <Loader2 size={14} className="animate-spin text-admin-muted shrink-0" />}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 p-2 border-b border-admin-border bg-admin-surface text-xs overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-admin-action text-admin-on-action"
                  : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
              }`}
            >
              {t("all")} ({totalUnread})
            </button>
            {data && data.pending_contacts > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("contact")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 whitespace-nowrap ${
                  activeFilter === "contact"
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                }`}
              >
                {t("contacts")} ({data.pending_contacts})
              </button>
            )}
            {data && data.pending_registrations > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("registration")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 whitespace-nowrap ${
                  activeFilter === "registration"
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                }`}
              >
                {t("registrations")} ({data.pending_registrations})
              </button>
            )}
            {data && data.pending_donations > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("donation")}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 whitespace-nowrap ${
                  activeFilter === "donation"
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                }`}
              >
                {t("donations")} ({data.pending_donations})
              </button>
            )}
          </div>

          {/* List of Notification Items */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-admin-border flex-1">
            {filteredItems.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <CheckCircle2 size={28} className="mx-auto text-admin-success mb-2 opacity-80" />
                <p className="text-xs text-admin-muted font-medium">{t("noNotifications")}</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.link)}
                  className="p-3 hover:bg-admin-surface-muted/60 transition-colors cursor-pointer flex items-start gap-3 text-left group"
                >
                  <div className="p-1.5 bg-admin-surface-muted border border-admin-border flex-shrink-0 mt-0.5">
                    {getItemIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-admin-foreground group-hover:text-admin-action transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-admin-muted line-clamp-2 mt-0.5 break-words">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-admin-muted/80 mt-1 font-mono">
                      {new Date(item.created_at).toLocaleString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-admin-border bg-admin-surface-muted/30 text-center shrink-0">
            <Link
              href="/admin/contacts"
              onClick={() => setIsOpen(false)}
              className="text-xs text-admin-action hover:underline font-medium inline-flex items-center gap-1 py-1"
            >
              <span>{t("viewAll")}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
