"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/Icons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal, useModal } from "@/components/ui/Modal";
import { useConfirm } from "@/hooks/useConfirm";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { contactAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { ContactInquiry } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
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

interface ContactFilters extends AdminFilterRecord {
  status: string[];
  subject: string[];
  created_from?: string;
  created_to?: string;
}

export default function ContactsPage() {
  const t = useTranslations("Admin");

  const statusOptions = [
    { value: "new", label: "New" },
    { value: "read", label: "Read" },
    { value: "replied", label: t("contacts.replied") },
    { value: "archived", label: "Archived" },
  ];

  const [selectedContact, setSelectedContact] = useState<ContactInquiry | null>(
    null,
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { isOpen, open, close } = useModal();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toast } = useToast();
  const selectedIds = useRowSelection();

  const listState = useAdminListState<ContactFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["status", "subject"],
      single: ["created_from", "created_to"],
      allowedSorts: ["id", "name", "email", "subject", "inquiry_type", "status", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<ContactInquiry, ContactFilters>({
    queryKey: ["admin", "contacts"],
    params: listState.params,
    fetcher: (params) => contactAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const filterDefinitions: AdminFilterDefinition<ContactFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: "สถานะ",
      options: [
        { value: "new", label: "New" },
        { value: "read", label: "Read" },
        { value: "replied", label: "Replied" },
        { value: "archived", label: "Archived" },
      ],
    },
    {
      key: "subject",
      kind: "multi",
      label: "หัวข้อสอบถาม",
      options: [
        { value: "general", label: "General" },
        { value: "merit", label: "Merit" },
        { value: "ceremony", label: "Ceremony" },
        { value: "other", label: "Other" },
      ],
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const s of listState.params.filters.status || []) {
    activeChips.push({ key: "status", value: s, label: `สถานะ: ${s}` });
  }
  for (const sb of listState.params.filters.subject || []) {
    activeChips.push({ key: "subject", value: sb, label: `หัวข้อ: ${sb}` });
  }
  if (listState.params.filters.created_from) {
    activeChips.push({ key: "created_from", value: listState.params.filters.created_from, label: `ตั้งแต่วันที่: ${listState.params.filters.created_from}` });
  }
  if (listState.params.filters.created_to) {
    activeChips.push({ key: "created_to", value: listState.params.filters.created_to, label: `ถึงวันที่: ${listState.params.filters.created_to}` });
  }

  const handleViewReply = (contact: ContactInquiry) => {
    setSelectedContact(contact);
    setReplyMessage(contact.reply_message || "");
    setSelectedStatus(contact.status);
    open();
  };

  const handleSaveReply = async () => {
    if (!selectedContact) return;
    setIsSaving(true);
    try {
      await contactAdminService.updateStatus(
        selectedContact.id,
        selectedStatus,
        replyMessage,
      );
      toast.success(t("common.success"));
      close();
      listQuery.refetch();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (contact: ContactInquiry) => {
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await contactAdminService.delete(contact.id);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
        } catch (err) {
          toast.error(t("common.error"));
          throw err;
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    await confirm({
      title: t("common.delete"),
      message: t("common.confirmDelete"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await contactAdminService.bulkDelete(selectedIds.selectedArray);
          toast.success(t("common.success"));
          selectedIds.clearSelection();
          listQuery.refetch();
        } catch (err) {
          toast.error(t("common.error"));
          throw err;
        }
      },
    });
  };

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        { header: "Name", accessor: (item) => item.name || "" },
        { header: "Email", accessor: (item) => item.email || "" },
        { header: "Phone", accessor: (item) => item.phone || "" },
        { header: "Subject", accessor: (item) => item.subject || "" },
        { header: "Type", accessor: (item) => item.inquiry_type || "" },
        { header: "Status", accessor: (item) => item.status || "" },
        {
          header: "Date",
          accessor: (item) =>
            item.created_at ? new Date(item.created_at as string).toLocaleDateString("th-TH") : "",
        },
      ],
      "contacts_export"
    );
  };

  const handleModalClose = () => {
    close();
    setSelectedContact(null);
    setReplyMessage("");
  };

  const columns: Column<ContactInquiry>[] = [
    { header: t("columns.name"), accessorKey: "name", sortable: true },
    { header: t("columns.email"), accessorKey: "email", sortable: true },
    { header: t("columns.subject"), accessorKey: "subject", sortable: true },
    { header: t("columns.type"), accessorKey: "inquiry_type" },
    {
      header: t("columns.status"),
      accessorKey: "status",
      cell: (v) => {
        const map: Record<string, string> = {
          new: "New",
          read: "Read",
          pending: t("contacts.pending"),
          replied: t("contacts.replied"),
          closed: t("contacts.closed"),
          archived: "Archived",
        };
        return <StatusBadge label={map[v] || v} />;
      },
    },
    {
      header: t("columns.date"),
      accessorKey: "created_at",
      sortable: true,
      cell: (v) =>
        new Date(v as string).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      header: t("columns.actions"),
      cell: (_, row) => (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => handleViewReply(row)}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
            title={t("contacts.viewReply")}
          >
            <Icons.View size={16} />
          </button>
          <PermissionGuard resource="contacts" action="delete">
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors"
              title={t("common.delete")}
            >
              <Icons.Delete size={16} />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("contacts.title")}
        breadcrumbs={[{ label: t("contacts.title") }]}
      />

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
                label="หัวข้อสอบถาม"
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.subject || []}
                onChange={(val) => listState.actions.setFilter("subject", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof ContactFilters, val)}
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
          <AdminDateRangeFilter
            label="ช่วงวันที่ติดต่อ"
            from={listState.params.filters.created_from}
            to={listState.params.filters.created_to}
            onChange={({ from, to }) => {
              listState.actions.setFilter("created_from", from);
              listState.actions.setFilter("created_to", to);
            }}
          />
        </AdminListToolbar>
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.selectedCount}
        onClear={selectedIds.clearSelection}
      >
        <PermissionGuard resource="contacts" action="delete">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
          >
            <Icons.Delete size={16} />
            {t("common.bulkDelete")}
          </button>
        </PermissionGuard>
      </BulkActionToolbar>

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

      {/* View/Reply Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        title={t("contacts.viewReply")}
      >
        {selectedContact && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">
                  {t("columns.name")}:
                </span>{" "}
                {selectedContact.name}
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  {t("columns.email")}:
                </span>{" "}
                {selectedContact.email}
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  {t("contacts.phone")}:
                </span>{" "}
                {selectedContact.phone || "-"}
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  {t("columns.type")}:
                </span>{" "}
                {selectedContact.inquiry_type}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contacts.subject")}
              </label>
              <p className="text-gray-900">{selectedContact.subject}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contacts.message")}
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap text-sm">
                  {selectedContact.message}
                </p>
              </div>
            </div>
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
              placeholder={t("contacts.replyPlaceholder")}
              label={t("contacts.replyMessage")}
            />
            <Select
              id="status"
              label={t("columns.status")}
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
            {selectedContact.replied_at && (
              <p className="text-xs text-gray-500">
                {t("contacts.repliedAt")}:{" "}
                {new Date(selectedContact.replied_at).toLocaleString("th-TH")}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={handleModalClose}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSaveReply} isLoading={isSaving}>
                {t("common.save")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog />
    </div>
  );
}
