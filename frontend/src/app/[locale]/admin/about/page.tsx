"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AboutContentForm } from "@/components/admin/public-content/AboutContentForm";

export default function AboutAdminPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="เกี่ยวกับวัด"
        breadcrumbs={[
          { label: "ข้อมูลเว็บไซต์" },
          { label: "เกี่ยวกับวัด" },
        ]}
      />
      <AboutContentForm />
    </div>
  );
}
