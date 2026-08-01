"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="h-16 w-16 rounded-full bg-admin-danger-surface flex items-center justify-center mb-4 text-admin-danger">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-bold text-admin-foreground mb-2">เกิดข้อผิดพลาด</h2>
      <p className="text-admin-muted mb-6 max-w-md">
        {error.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}
      </p>
      <Button onClick={reset} icon={<RotateCcw size={16} />}>
        ลองใหม่
      </Button>
    </div>
  );
}
