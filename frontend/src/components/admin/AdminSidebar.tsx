"use client";

import React from "react";
import { Link } from "@/navigation";
import { usePathname } from "@/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Image,
  Clock,
  Heart,
  UserCheck,
  Mail,
  ClipboardList,
  Settings,
  Globe,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  X,
  UserCog,
  Shield,
  Activity,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";
import type { PermissionResource } from "@/types/auth";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  resource?: PermissionResource;
  alwaysShow?: boolean;
}

const menuItems: MenuItem[] = [
  {
    labelKey: "dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    alwaysShow: true,
  },
  {
    labelKey: "website",
    href: "/admin/website",
    icon: Globe,
    resource: "website",
  },
  {
    labelKey: "media",
    href: "/admin/website/media",
    icon: FolderOpen,
    resource: "website",
  },
  {
    labelKey: "events",
    href: "/admin/events",
    icon: Calendar,
    resource: "events",
  },
  { labelKey: "monks", href: "/admin/monks", icon: Users, resource: "monks" },
  {
    labelKey: "gallery",
    href: "/admin/gallery",
    icon: Image,
    resource: "gallery",
  },
  {
    labelKey: "schedules",
    href: "/admin/schedules",
    icon: Clock,
    resource: "schedules",
  },
  {
    labelKey: "donations",
    href: "/admin/donations",
    icon: Heart,
    resource: "donations",
  },
  {
    labelKey: "members",
    href: "/admin/members",
    icon: UserCheck,
    resource: "members",
  },
  {
    labelKey: "registrations",
    href: "/admin/registrations",
    icon: ClipboardList,
    resource: "events",
  },
  {
    labelKey: "contacts",
    href: "/admin/contacts",
    icon: Mail,
    resource: "contacts",
  },
  { labelKey: "users", href: "/admin/users", icon: UserCog, resource: "users" },
  { labelKey: "roles", href: "/admin/roles", icon: Shield, resource: "users" },
  {
    labelKey: "audit_logs",
    href: "/admin/audit-logs",
    icon: Activity,
    resource: "audit_logs",
  },
  {
    labelKey: "settings",
    href: "/admin/settings",
    icon: Settings,
    resource: "settings",
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

  // กรองเมนูตาม permission
  const visibleItems = menuItems.filter(
    (item) => item.alwaysShow || (item.resource && can(item.resource, "read")),
  );

  const isActive = (href: string) => {
    if (href === "/admin") return normalizedPathname === "/admin";
    return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        "fixed top-0 h-full bg-white border-r border-gray-200 shadow-sm z-50 transition-all duration-300",
        // Desktop: ซ่อน/ขยาย
        "hidden lg:block",
        collapsed ? "lg:w-16" : "lg:w-64",
        // Mobile: slide-in
        mobileOpen && "block w-64",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {(!collapsed || mobileOpen) && (
          <span className="text-lg font-semibold text-gray-800 truncate">
            WAT Admin
          </span>
        )}
        {/* Desktop toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {/* Mobile close */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
              title={!showLabel ? t(item.labelKey) : undefined}
            >
              <Icon size={20} className={cn(active && "text-amber-600")} />
              {showLabel && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function normalizeAdminPath(pathname: string) {
  const match = pathname.match(/^\/(th|en|de)(\/.*)?$/);
  return match?.[2] || pathname;
}
