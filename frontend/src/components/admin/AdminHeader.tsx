"use client";

import React from "react";
import { LogOut, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import { useTranslations } from "next-intl";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const { locale, changeLocale } = useAdminLocale();
  const t = useTranslations("Admin.header");

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Menu size={20} />
      </button>

      {/* Spacer (desktop) */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <div className="flex items-center gap-2 border-r pr-4 mr-1">
          <span className="text-sm font-medium text-gray-500 hidden sm:block">
            {t("language")}:
          </span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {["th", "en", "de"].map((l) => (
              <button
                key={l}
                onClick={() => changeLocale(l)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${locale === l ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
            <User size={16} className="text-amber-700" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role?.name}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
          title={t("logout")}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
