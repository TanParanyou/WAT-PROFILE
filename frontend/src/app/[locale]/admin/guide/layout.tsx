"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GuideCategoryNav } from "@/components/admin/guide/GuideCategoryNav";
import { GuideSearchModal } from "@/components/admin/guide/GuideSearchModal";
import { useTranslations } from "next-intl";
import { Search, Printer, Menu, X } from "lucide-react";

interface GuideLayoutProps {
  children: React.ReactNode;
}

export function GuideLayout({ children }: GuideLayoutProps) {
  const t = useTranslations("Admin.guide");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  // Global hotkey Ctrl+K / Cmd+K to open search modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Admin Page Header */}
      <div className="print:hidden">
        <AdminPageHeader
          title={t("title")}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: t("title") },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-admin-surface border border-admin-border hover:bg-admin-surface-muted text-admin-foreground text-xs sm:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus min-h-10 cursor-pointer"
              >
                <Search size={16} className="text-admin-muted" />
                <span className="hidden sm:inline">{t("searchModalTitle")}</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-admin-surface-muted border border-admin-border text-admin-muted ml-1">
                  Ctrl+K
                </kbd>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-admin-surface border border-admin-border hover:bg-admin-surface-muted text-admin-foreground text-xs sm:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus min-h-10 cursor-pointer"
                title={t("exportPdf")}
              >
                <Printer size={16} />
                <span className="hidden md:inline">{t("exportPdf")}</span>
              </button>

              <button
                onClick={() => setMobileCategoryOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 p-2 bg-admin-surface border border-admin-border hover:bg-admin-surface-muted text-admin-foreground min-h-10 min-w-10 justify-center cursor-pointer"
                title={t("categories")}
              >
                <Menu size={18} />
              </button>
            </div>
          }
        />
      </div>

      {/* Main Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Category Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky top-20 bg-admin-surface border border-admin-border p-4 max-h-[calc(100vh-6rem)] overflow-y-auto print:hidden shadow-2xs">
          <GuideCategoryNav />
        </aside>

        {/* Mobile Slide-over Category Sheet */}
        {mobileCategoryOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-admin-backdrop backdrop-blur-xs flex">
            <div
              className="fixed inset-0"
              onClick={() => setMobileCategoryOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-admin-surface border-r border-admin-border h-full p-4 overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-admin-border">
                <span className="font-bold text-sm text-admin-foreground">
                  {t("categories")}
                </span>
                <button
                  onClick={() => setMobileCategoryOpen(false)}
                  className="p-1.5 text-admin-muted hover:text-admin-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <GuideCategoryNav
                onItemClick={() => setMobileCategoryOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="col-span-1 lg:col-span-9 xl:col-span-9 print:col-span-12">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      <GuideSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

export default GuideLayout;
