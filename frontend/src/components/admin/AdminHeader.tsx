"use client";

import React, { useState } from "react";
import { LogOut, User, Menu, HelpCircle } from "lucide-react";
import { Link, useRouter } from "@/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { AdminThemeSwitcher } from "@/components/admin/theme/AdminThemeSwitcher";
import { AdminNotificationCenter } from "@/components/admin/AdminNotificationCenter";

interface AdminHeaderProps {
  onMenuClick: () => void;
  onHelpClick?: () => void;
}

export function AdminHeader({ onMenuClick, onHelpClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const t = useTranslations("Admin.header");
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-admin-surface border-b border-admin-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 print:hidden">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-none hover:bg-admin-surface-muted text-admin-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      {/* Spacer (desktop) */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Help Drawer Trigger Button */}
        {onHelpClick && (
          <button
            onClick={onHelpClick}
            className="p-2 rounded-none hover:bg-admin-surface-muted text-admin-muted hover:text-admin-action transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
            title={t("help")}
            aria-label={t("help")}
          >
            <HelpCircle size={19} />
          </button>
        )}
        <AdminNotificationCenter />
        <AdminThemeSwitcher className="hidden md:flex" />
        <AdminLanguageSwitcher />

        {/* User info / Profile Link */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-2 text-sm p-1.5 rounded-none hover:bg-admin-surface-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus group"
          title={t("profile")}
        >
          <div className="h-8 w-8 rounded-none bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-body group-hover:border-admin-action group-hover:text-admin-action transition-colors overflow-hidden flex-shrink-0">
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
          disabled={isLoggingOut}
          className="p-2 rounded-none hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus min-h-11 min-w-11 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title={t("logout")}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
