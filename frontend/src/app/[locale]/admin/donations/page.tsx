"use client";

import React, { useState } from "react";
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
import { staffDonationSchema, type StaffDonationFormData } from "@/schemas/donation.schema";

interface DonationFilters extends AdminFilterRecord {
  status: string[];
  category: string[];
  method: string[];
  from?: string;
  to?: string;
}

export default function DonationsPage() {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const selectedIds = useRowSelection();
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState<StaffDonationFormData>({ amount: 0, currency: "EUR", donation_date: "", donation_method: "cash", donor_name: "", donor_email: "", receipt_requested: false });

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
      label: "สถานะ",
      options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "category",
      kind: "multi",
      label: "หมวดหมู่",
      options: (filterOptions?.categories || []).map((c) => ({ value: String(c.id), label: c.name?.th || String(c.id) })),
    },
    {
      key: "method",
      kind: "multi",
      label: "ช่องทางการบริจาค",
      options: (filterOptions?.payment_methods || []).map((ch: string) => ({ value: ch, label: ch })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }
  for (const cId of listState.params.filters.category || []) {
    const cName = filterOptions?.categories?.find((c) => String(c.id) === cId)?.name?.th || cId;
    activeChips.push({ key: "category", value: cId, label: `หมวดหมู่: ${cName}` });
  }
  for (const ch of listState.params.filters.method || []) {
    activeChips.push({ key: "method", value: ch, label: `ช่องทาง: ${ch}` });
  }
  if (listState.params.filters.from) {
    activeChips.push({ key: "from", value: listState.params.filters.from, label: `ตั้งแต่วันที่: ${listState.params.filters.from}` });
  }
  if (listState.params.filters.to) {
    activeChips.push({ key: "to", value: listState.params.filters.to, label: `ถึงวันที่: ${listState.params.filters.to}` });
  }

  const handleConfirm = async (id: number) => {
    await confirm({ title: "ยืนยันเงินบริจาค", message: "ตรวจสอบหลักฐานแล้วและยืนยันรายการนี้หรือไม่", onConfirm: async () => { await donationAdminService.confirm(id); toast.success(t("common.success")); await listQuery.refetch(); } });
  };

  const handleCancel = async (id: number) => {
    const reason = window.prompt("เหตุผลที่ยกเลิกรายการ");
    if (!reason?.trim()) return;
    await donationAdminService.cancel(id, reason.trim());
    toast.success("ยกเลิกรายการแล้ว");
    await listQuery.refetch();
  };

  const handleStaffCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = staffDonationSchema.safeParse(staffForm);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง"); return; }
    await donationAdminService.createStaff(parsed.data);
    toast.success("บันทึกรายการแล้ว");
    setShowStaffForm(false);
    setStaffForm({ amount: 0, currency: "EUR", donation_date: "", donation_method: "cash", donor_name: "", donor_email: "", receipt_requested: false });
    await listQuery.refetch();
  };

  const handleReceipt = async (id: number) => {
    await confirm({ title: "ส่งใบเสร็จ", message: "ระบบจะสร้าง PDF ถาวรและเข้าคิวส่งไปยังอีเมลผู้บริจาค ยืนยันหรือไม่", onConfirm: async () => { await donationAdminService.sendReceipt(id); toast.success("เข้าคิวส่งใบเสร็จแล้ว"); await listQuery.refetch(); } });
  };

  const handleProof = async (id: number) => {
    const blob = await donationAdminService.getProof(id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `donation-${id}-proof`; anchor.click(); URL.revokeObjectURL(url);
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
          header: "Date",
          accessor: (item) =>
            item.donation_date ? new Date(item.donation_date).toLocaleDateString("th-TH") : "",
        },
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
      cell: (v) =>
        new Date(v as string).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
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
          {row.source === "self_reported" && <PermissionGuard resource="donations" action="read"><button type="button" onClick={() => void handleProof(row.id)} className="p-1.5 rounded hover:bg-admin-surface-muted text-admin-muted" title="ดูหลักฐาน"><Icons.Download size={16} /></button></PermissionGuard>}
          {row.status === "pending" && <PermissionGuard resource="donations" action="update"><button type="button" onClick={() => void handleConfirm(row.id)} className="p-1.5 rounded hover:bg-admin-success-surface text-admin-success" title="ยืนยัน"><Icons.Save size={16} /></button></PermissionGuard>}
          {row.status === "confirmed" && row.receipt_requested && row.donor_email && !row.receipt_dispatched_at && <PermissionGuard resource="donations" action="update"><button type="button" onClick={() => void handleReceipt(row.id)} className="p-1.5 rounded hover:bg-admin-surface-muted text-admin-muted" title="ส่งใบเสร็จ"><Icons.FileText size={16} /></button></PermissionGuard>}
          {row.status !== "cancelled" && <PermissionGuard resource="donations" action="update"><button type="button" onClick={() => void handleCancel(row.id)} className="p-1.5 rounded hover:bg-admin-danger-surface text-admin-muted hover:text-admin-danger" title="ยกเลิก"><Icons.Delete size={16} /></button></PermissionGuard>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("donations.title")}
        breadcrumbs={[{ label: t("donations.title") }]}
        actions={<PermissionGuard resource="donations" action="create"><button type="button" onClick={() => setShowStaffForm((value) => !value)} className="min-h-11 bg-admin-action px-4 py-2 text-sm font-semibold text-admin-on-action">บันทึกรายการโดยเจ้าหน้าที่</button></PermissionGuard>}
      />

      {showStaffForm && <form onSubmit={handleStaffCreate} className="mb-6 grid gap-3 border border-admin-border bg-admin-surface p-4 md:grid-cols-4">
        <input aria-label="จำนวนเงิน" type="number" min="0.01" step="0.01" value={staffForm.amount || ""} onChange={(event) => setStaffForm({ ...staffForm, amount: Number(event.target.value) })} placeholder="จำนวนเงิน EUR" className="min-h-11 border border-admin-border px-3" required />
        <input aria-label="วันที่บริจาค" type="date" value={staffForm.donation_date} onChange={(event) => setStaffForm({ ...staffForm, donation_date: event.target.value })} className="min-h-11 border border-admin-border px-3" required />
        <select aria-label="ช่องทาง" value={staffForm.donation_method} onChange={(event) => setStaffForm({ ...staffForm, donation_method: event.target.value as StaffDonationFormData["donation_method"] })} className="min-h-11 border border-admin-border px-3"><option value="cash">เงินสด</option><option value="bank_transfer">โอนธนาคาร</option><option value="paypal">PayPal</option></select>
        <input aria-label="อีเมล" type="email" value={staffForm.donor_email} onChange={(event) => setStaffForm({ ...staffForm, donor_email: event.target.value })} placeholder="อีเมล (ถ้าต้องการใบเสร็จ)" className="min-h-11 border border-admin-border px-3" />
        <input aria-label="ชื่อผู้บริจาค" value={staffForm.donor_name} onChange={(event) => setStaffForm({ ...staffForm, donor_name: event.target.value })} placeholder="ชื่อผู้บริจาค (ไม่บังคับ)" className="min-h-11 border border-admin-border px-3 md:col-span-2" />
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={staffForm.receipt_requested} onChange={(event) => setStaffForm({ ...staffForm, receipt_requested: event.target.checked })} className="size-5" />ขอใบเสร็จ</label>
        <div className="flex gap-2 md:col-span-4"><button type="submit" className="min-h-11 bg-admin-action px-4 py-2 text-sm font-semibold text-admin-on-action">บันทึก</button><button type="button" onClick={() => setShowStaffForm(false)} className="min-h-11 border border-admin-border px-4 py-2 text-sm">ยกเลิก</button></div>
      </form>}

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
                label="สถานะ"
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.status || []}
                onChange={(val) => listState.actions.setFilter("status", val)}
              />
              <AdminMultiSelectFilter
                label="หมวดหมู่"
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
            label="ช่องทางการบริจาค"
            options={filterDefinitions[2].options || []}
            values={listState.params.filters.method || []}
            onChange={(val) => listState.actions.setFilter("method", val)}
          />
          <AdminDateRangeFilter
            label="ช่วงวันที่บริจาค"
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
      <ConfirmDialog />
    </div>
  );
}
