"use client";

import React from "react";
import { usePathname } from "@/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminIntlProvider from "@/components/admin/AdminIntlProvider";
import { AdminThemeProvider } from "@/components/admin/theme/AdminThemeProvider";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page ไม่ต้อง auth guard หรือ admin layout
  const isLoginPage =
    pathname === "/admin/login" || pathname.endsWith("/admin/login");

  if (isLoginPage) {
    return (
      <AdminThemeProvider>
        <div className="admin-theme min-h-screen bg-admin-canvas text-admin-foreground">
          <AuthProvider>
            <AdminIntlProvider>{children}</AdminIntlProvider>
          </AuthProvider>
        </div>
      </AdminThemeProvider>
    );
  }

  return (
    <AdminThemeProvider>
      <div className="admin-theme min-h-screen bg-admin-canvas text-admin-foreground">
        <AuthProvider>
          <AdminAuthGuard>
            <AdminIntlProvider>
              <AdminLayout>{children}</AdminLayout>
            </AdminIntlProvider>
          </AdminAuthGuard>
        </AuthProvider>
      </div>
    </AdminThemeProvider>
  );
}
