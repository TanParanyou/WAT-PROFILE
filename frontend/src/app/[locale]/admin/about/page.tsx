"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AboutContentForm } from "@/components/admin/public-content/AboutContentForm";
import { useTranslations } from "next-intl";

export default function AboutAdminPage() {
  const t = useTranslations("Admin");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("sidebar.about")}
        breadcrumbs={[
          { label: t("sidebar.websiteGroup") },
          { label: t("sidebar.about") },
        ]}
      />
      <AboutContentForm />
    </div>
  );
}
