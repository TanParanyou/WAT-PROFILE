"use client";

import React from "react";
import { Printer, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DonorAnnualSummary } from "@/services/adminService";
import type { Donation } from "@/types/entities";

interface AnnualCertificatePrintSheetProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  donor: DonorAnnualSummary | null;
  statementItems?: Donation[];
}

export function AnnualCertificatePrintSheet({
  isOpen,
  onClose,
  year,
  donor,
  statementItems = [],
}: AnnualCertificatePrintSheetProps) {
  const tAnnual = useTranslations("Admin.donations.annual");
  const tCommon = useTranslations("Admin.common");

  if (!isOpen || !donor) return null;

  const formattedTotal = donor.total_amount.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white text-black w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-none shadow-2xl flex flex-col">
        {/* Controls (Hidden in Print) */}
        <div className="print:hidden p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              {tAnnual("printSheetTitle")}
            </h2>
            <p className="text-xs text-gray-500">
              {tAnnual("forDonor")} {donor.donor_name} — {tAnnual("year")} {year} ({tAnnual("totalAmount")} €{formattedTotal})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-10 px-4 bg-black text-white text-xs font-semibold hover:bg-gray-800 inline-flex items-center gap-1.5 transition-colors"
            >
              <Printer size={15} />
              <span>{tAnnual("printSheetTitle")} (Print)</span>
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

        {/* Official Printable Certificate Document (Apothecary Register & German Tax Compliant) */}
        <div className="p-8 sm:p-14 print:p-0 font-sans text-black bg-white space-y-6 leading-relaxed">
          {/* Header */}
          <div className="border-b-2 border-black pb-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider font-serif">
                  WAT LOUNG POR SAI e.V.
                </h1>
                <p className="text-xs text-gray-600">
                  Theravada Buddhist Temple & Community Association
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Steuernummer / Tax Exemption Register: VR 12345 / FA Frankfurt
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="font-mono font-bold block">
                  ANNUAL-REC-{year}-{donor.receipt_numbers?.[0]?.replace(/[^0-9]/g, "") || "001"}
                </span>
                <span className="text-gray-500 block">
                  Datum: {new Date().toLocaleDateString("de-DE")}
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-2">
            <h2 className="text-base font-bold uppercase tracking-wide underline underline-offset-4">
              JÄHRLICHE ZUWENDUNGSBESTÄTIGUNG / ANNUAL DONATION CERTIFICATE
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              (Sammelbestätigung über Geldzuwendungen im Sinne des § 10b des Einkommensteuergesetzes)
            </p>
            <p className="text-xs font-bold font-mono mt-1">
              Veranlagungszeitraum / Tax Year: {year} (พ.ศ. {year + 543})
            </p>
          </div>

          {/* Donor & Beneficiary Information */}
          <div className="grid grid-cols-2 gap-6 border border-black p-4 text-xs">
            <div>
              <span className="font-bold text-gray-700 block mb-1">
                Name und Anschrift des Zuwendenden (Donor):
              </span>
              <p className="font-bold text-sm">{donor.donor_name}</p>
              {donor.donor_address ? (
                <p className="text-gray-700 whitespace-pre-line mt-0.5">{donor.donor_address}</p>
              ) : (
                <p className="text-gray-400 italic">Keine postalische Anschrift hinterlegt</p>
              )}
              {donor.donor_email && (
                <p className="text-gray-600 mt-1">Email: {donor.donor_email}</p>
              )}
            </div>

            <div>
              <span className="font-bold text-gray-700 block mb-1">
                Empfänger der Zuwendung (Beneficiary):
              </span>
              <p className="font-semibold">Wat Loung Por Sai e.V.</p>
              <p className="text-gray-700">Darmstädter Landstraße</p>
              <p className="text-gray-700">Deutschland / Germany</p>
              <p className="text-gray-600 mt-1">Website: www.watloungporsai.de</p>
            </div>
          </div>

          {/* Total Donation Amount */}
          <div className="border-2 border-black p-4 bg-gray-50 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-600 block">
                Gesamtsumme der Zuwendungen im Jahr {year} (Total Amount):
              </span>
              <span className="text-2xl font-bold font-mono">
                € {formattedTotal} EUR
              </span>
            </div>
            <div className="text-right text-xs">
              <span className="text-gray-600 block">Anzahl der Zuwendungen:</span>
              <span className="font-bold font-mono text-sm">{donor.donation_count} รายการ</span>
            </div>
          </div>

          {/* Itemized Table of Donations */}
          {statementItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
                Aufstellung der einzelnen Zuwendungen (Itemized Contributions):
              </h3>
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border border-black p-1.5 text-center w-8">#</th>
                    <th className="border border-black p-1.5 text-left w-24">Datum (Date)</th>
                    <th className="border border-black p-1.5 text-left w-32">Beleg-Nr. (Receipt)</th>
                    <th className="border border-black p-1.5 text-left">Verwendungszweck (Purpose)</th>
                    <th className="border border-black p-1.5 text-left w-24">Zahlungsart</th>
                    <th className="border border-black p-1.5 text-right w-24">Betrag (Amount)</th>
                  </tr>
                </thead>
                <tbody>
                  {statementItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-black/40">
                      <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-mono">
                        {new Date(item.donation_date).toLocaleDateString("de-DE")}
                      </td>
                      <td className="border border-black p-1.5 font-mono font-semibold">{item.receipt_number}</td>
                      <td className="border border-black p-1.5 text-gray-700">
                        {item.category?.name?.["th"] || item.category?.name?.["de"] || item.category?.name?.["en"] || "Spende / บริจาคบำรุงวัด"}
                      </td>
                      <td className="border border-black p-1.5 capitalize font-mono text-[11px]">{item.donation_method || "Bank"}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold">
                        € {item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Statutory Exemption Declaration */}
          <div className="border-t border-gray-300 pt-3 text-[10px] text-gray-600 leading-relaxed space-y-1">
            <p>
              Wir sind wegen Förderung religiöser Zwecke nach dem Freistellungsbescheid des Finanzamtes als gemeinnützigen Zwecken dienend anerkannt und nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer befreit.
            </p>
            <p>
              Es wird bestätigt, dass die Zuwendung nur zur Förderung steuerbegünstigter religiöser und gemeinnütziger Zwecke verwendet wird.
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black">
            <div className="text-xs">
              <p className="font-semibold">Ort, Datum (Place, Date):</p>
              <p className="text-gray-700 mt-1">Frankfurt am Main, {new Date().toLocaleDateString("de-DE")}</p>
              <div className="mt-8 border-b border-dashed border-black w-48" />
              <p className="text-[10px] text-gray-500 mt-1">Wat Loung Por Sai Verwaltung</p>
            </div>

            <div className="text-xs text-right">
              <p className="font-semibold">Unterschrift des Zuwendungsempfängers:</p>
              <p className="text-gray-700 mt-1">Vorstand / Authorized Representative</p>
              <div className="mt-8 border-b border-dashed border-black w-48 ml-auto" />
              <p className="text-[10px] text-gray-500 mt-1">Rechtsverbindliche Unterschrift & Stempel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
