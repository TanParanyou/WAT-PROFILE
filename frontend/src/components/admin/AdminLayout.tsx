"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { InactivityTimeoutDialog } from "./InactivityTimeoutDialog";
import { cn } from "@/utils/cn";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-admin-canvas">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300 lg:ml-64",
          collapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>

      {/* Inactivity Warning Dialog */}
      <InactivityTimeoutDialog />
    </div>
  );
}
