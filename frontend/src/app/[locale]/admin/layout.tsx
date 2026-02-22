"use client";

import React from "react";
import { usePathname } from "@/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminIntlProvider from "@/components/admin/AdminIntlProvider";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page ไม่ต้อง auth guard หรือ admin layout
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <AdminAuthGuard>
        <AdminIntlProvider>
          <AdminLayout>{children}</AdminLayout>
        </AdminIntlProvider>
      </AdminAuthGuard>
    </AuthProvider>
  );
}
