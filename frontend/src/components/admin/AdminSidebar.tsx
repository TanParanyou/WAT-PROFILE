"use client";

import React from "react";
import { Link } from "@/navigation";
import { usePathname } from "@/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  Image,
  Clock,
  HandCoins,
  UserCheck,
  Mail,
  ClipboardList,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  X,
  UserCog,
  UserRoundCheck,
  Shield,
  ShieldCheck,
  FileKey,
  Activity,
  BookOpen,
  Phone,
  FileText,
  Settings,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";
import type { PermissionResource } from "@/types/auth";
import type { LucideIcon } from "lucide-react";
import { AdminThemeSwitcher } from "@/components/admin/theme/AdminThemeSwitcher";

interface SidebarItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  resource?: PermissionResource;
  alwaysShow?: boolean;
}

interface SidebarGroup {
  titleKey: string;
  items: SidebarItem[];
  resource?: PermissionResource;
}

const sidebarGroups: SidebarGroup[] = [
  {
    titleKey: "websiteGroup",
    resource: "website",
    items: [
      { labelKey: "about", href: "/admin/about", icon: BookOpen },
      { labelKey: "contact", href: "/admin/contact", icon: Phone },
      { labelKey: "impressum", href: "/admin/impressum", icon: FileText },
      { labelKey: "privacy", href: "/admin/privacy", icon: ShieldCheck },
      { labelKey: "media", href: "/admin/media", icon: FolderOpen, resource: "website" },
    ],
  },
  {
    titleKey: "operationsGroup",
    items: [
      { labelKey: "events", href: "/admin/events", icon: CalendarDays, resource: "events" },
      { labelKey: "calendar", href: "/admin/calendar", icon: Calendar, resource: "events" },
      { labelKey: "registrations", href: "/admin/registrations", icon: ClipboardList, resource: "events" },
      { labelKey: "schedules", href: "/admin/schedules", icon: Clock, resource: "schedules" },
      { labelKey: "gallery", href: "/admin/gallery", icon: Image, resource: "gallery" },
      { labelKey: "monks", href: "/admin/monks", icon: Users, resource: "monks" },
    ],
  },
  {
    titleKey: "financeGroup",
    items: [
      { labelKey: "members", href: "/admin/members", icon: UserCheck, resource: "members" },
      { labelKey: "donations", href: "/admin/donations", icon: HandCoins, resource: "donations" },
      { labelKey: "contacts", href: "/admin/contacts", icon: Mail, resource: "contacts" },
      { labelKey: "privacyRequests", href: "/admin/privacy-requests", icon: FileKey, resource: "privacy_requests" },
    ],
  },
  {
    titleKey: "systemGroup",
    items: [
      { labelKey: "users", href: "/admin/users", icon: UserCog, resource: "users" },
      { labelKey: "accountOperations", href: "/admin/accounts", icon: UserRoundCheck, resource: "account_operations" },
      { labelKey: "roles", href: "/admin/roles", icon: Shield, resource: "users" },
      { labelKey: "audit_logs", href: "/admin/audit-logs", icon: Activity, resource: "audit_logs" },
      { labelKey: "settings", href: "/admin/settings", icon: Settings, resource: "settings" },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { can } = usePermission();
  const t = useTranslations("Admin.sidebar");
  const normalizedPathname = normalizeAdminPath(pathname);

  const isActive = (href: string) => {
    if (href === "/admin") return normalizedPathname === "/admin";
    return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        "fixed top-0 h-full bg-admin-surface border-r border-admin-border z-50 transition-all duration-300",
        // Desktop: ซ่อน/ขยาย
        "hidden lg:block",
        collapsed ? "lg:w-16" : "lg:w-64",
        // Mobile: slide-in
        mobileOpen && "block w-64",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-admin-border">
        {(!collapsed || mobileOpen) && (
          <span className="text-lg font-semibold text-admin-foreground truncate">
            WAT Admin
          </span>
        )}
        {/* Desktop toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:block p-1.5 rounded-none hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {/* Mobile close */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-none hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
        {/* Dashboard */}
        <Link
          href="/admin"
          onClick={onMobileClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11",
            isActive("/admin")
              ? "bg-admin-selected text-admin-selected-foreground font-medium hover:bg-admin-selected/80"
              : "text-admin-body hover:bg-admin-surface-muted hover:text-admin-foreground",
          )}
          title={collapsed && !mobileOpen ? t("dashboard") : undefined}
        >
          <LayoutDashboard size={20} />
          {(!collapsed || mobileOpen) && <span>{t("dashboard")}</span>}
        </Link>

        {/* Groups */}
        {sidebarGroups.map((group) => {
          // If group requires a resource permission, check it
          if (group.resource && !can(group.resource, "read")) return null;

          // Filter visible items in the group
          const visibleItems = group.items.filter(
            (item) => item.alwaysShow || (item.resource ? can(item.resource, "read") : true)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.titleKey} className="mt-4 mb-2">
              {!collapsed || mobileOpen ? (
                <div className="px-3 py-1.5 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  {t(group.titleKey)}
                </div>
              ) : (
                <div className="h-px bg-admin-border my-2" />
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const showLabel = !collapsed || mobileOpen;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-none text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11",
                        active
                          ? "bg-admin-selected text-admin-selected-foreground font-medium hover:bg-admin-selected/80"
                          : "text-admin-body hover:bg-admin-surface-muted hover:text-admin-foreground",
                      )}
                      title={!showLabel ? t(item.labelKey) : undefined}
                    >
                      <Icon size={18} />
                      {showLabel && <span>{t(item.labelKey)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-4 border-t border-admin-border pt-3 lg:hidden">
          <AdminThemeSwitcher className="w-full justify-center" />
        </div>
      </nav>
    </aside>
  );
}

function normalizeAdminPath(pathname: string) {
  const match = pathname.match(/^\/(th|en|de)(\/.*)?$/);
  return match?.[2] || pathname;
}
