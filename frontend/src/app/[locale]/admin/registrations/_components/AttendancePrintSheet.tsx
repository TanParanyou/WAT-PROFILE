"use client";

import React from "react";
import { Printer, X, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminRegistrationTableRow } from "@/features/admin/event-registrations/mappers";

interface AttendancePrintSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: AdminRegistrationTableRow[];
  eventName?: string;
}

export function AttendancePrintSheet({
  isOpen,
  onClose,
  items,
  eventName = "กิจกรรมวัด / Temple Event",
}: AttendancePrintSheetProps) {
  const tPrint = useTranslations("Admin.registrations.printSheet");
  const tCommon = useTranslations("Admin.common");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white text-black w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none shadow-2xl flex flex-col">
        {/* Modal Controls (Hidden in Print) */}
        <div className="print:hidden p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              {tPrint("title")}
            </h2>
            <p className="text-xs text-gray-500">
              {items.length} {tCommon("dataTable.entries")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-10 px-4 bg-black text-white text-xs font-semibold hover:bg-gray-800 inline-flex items-center gap-1.5 transition-colors"
            >
              <Printer size={15} />
              <span>{tPrint("title")} (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 px-3 border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
              aria-label={tCommon("close")}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="p-8 sm:p-12 print:p-0 font-sans text-black bg-white">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wider">
              {tPrint("title")}
            </h1>
            <h2 className="text-base font-semibold mt-1">
              {eventName}
            </h2>
            <div className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-2 border-t border-gray-300">
              <span>{tCommon("filter.dateRange")}: {new Date().toLocaleDateString("de-DE", { dateStyle: "long" })}</span>
              <span>{tPrint("count")}: {items.length}</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-2 text-center w-10">{tPrint("index")}</th>
                <th className="border border-black p-2 text-left w-28">{tPrint("code")}</th>
                <th className="border border-black p-2 text-left">{tPrint("name")}</th>
                <th className="border border-black p-2 text-center w-14">{tPrint("count")}</th>
                <th className="border border-black p-2 text-left w-28">{tPrint("phone")}</th>
                <th className="border border-black p-2 text-left">{tPrint("dietary")}</th>
                <th className="border border-black p-2 text-center w-28">{tPrint("signature")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={row.id} className="border-b border-black/60 hover:bg-gray-50">
                  <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-black p-2 font-mono font-bold">{row.confirmation_code}</td>
                  <td className="border border-black p-2 font-medium">{row.name}</td>
                  <td className="border border-black p-2 text-center font-mono">{row.participant_count}</td>
                  <td className="border border-black p-2 font-mono">{row.phone || "—"}</td>
                  <td className="border border-black p-2 text-gray-600 truncate max-w-xs">{row.dietary_restrictions || "—"}</td>
                  <td className="border border-black p-2 text-center">
                    {row.status === "attended" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase text-emerald-700">
                        <Check size={11} strokeWidth={3} className="shrink-0" />
                        <span>{tPrint("checked")}</span>
                      </span>
                    ) : (
                      <div className="w-6 h-6 border border-gray-400 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Notes */}
          <div className="mt-8 pt-4 border-t border-gray-300 flex items-center justify-between text-[11px] text-gray-500">
            <span>{tPrint("staffSignature")} ............................................................</span>
            <span>{tPrint("responsibleSignature")} ............................................................</span>
          </div>
        </div>
      </div>
    </div>
  );
}
