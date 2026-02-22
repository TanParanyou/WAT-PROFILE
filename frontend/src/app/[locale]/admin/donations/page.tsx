'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useConfirm } from '@/components/ui/Modal';
import { useDataTable } from '@/hooks/useDataTable';
import { donationAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { Donation } from '@/types/entities';

export default function DonationsPage() {
    const { toasts, toast, removeToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
        useDataTable<Donation>({ fetcher: (p) => donationAdminService.getAll({ page: p.page, limit: p.limit }) });

    const handleDelete = async (id: number) => {
        if (await confirm({ title: 'ลบรายการบริจาค', message: 'ยืนยันการลบ?', variant: 'danger' })) {
            try { await donationAdminService.delete(id); toast.success('ลบสำเร็จ'); fetchData(); }
            catch { toast.error('ลบไม่สำเร็จ'); }
        }
    };

    const columns: Column<Donation>[] = [
        { header: 'เลขที่ใบเสร็จ', accessorKey: 'receipt_number', sortable: true },
        {
            header: 'ผู้บริจาค', accessorKey: 'donor_name', sortable: true,
            cell: (v, row) => (
                <div>
                    <span className="font-medium">{v}</span>
                    {row.is_anonymous && <span className="ml-1 text-xs text-gray-500">(นิรนาม)</span>}
                </div>
            ),
        },
        {
            header: 'จำนวนเงิน', accessorKey: 'amount', sortable: true,
            cell: (v, row) => <span className="font-semibold text-green-600">{Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 })} {row.currency}</span>,
        },
        { header: 'วิธีการ', accessorKey: 'donation_method', sortable: true },
        { header: 'หมวดหมู่', accessorKey: 'category', cell: (v) => v?.name?.th || '-' },
        {
            header: 'วันที่', accessorKey: 'donation_date', sortable: true,
            cell: (v) => new Date(v).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
        },
        { header: 'สถานะ', accessorKey: 'status', sortable: true, cell: (v) => <StatusBadge label={v} /> },
        {
            header: 'จัดการ', cell: (_, row) => (
                <PermissionGuard resource="donations" action="delete">
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                </PermissionGuard>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader title="รายการบริจาค" breadcrumbs={[{ label: 'รายการบริจาค' }]} />
            <DataTable columns={columns} data={data} pagination={pagination} sorting={sort} isLoading={isLoading} onPageChange={onPageChange} onSort={onSort} />
            <ConfirmDialog />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
