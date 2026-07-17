"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImpressumContentForm } from "@/components/admin/public-content/ImpressumContentForm";

export default function ImpressumAdminPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="ข้อมูลทางกฎหมาย"
        breadcrumbs={[
          { label: "ข้อมูลเว็บไซต์" },
          { label: "ข้อมูลทางกฎหมาย" },
        ]}
      />
      <ImpressumContentForm />
    </div>
  );
}
