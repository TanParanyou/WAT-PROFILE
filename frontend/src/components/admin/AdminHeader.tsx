"use client";

import React from "react";
import { LogOut, User, Menu } from "lucide-react";
import { Link } from "@/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const { locale, changeLocale } = useAdminLocale();
  const currentLocale = useLocale();
  const t = useTranslations("Admin.header");

  const handleLogout = () => {
    logout();
    window.location.href = `/${currentLocale}/admin/login`;
  };

  return (
    <header className="h-16 bg-admin-surface border-b border-admin-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-none hover:bg-admin-surface-muted text-admin-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      {/* Spacer (desktop) */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <div className="flex items-center gap-2 border-r border-admin-border pr-4 mr-1">
          <span className="text-sm font-medium text-admin-muted hidden sm:block">
            {t("language")}:
          </span>
          <div className="flex border border-admin-control-border rounded overflow-hidden">
            {["th", "en", "de"].map((l) => (
              <button
                key={l}
                onClick={() => changeLocale(l)}
                className={`px-3 py-1 text-xs font-medium uppercase transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
                  locale === l
                    ? "bg-admin-action text-admin-on-action"
                    : "bg-admin-surface text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* User info / Profile Link */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-2 text-sm p-1.5 rounded-lg hover:bg-admin-surface-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus group"
          title={t("profile")}
        >
          <div className="h-8 w-8 rounded-full bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-body group-hover:border-admin-action group-hover:text-admin-action transition-colors overflow-hidden flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || "User Avatar"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="font-medium text-admin-foreground group-hover:text-admin-action transition-colors leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-admin-muted leading-tight">{user?.role?.name}</p>
          </div>
        </Link>


        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-none hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center"
          title={t("logout")}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
