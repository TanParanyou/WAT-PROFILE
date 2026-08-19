"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContactContentForm } from "@/components/admin/public-content/ContactContentForm";

export default function ContactAdminPage() {
  const tSidebar = useTranslations("Admin.sidebar");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={tSidebar("contact")}
        breadcrumbs={[
          { label: tSidebar("websiteGroup") },
          { label: tSidebar("contact") },
        ]}
      />
      <ContactContentForm />
    </div>
  );
}
