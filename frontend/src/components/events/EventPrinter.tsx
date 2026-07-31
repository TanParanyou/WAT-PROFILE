"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicEventDto } from "@/features/public/events/types";
import { getLocalizedText } from "@/features/public/events/mappers";
import { formatDate, formatTimeRange } from "@/utils/formatters";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";

interface EventPrinterProps {
  event: PublicEventDto;
  locale: string;
}

export default function EventPrinter({ event, locale }: EventPrinterProps) {
  const t = useTranslations("EventPrinter");
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  return (
    <>
      <button
        type="button"
        onClick={() => reactToPrintFn()}
        className="inline-flex min-h-11 items-center gap-2 border border-[#333] bg-[#fffef2] px-5 py-[13px] text-sm font-semibold text-[#333] transition-colors hover:bg-[#f7ecdd] hover:text-[#945c26] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#945c26]"
      >
        <Printer size={18} aria-hidden="true" />
        <span>{t("printButton")}</span>
      </button>

      {/* Hidden Print Content */}
      <div className="hidden">
        <div
          ref={contentRef}
          className="print-content p-8 max-w-[210mm] mx-auto bg-white text-black min-h-screen"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-6 mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-600 uppercase tracking-wide">
              {t("subtitle")}
            </p>
          </div>

          {/* Event Title & Info */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {getLocalizedText(event.title, locale)}
                </h2>
                <p className="text-gray-600 italic">
                  {getLocalizedText(event.location, locale)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatDate(event.start_date, locale)}</p>
                <p className="text-gray-600">{formatTimeRange(event.start_time, event.end_time, locale)}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg mb-8 text-sm leading-relaxed text-gray-800 text-justify">
              {event.description ? (
                <RichTextContent value={event.description} locale={locale} defaultLocale="th" />
              ) : (
                "-"
              )}
            </div>
          </div>

          {/* Schedule Table */}
          {event.schedules && event.schedules.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold uppercase border-b border-black mb-4 pb-2">
                {t("scheduleTitle")}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black">
                    <th className="py-2 text-left w-24">{t("time")}</th>
                    <th className="py-2 text-left">{t("activity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {event.schedules.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-2 font-mono align-top">
                        {formatTimeRange(item.start_time, item.end_time, locale)}
                      </td>
                      <td className="py-3 px-2">
                        {getLocalizedText(item.activity, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>{t("footerTitle")}</p>
            <p>
              {t("printedOn")}{" "}
              {new Date().toLocaleDateString(
                locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US",
              )}
            </p>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            background: white;
          }
          .print-content {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
