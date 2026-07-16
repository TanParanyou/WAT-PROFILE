"use client";

import React from "react";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/navigation";
import { Button } from "@/components/ui/Button";

export default function WebsiteAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Admin");

  return (
    <PermissionGuard
      resource="website"
      action="read"
      fallback={
        <div className="flex h-[60vh] flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-amber-50 p-4 text-amber-600 mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-950 mb-2">
            {t("common.forbiddenTitle")}
          </h2>
          <p className="text-zinc-500 max-w-md mb-6">
            {t("common.forbiddenDesc")}
          </p>
          <LocaleLink href="/admin">
            <Button variant="outline">
              {t("common.backToDashboard")}
            </Button>
          </LocaleLink>
        </div>
      }
    >
      {children}
    </PermissionGuard>
  );
}
