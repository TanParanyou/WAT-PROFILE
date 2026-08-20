"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Download, Search, Loader2, Users, DollarSign, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { donationAdminService, type AnnualDonationSummaryResponse, type DonorAnnualSummary } from "@/services/adminService";
import type { Donation } from "@/types/entities";
import { AnnualCertificatePrintSheet } from "./AnnualCertificatePrintSheet";

interface AnnualDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnnualDonationModal({ isOpen, onClose }: AnnualDonationModalProps) {
  const tAnnual = useTranslations("Admin.donations.annual");
  const tCommon = useTranslations("Admin.common");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [summaryData, setSummaryData] = useState<AnnualDonationSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected donor for printing certificate
  const [selectedDonor, setSelectedDonor] = useState<DonorAnnualSummary | null>(null);
  const [statementDonations, setStatementDonations] = useState<Donation[]>([]);
  const [isStatementLoading, setIsStatementLoading] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      donationAdminService
        .getAnnualSummary(selectedYear)
        .then(setSummaryData)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, selectedYear]);

  if (!isOpen) return null;

  const donors = summaryData?.donors ?? [];
  const filteredDonors = donors.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.donor_name.toLowerCase().includes(q) ||
      d.donor_email.toLowerCase().includes(q) ||
      d.donor_address.toLowerCase().includes(q)
    );
  });

  const handleOpenCertificate = async (donor: DonorAnnualSummary) => {
    setSelectedDonor(donor);
    setIsStatementLoading(true);
    try {
      const res = await donationAdminService.getAnnualStatement(
        selectedYear,
        donor.donor_name,
        donor.donor_email
      );
      setStatementDonations(res.donations || []);
      setIsPrintOpen(true);
    } catch {
      setStatementDonations([]);
      setIsPrintOpen(true);
    } finally {
      setIsStatementLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!summaryData || summaryData.donors.length === 0) return;

    const headers = [
      "ลำดับ",
      "ชื่อผู้บริจาค (Donor Name)",
      "อีเมล (Email)",
      "ที่อยู่ (Address)",
      "ยอดรวมทั้งปี (Total EUR)",
      "จำนวนครั้ง (Count)",
      "บริจาคครั้งแรก (First Date)",
      "บริจาคล่าสุด (Last Date)",
      "ช่องทางที่ใช้ (Methods)",
    ];

    const rows = summaryData.donors.map((d, index) => [
      index + 1,
      `"${d.donor_name.replace(/"/g, '""')}"`,
      `"${d.donor_email.replace(/"/g, '""')}"`,
      `"${d.donor_address.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      d.total_amount.toFixed(2),
      d.donation_count,
      d.first_date ? d.first_date.split("T")[0] : "",
      d.last_date ? d.last_date.split("T")[0] : "",
      `"${d.methods.join(", ")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wat_donations_annual_summary_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-admin-surface border border-admin-border w-full max-w-5xl rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between bg-admin-surface">
            <div className="flex items-center gap-2.5">
              <FileText className="text-admin-action" size={20} />
              <div>
                <h2 className="text-base font-semibold text-admin-foreground">
                  {tAnnual("modalTitle")}
                </h2>
                <p className="text-xs text-admin-muted">
                  {tAnnual("modalDescription")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted transition-colors rounded-none"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Year Selector & Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-admin-foreground">{tAnnual("taxYear")}:</span>
                <div className="inline-flex border border-admin-control-border bg-admin-surface">
                  {yearOptions.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYear(yr)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold transition-colors ${
                        selectedYear === yr
                          ? "bg-admin-action text-admin-on-action"
                          : "text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!summaryData || summaryData.donors.length === 0}
                  className="min-h-9 px-3.5 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>{tAnnual("exportCsv")}</span>
                </button>
              </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-admin-surface border border-admin-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-admin-muted">{tAnnual("totalYearDonations")} {selectedYear}</span>
                  <DollarSign size={16} className="text-admin-muted" />
                </div>
                <p className="text-2xl font-bold font-mono text-admin-foreground mt-1">
                  € {summaryData ? summaryData.grand_total.toLocaleString("de-DE", { minimumFractionDigits: 2 }) : "0.00"}
                </p>
              </div>

              <div className="p-4 bg-admin-surface border border-admin-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-admin-muted">{tAnnual("uniqueDonors")}</span>
                  <Users size={16} className="text-admin-muted" />
                </div>
                <p className="text-2xl font-bold font-mono text-admin-foreground mt-1">
                  {summaryData ? summaryData.total_donors.toLocaleString() : 0}
                </p>
              </div>

              <div className="p-4 bg-admin-surface border border-admin-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-admin-muted">{tAnnual("transactions")}</span>
                  <Receipt size={16} className="text-admin-muted" />
                </div>
                <p className="text-2xl font-bold font-mono text-admin-foreground mt-1">
                  {summaryData ? summaryData.total_count.toLocaleString() : 0}
                </p>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tAnnual("searchDonorPlaceholder")}
                className="w-full min-h-10 pl-9 pr-4 text-xs bg-admin-surface border border-admin-control-border text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
            </div>

            {/* Donors Table */}
            <div className="border border-admin-border overflow-hidden">
              <div className="overflow-x-auto max-h-[360px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-admin-surface-muted/50 border-b border-admin-border text-admin-muted font-medium sticky top-0 bg-admin-surface">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">{tAnnual("donor")}</th>
                      <th className="p-3">{tAnnual("contactAddress")}</th>
                      <th className="p-3 text-center">{tAnnual("donationCount")}</th>
                      <th className="p-3 text-right">{tAnnual("yearTotal")}</th>
                      <th className="p-3 text-right">{tAnnual("issueCertificate")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border bg-admin-surface">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-admin-muted">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                          <span>{tCommon("loading")}</span>
                        </td>
                      </tr>
                    ) : filteredDonors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-admin-muted">
                          {tCommon("noData")}
                        </td>
                      </tr>
                    ) : (
                      filteredDonors.map((donor, idx) => (
                        <tr key={idx} className="hover:bg-admin-surface-muted/30 transition-colors">
                          <td className="p-3 text-center font-mono text-admin-muted">{idx + 1}</td>
                          <td className="p-3 font-semibold text-admin-foreground">
                            {donor.donor_name}
                          </td>
                          <td className="p-3 text-admin-muted max-w-xs truncate">
                            {donor.donor_email && <span className="block text-admin-body">{donor.donor_email}</span>}
                            {donor.donor_address && (
                              <span className="block text-[11px] text-admin-muted truncate">
                                {donor.donor_address}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-medium text-admin-foreground">
                            {donor.donation_count}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-admin-foreground">
                            € {donor.total_amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenCertificate(donor)}
                              disabled={isStatementLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-action text-[11px] font-semibold transition-colors"
                            >
                              <FileText size={13} />
                              <span>{tAnnual("issueCertificate")}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-admin-border bg-admin-surface flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-5 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-xs font-semibold text-admin-foreground transition-colors"
            >
              {tCommon("close")}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Annual Certificate Modal */}
      {isPrintOpen && (
        <AnnualCertificatePrintSheet
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          year={selectedYear}
          donor={selectedDonor}
          statementItems={statementDonations}
        />
      )}
    </>
  );
}
