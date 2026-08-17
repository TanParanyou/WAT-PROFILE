"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImpressumContentForm } from "@/components/admin/public-content/ImpressumContentForm";
import { useTranslations } from "next-intl";

export default function ImpressumAdminPage() {
  const t = useTranslations("Admin");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("sidebar.impressum")}
        breadcrumbs={[
          { label: t("sidebar.websiteGroup") },
          { label: t("sidebar.impressum") },
        ]}
      />
      <ImpressumContentForm />
    </div>
  );
}
