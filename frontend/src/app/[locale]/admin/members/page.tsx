'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useConfirm } from '@/components/ui/Modal';
import { useDataTable } from '@/hooks/useDataTable';
import { memberAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { Member } from '@/types/entities';

export default function MembersPage() {
    const { toasts, toast, removeToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
        useDataTable<Member>({ fetcher: (p) => memberAdminService.getAll({ page: p.page, limit: p.limit }) });

    const handleDelete = async (id: number) => {
        if (await confirm({ title: 'ลบสมาชิก', message: 'ยืนยันการลบ?', variant: 'danger' })) {
            try { await memberAdminService.delete(id); toast.success('ลบสำเร็จ'); fetchData(); }
            catch { toast.error('ลบไม่สำเร็จ'); }
        }
    };

    const columns: Column<Member>[] = [
        {
            header: 'รูป', accessorKey: 'profile_image_url',
            cell: (v) => v ? <img src={v} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-gray-200" />,
        },
        { header: 'รหัสสมาชิก', accessorKey: 'member_code', sortable: true },
        { header: 'ชื่อ-สกุล (TH)', accessorKey: 'first_name_th', sortable: true, cell: (_, row) => `${row.first_name_th} ${row.last_name_th}` },
        { header: 'โทรศัพท์', accessorKey: 'phone' },
        { header: 'ประเภท', accessorKey: 'membership_type', sortable: true },
        { header: 'สถานะ', accessorKey: 'membership_status', sortable: true, cell: (v) => <StatusBadge label={v} /> },
        {
            header: 'วันที่สมัคร', accessorKey: 'membership_date', sortable: true,
            cell: (v) => v ? new Date(v).toLocaleDateString('th-TH') : '-',
        },
        {
            header: 'จัดการ', cell: (_, row) => (
                <PermissionGuard resource="members" action="delete">
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                </PermissionGuard>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader title="จัดการสมาชิก" breadcrumbs={[{ label: 'สมาชิก' }]} />
            <DataTable columns={columns} data={data} pagination={pagination} sorting={sort} isLoading={isLoading} onPageChange={onPageChange} onSort={onSort} />
            <ConfirmDialog />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
