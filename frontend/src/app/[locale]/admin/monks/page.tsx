'use client';

import React from 'react';
import { Link } from "@/navigation";
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { PermissionButton } from '@/components/admin/PermissionButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useConfirm } from '@/components/ui/Modal';
import { useDataTable } from '@/hooks/useDataTable';
import { monkAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { Monk } from '@/types/entities';

export default function MonksListPage() {
    const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
        useDataTable<Monk>({ fetcher: (p) => monkAdminService.getAll({ page: p.page, limit: p.limit }) });
    const { confirm, ConfirmDialog } = useConfirm();
    const { toasts, toast, removeToast } = useToast();

    const handleDelete = async (id: number) => {
        if (await confirm({ title: 'ลบข้อมูลพระสงฆ์', message: 'ยืนยันการลบ?', variant: 'danger' })) {
            try { await monkAdminService.delete(id); toast.success('ลบสำเร็จ'); fetchData(); } catch { toast.error('ลบไม่สำเร็จ'); }
        }
    };

    const columns: Column<Monk>[] = [
        { header: 'รูป', accessorKey: 'image_url', cell: (v) => v ? <img src={v} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-gray-200" /> },
        { header: 'ชื่อ (TH)', accessorKey: 'name', cell: (v) => v?.th || '-', sortable: true },
        { header: 'ตำแหน่ง', accessorKey: 'position', sortable: true },
        { header: 'สถานะ', accessorKey: 'is_active', cell: (v) => <StatusBadge label={v ? 'Active' : 'Inactive'} /> },
        {
            header: 'จัดการ', cell: (_, row) => (
                <div className="flex gap-2">
                    <PermissionGuard resource="monks" action="update">
                        <Link href={`/admin/monks/${row.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={16} /></Link>
                    </PermissionGuard>
                    <PermissionGuard resource="monks" action="delete">
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                    </PermissionGuard>
                </div>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader title="จัดการพระสงฆ์" breadcrumbs={[{ label: 'พระสงฆ์' }]} actions={
                <PermissionButton resource="monks" action="create" icon={<Plus size={16} />}>
                    <Link href="/admin/monks/create">เพิ่มพระสงฆ์</Link>
                </PermissionButton>
            } />
            <DataTable columns={columns} data={data} pagination={pagination} sorting={sort} isLoading={isLoading} onPageChange={onPageChange} onSort={onSort} />
            <ConfirmDialog /><ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
