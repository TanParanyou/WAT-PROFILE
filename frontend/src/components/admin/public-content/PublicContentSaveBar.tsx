"use client";

import React from "react";
import { Link } from "@/navigation";
import { ExternalLink, Loader2, Save } from "lucide-react";

interface PublicContentSaveBarProps {
  isDirty: boolean;
  isPending: boolean;
  updatedAt?: string | null;
  publicUrl: string;
}

export function PublicContentSaveBar({
  isDirty,
  isPending,
  updatedAt,
  publicUrl,
}: PublicContentSaveBarProps) {
  return (
    <div className="sticky bottom-0 z-40 flex items-center justify-between bg-white/95 backdrop-blur-md p-4 border-t border-zinc-200 mt-8 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4">
        {isDirty && (
          <span className="text-sm font-medium text-amber-600 animate-pulse bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
            คุณมีข้อมูลที่ยังไม่ได้บันทึก
          </span>
        )}
        {updatedAt && (
          <span className="text-xs text-zinc-500">
            บันทึกล่าสุด: {new Date(updatedAt).toLocaleString("th-TH")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={publicUrl}
          target="_blank"
          className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
        >
          <span>ดูหน้าเว็บจริง</span>
          <ExternalLink size={16} />
        </Link>

        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="flex items-center gap-2 px-6 py-2 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-700/50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>บันทึกข้อมูล</span>
        </button>
      </div>
    </div>
  );
}
export default PublicContentSaveBar;
