"use client";

import React, { useState } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useConfirm } from "@/hooks/useConfirm";
import { donationAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Donation } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { Icons } from "@/components/ui/Icons";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminDateRangeFilter } from "@/components/admin/list/AdminDateRangeFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { useQuery } from "@tanstack/react-query";
import type { StaffDonationFormData } from "@/schemas/donation.schema";
import { StaffDonationForm } from "@/features/admin/donations/StaffDonationForm";
import { CancelDonationDialog } from "@/features/admin/donations/CancelDonationDialog";
import { DonationProofPreviewDrawer, type DonationProofPreviewKind } from "@/features/admin/donations/DonationProofPreviewModal";

interface DonationFilters extends AdminFilterRecord {
  status: string[];
  category: string[];
  method: string[];
  from?: string;
  to?: string;
}

interface DonationProofPreviewState {
  url: string;
  fileName: string;
  kind: DonationProofPreviewKind;
}

export default function DonationsPage() {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const selectedIds = useRowSelection();
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [cancelID, setCancelID] = useState<number | null>(null);
  const [isProofPreviewOpen, setIsProofPreviewOpen] = useState(false);
  const [proofPreview, setProofPreview] = useState<DonationProofPreviewState | null>(null);
  const [proofPreviewError, setProofPreviewError] = useState<string | null>(null);
  const [proofPreviewLoadingId, setProofPreviewLoadingId] = useState<number | null>(null);
  const proofPreviewUrlRef = useRef<string | null>(null);
  const proofRequestRef = useRef(0);

  const revokeProofPreviewUrl = useCallback(() => {
    if (!proofPreviewUrlRef.current) return;
    URL.revokeObjectURL(proofPreviewUrlRef.current);
    proofPreviewUrlRef.current = null;
  }, []);

  useEffect(() => revokeProofPreviewUrl, [revokeProofPreviewUrl]);

  const listState = useAdminListState<DonationFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["status", "category", "method"],
      single: ["from", "to"],
      allowedSorts: ["id", "receipt_number", "donor_name", "amount", "donation_method", "donation_date", "status", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<Donation, DonationFilters>({
    queryKey: ["admin", "donations"],
    params: listState.params,
    fetcher: (params) => donationAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["admin", "donations", "filter-options"],
    queryFn: () => donationAdminService.getFilterOptions(),
  });

  const filterDefinitions: AdminFilterDefinition<DonationFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("donations.status"),
      options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "category",
      kind: "multi",
      label: t("donations.category"),
      options: (filterOptions?.categories || []).map((c) => ({ value: String(c.id), label: c.name?.th || String(c.id) })),
    },
    {
      key: "method",
      kind: "multi",
      label: t("donations.method"),
      options: (filterOptions?.payment_methods || []).map((ch: string) => ({ value: ch, label: ch })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `${t("donations.status")}: ${s}` });
  }
  for (const cId of listState.params.filters.category || []) {
    const cName = filterOptions?.categories?.find((c) => String(c.id) === cId)?.name?.th || cId;
    activeChips.push({ key: "category", value: cId, label: `${t("donations.category")}: ${cName}` });
  }
  for (const ch of listState.params.filters.method || []) {
    activeChips.push({ key: "method", value: ch, label: `${t("donations.method")}: ${ch}` });
  }
  if (listState.params.filters.from) {
    activeChips.push({ key: "from", value: listState.params.filters.from, label: `${t("donations.from")}: ${listState.params.filters.from}` });
  }
  if (listState.params.filters.to) {
    activeChips.push({ key: "to", value: listState.params.filters.to, label: `${t("donations.to")}: ${listState.params.filters.to}` });
  }

  const handleConfirm = async (id: number) => {
    await confirm({ title: t("donations.confirmTitle"), message: t("donations.confirmMessage"), onConfirm: async () => { await donationAdminService.confirm(id); toast.success(t("common.success")); await listQuery.refetch(); } });
  };

  const handleCancel = async (id: number) => {
    setCancelID(id);
  };

  const submitCancellation = async (reason: string) => {
    if (cancelID === null) return;
    await donationAdminService.cancel(cancelID, reason);
    toast.success(t("donations.cancelled"));
    setCancelID(null);
    await listQuery.refetch();
  };

  const handleStaffCreate = async (data: StaffDonationFormData) => {
    await donationAdminService.createStaff(data);
    toast.success(t("donations.saved"));
    setShowStaffForm(false);
    await listQuery.refetch();
  };

  const handleReceipt = async (id: number) => {
    await confirm({ title: t("donations.sendReceipt"), message: t("donations.sendReceiptMessage"), onConfirm: async () => { await donationAdminService.sendReceipt(id); toast.success(t("donations.receiptQueued")); await listQuery.refetch(); } });
  };

  const handleProof = async (id: number) => {
    const requestId = proofRequestRef.current + 1;
    proofRequestRef.current = requestId;
    revokeProofPreviewUrl();
    setProofPreview(null);
    setProofPreviewError(null);
    setProofPreviewLoadingId(id);
    setIsProofPreviewOpen(true);
    try {
      const blob = await donationAdminService.getProof(id);
      if (proofRequestRef.current !== requestId) return;
      const contentType = blob.type.toLowerCase();
      const kind: DonationProofPreviewKind = contentType.startsWith("image/") ? "image" : "pdf";
      const extension = contentType === "application/pdf"
        ? "pdf"
        : contentType === "image/png"
          ? "png"
          : contentType === "image/webp"
            ? "webp"
            : "jpg";
      const url = URL.createObjectURL(blob);
      proofPreviewUrlRef.current = url;
      setProofPreview({ url, kind, fileName: `donation-${id}-proof.${extension}` });
    } catch {
      if (proofRequestRef.current === requestId) setProofPreviewError(t("donations.proofPreviewError"));
    } finally {
      if (proofRequestRef.current === requestId) setProofPreviewLoadingId(null);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        { header: "Receipt Number", accessor: (item) => item.receipt_number || "" },
        { header: "Donor Name", accessor: (item) => item.donor_name || "" },
        { header: "Amount", accessor: (item) => item.amount || 0 },
        { header: "Currency", accessor: (item) => item.currency || "THB" },
        { header: "Method", accessor: (item) => item.donation_method || "" },
        { header: "Category", accessor: (item) => item.category?.name?.th || "" },
        {
          header: t("donations.date"),
          accessor: (item) =>
            item.donation_date ? new Date(item.donation_date).toLocaleDateString("th-TH") : "",
        },
        { header: t("donations.time"), accessor: (item) => item.donation_time || "" },
        { header: "Status", accessor: (item) => item.status || "" },
      ],
      "donations_export"
    );
  };

  const columns: Column<Donation>[] = [
    {
      header: t("donations.receiptNumber"),
      accessorKey: "receipt_number",
      sortable: true,
    },
    {
      header: t("donations.donor"),
      accessorKey: "donor_name",
      sortable: true,
      cell: (v, row) => (
        <div>
          <span className="font-medium">{v as React.ReactNode}</span>
          {row.is_anonymous && (
            <span className="ml-1 text-xs text-admin-muted">
              {t("donations.anonymous")}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t("donations.amount"),
      accessorKey: "amount",
      sortable: true,
      cell: (v, row) => (
        <span className="font-semibold text-admin-success">
          {Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
          {row.currency}
        </span>
      ),
    },
    {
      header: t("donations.method"),
      accessorKey: "donation_method",
      sortable: true,
    },
    {
      header: t("columns.category"),
      accessorKey: "category",
      cell: (v) => (v as Donation["category"])?.name?.th || "-",
    },
    {
      header: t("columns.date"),
      accessorKey: "donation_date",
      sortable: true,
      cell: (v, row) => (
        <div>
          <div>{new Date(v as string).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</div>
          {row.donation_time ? <div className="text-xs text-admin-muted">{row.donation_time}</div> : null}
        </div>
      ),
    },
    {
      header: t("columns.status"),
      accessorKey: "status",
      sortable: true,
      cell: (v) => <StatusBadge label={v as string} />,
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <div className="flex gap-1.5">
          {row.source === "self_reported" && <PermissionGuard resource="donations" action="read"><button type="button" onClick={() => void handleProof(row.id)} disabled={proofPreviewLoadingId === row.id} aria-busy={proofPreviewLoadingId === row.id} className="flex min-h-11 min-w-11 items-center justify-center rounded-none text-admin-muted transition-colors hover:bg-admin-surface-muted disabled:cursor-wait disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus" title={t("donations.viewProof")} aria-label={t("donations.viewProof")}><Icons.View size={16} /></button></PermissionGuard>}
          {row.status === "pending" && <PermissionGuard resource="donations" action="update"><button type="button" onClick={() => void handleConfirm(row.id)} className="p-1.5 rounded hover:bg-admin-success-surface text-admin-success" title={t("donations.confirm")}><Icons.Save size={16} /></button></PermissionGuard>}
          {row.status === "confirmed" && row.receipt_requested && row.donor_email && !row.receipt_dispatched_at && <PermissionGuard resource="donations" action="update"><button type="button" onClick={() => void handleReceipt(row.id)} className="p-1.5 rounded hover:bg-admin-surface-muted text-admin-muted" title={t("donations.sendReceipt")}><Icons.FileText size={16} /></button></PermissionGuard>}
          {row.status !== "cancelled" && <PermissionGuard resource="donations" action="update"><button type="button" onClick={() => void handleCancel(row.id)} className="p-1.5 rounded hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger" title={t("donations.cancelAction")}><Icons.Delete size={16} /></button></PermissionGuard>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("donations.title")}
        breadcrumbs={[{ label: t("donations.title") }]}
        actions={<PermissionGuard resource="donations" action="create"><button type="button" onClick={() => setShowStaffForm((value) => !value)} className="min-h-11 bg-admin-action px-4 py-2 text-sm font-semibold text-admin-on-action">{t("donations.createStaff")}</button></PermissionGuard>}
      />

      {showStaffForm && <StaffDonationForm categories={filterOptions?.categories || []} onSubmit={handleStaffCreate} onCancel={() => setShowStaffForm(false)} />}

      <div className="mt-4">
        <AdminListToolbar
          activeFilterCount={activeChips.length}
          search={
            <AdminSearchInput
              value={listState.draftSearch}
              isDebouncing={listState.isDebouncing}
              onChange={(val) => listState.actions.setSearch(val)}
              onSubmit={(val) => listState.actions.setSearch(val, true)}
              onClear={() => listState.actions.setSearch("", true)}
            />
          }
          primaryFilters={
            <>
              <AdminMultiSelectFilter
                label={t("donations.status")}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label={t("donations.category")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.category || []}
                onChange={(val) => listState.actions.setFilter("category", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof DonationFilters, val)}
                onClear={listState.actions.clearFilters}
              />
              <AdminListExportButton
                isExporting={false}
                completed={0}
                total={listQuery.pagination.total}
                onExport={handleExportCsv}
              />
            </div>
          }
        >
          <AdminMultiSelectFilter
            label={t("donations.method")}
            options={filterDefinitions[2].options || []}
            values={listState.params.filters.method || []}
            onChange={(val) => listState.actions.setFilter("method", val)}
          />
          <AdminDateRangeFilter
            label={t("donations.dateRange")}
            from={listState.params.filters.from}
            to={listState.params.filters.to}
            onChange={({ from, to }) => {
              listState.actions.setFilters({
                from: from,
                to: to,
              });
            }}
          />
        </AdminListToolbar>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={listQuery.rows}
          pagination={listQuery.pagination}
          sorting={{ key: listState.params.sort || "created_at", order: listState.params.order }}
          isLoading={listQuery.isLoading}
          onPageChange={listState.actions.setPage}
          onLimitChange={listState.actions.setLimit}
          onSort={(field) => listState.actions.setSort(field)}
          selectable={true}
          selectedIds={selectedIds.selectedIds as Set<string | number>}
          onSelect={(id) => selectedIds.toggleSelection(id)}
          onSelectAll={(ids) => selectedIds.selectAll(ids)}
        />
      </div>
      <DonationProofPreviewDrawer
        isOpen={isProofPreviewOpen}
        isLoading={proofPreviewLoadingId !== null}
        fileUrl={proofPreview?.url ?? null}
        fileName={proofPreview?.fileName ?? null}
        kind={proofPreview?.kind ?? null}
        error={proofPreviewError}
        labels={{
          title: t("donations.proofPreview"),
          close: t("donations.proofPreviewClose"),
          open: t("donations.proofOpen"),
          download: t("donations.proofDownload"),
          loading: t("donations.proofLoading"),
          error: t("donations.proofPreviewError"),
          imageAlt: t("donations.proofImageAlt"),
          pdf: t("donations.proofPdf"),
          zoom: t("donations.proofZoom"),
          zoomIn: t("donations.proofZoomIn"),
          zoomOut: t("donations.proofZoomOut"),
          zoomReset: t("donations.proofZoomReset"),
        }}
        onClose={() => setIsProofPreviewOpen(false)}
      />
      <ConfirmDialog />
      <CancelDonationDialog open={cancelID !== null} onSubmit={submitCancellation} onClose={() => setCancelID(null)} />
    </div>
  );
}
