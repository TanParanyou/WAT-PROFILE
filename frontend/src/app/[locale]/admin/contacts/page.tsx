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
import { useDataTable } from "@/hooks/useDataTable";
import { contactAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { ContactInquiry } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";

export default function ContactsPage() {
  const t = useTranslations("Admin");

  const statusOptions = [
    { value: "pending", label: t("contacts.pending") },
    { value: "replied", label: t("contacts.replied") },
    { value: "closed", label: t("contacts.closed") },
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

  const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
    useDataTable<ContactInquiry>({
      fetcher: (p) =>
        contactAdminService.getAll({ page: p.page, limit: p.limit }),
    });

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
      fetchData();
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
          fetchData();
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
          fetchData();
        } catch (err) {
          toast.error(t("common.error"));

          throw err;
        }
      },
    });
  };

  const handleExportCsv = () => {
    const exportData = data.map((item) => ({
      id: item.id,
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      subject: item.subject || "",
      inquiry_type: item.inquiry_type || "",
      status: item.status || "",
      created_at: item.created_at
        ? new Date(item.created_at as string).toLocaleDateString("th-TH")
        : "",
    }));

    exportToCsv("contacts_export", exportData, [
      { label: "ID", key: "id" },
      { label: "Name", key: "name" },
      { label: "Email", key: "email" },
      { label: "Phone", key: "phone" },
      { label: "Subject", key: "subject" },
      { label: "Type", key: "inquiry_type" },
      { label: "Status", key: "status" },
      { label: "Date", key: "created_at" },
    ]);
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
          pending: t("contacts.pending"),
          replied: t("contacts.replied"),
          closed: t("contacts.closed"),
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
        actions={
          <Button
            onClick={handleExportCsv}
            variant="outline"
            icon={<Icons.Download size={14} />}
            className="shadow-sm"
          >
            {t("common.exportCsv")}
          </Button>
        }
      />

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

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        sorting={sort}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onSort={onSort}
        selectable={true}
        selectedIds={selectedIds.selectedIds as Set<string | number>}
        onSelect={(id) => selectedIds.toggleSelection(id)}
        onSelectAll={(ids) => selectedIds.selectAll(ids)}
      />

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
