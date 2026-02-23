"use client";

import React, { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal, useModal, useConfirm } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useDataTable } from "@/hooks/useDataTable";
import { contactAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/admin/Toast";
import type { ContactInquiry } from "@/types/entities";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { exportToCsv } from "@/utils/exportToCsv";

const statusOptions = [
  { value: "pending", label: "รอดำเนินการ" },
  { value: "replied", label: "ตอบกลับแล้ว" },
  { value: "closed", label: "ปิดเรื่อง" },
];

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState<ContactInquiry | null>(
    null,
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { isOpen, open, close } = useModal();
  const { confirm, ConfirmDialog } = useConfirm();
  const { toasts, toast, removeToast } = useToast();
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
      toast.success("บันทึกสำเร็จ");
      close();
      fetchData();
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (contact: ContactInquiry) => {
    if (
      await confirm({
        title: "ลบข้อความ",
        message: `ยืนยันการลบข้อความจาก ${contact.name}?`,
        variant: "danger",
      })
    ) {
      try {
        await contactAdminService.delete(contact.id);
        toast.success("ลบสำเร็จ");
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error("ลบไม่สำเร็จ");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.selectedCount === 0) return;
    if (
      await confirm({
        title: "ลบข้อความ",
        message: "ยืนยันการลบที่เลือก?",
        variant: "danger",
      })
    ) {
      try {
        await contactAdminService.bulkDelete(selectedIds.selectedArray);
        toast.success("ลบสำเร็จ");
        selectedIds.clearSelection();
        fetchData();
      } catch {
        toast.error("ลบไม่สำเร็จ");
      }
    }
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
    { header: "ชื่อ", accessorKey: "name", sortable: true },
    { header: "อีเมล", accessorKey: "email", sortable: true },
    { header: "หัวข้อ", accessorKey: "subject", sortable: true },
    { header: "ประเภท", accessorKey: "inquiry_type" },
    {
      header: "สถานะ",
      accessorKey: "status",
      cell: (v) => {
        const map: Record<string, string> = {
          pending: "รอดำเนินการ",
          replied: "ตอบกลับแล้ว",
          closed: "ปิดเรื่อง",
        };
        return <StatusBadge label={map[v] || v} />;
      },
    },
    {
      header: "วันที่",
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
      header: "จัดการ",
      cell: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewReply(row)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            title="ดู/ตอบกลับ"
          >
            <Eye size={16} />
          </button>
          <PermissionGuard resource="contacts" action="delete">
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 rounded hover:bg-red-50 text-red-500"
              title="ลบ"
            >
              <Trash2 size={16} />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="จัดการข้อความติดต่อ"
        breadcrumbs={[{ label: "ข้อความติดต่อ" }]}
      />

      <div className="flex justify-between items-center mb-4 mt-4">
        <div />
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          Export CSV
        </button>
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
            <Trash2 size={16} />
            ลบข้อมูลที่เลือก
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
        title="ดูรายละเอียดและตอบกลับ"
      >
        {selectedContact && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">ชื่อ:</span>{" "}
                {selectedContact.name}
              </div>
              <div>
                <span className="font-medium text-gray-700">อีเมล:</span>{" "}
                {selectedContact.email}
              </div>
              <div>
                <span className="font-medium text-gray-700">เบอร์โทร:</span>{" "}
                {selectedContact.phone || "-"}
              </div>
              <div>
                <span className="font-medium text-gray-700">ประเภท:</span>{" "}
                {selectedContact.inquiry_type}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หัวข้อ
              </label>
              <p className="text-gray-900">{selectedContact.subject}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ข้อความ
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap text-sm">
                  {selectedContact.message}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ข้อความตอบกลับ
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                placeholder="พิมพ์ข้อความตอบกลับ..."
              />
            </div>
            <Select
              id="status"
              label="สถานะ"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
            {selectedContact.replied_at && (
              <p className="text-xs text-gray-500">
                ตอบกลับเมื่อ:{" "}
                {new Date(selectedContact.replied_at).toLocaleString("th-TH")}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={handleModalClose}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveReply} isLoading={isSaving}>
                บันทึก
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
