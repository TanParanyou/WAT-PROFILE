"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContactContentForm } from "@/components/admin/public-content/ContactContentForm";

export default function ContactAdminPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="ติดต่อเรา"
        breadcrumbs={[
          { label: "ข้อมูลเว็บไซต์" },
          { label: "ติดต่อเรา" },
        ]}
      />
      <ContactContentForm />
    </div>
  );
}
