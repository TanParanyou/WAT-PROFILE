"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PrivacyContentForm } from "@/components/admin/public-content/PrivacyContentForm";

export default function PrivacyAdminPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="นโยบายความเป็นส่วนตัว"
        breadcrumbs={[
          { label: "ข้อมูลเว็บไซต์" },
          { label: "นโยบายความเป็นส่วนตัว" },
        ]}
      />
      <PrivacyContentForm />
    </div>
  );
}
