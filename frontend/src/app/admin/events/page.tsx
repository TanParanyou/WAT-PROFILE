'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { PermissionButton } from '@/components/admin/PermissionButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/Modal';
import { useDataTable } from '@/hooks/useDataTable';
import { eventAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { Event } from '@/types/entities';

export default function EventsListPage() {
    const { data, pagination, sort, isLoading, onPageChange, onSort, fetchData } =
        useDataTable<Event>({ fetcher: (p) => eventAdminService.getAll({ page: p.page, limit: p.limit }) });
    const { confirm, ConfirmDialog } = useConfirm();
    const { toasts, toast, removeToast } = useToast();

    const handleDelete = async (id: number) => {
        const ok = await confirm({ title: 'ลบกิจกรรม', message: 'คุณต้องการลบกิจกรรมนี้หรือไม่?', variant: 'danger' });
        if (ok) {
            try {
                await eventAdminService.delete(id);
                toast.success('ลบกิจกรรมสำเร็จ');
                fetchData();
            } catch {
                toast.error('ลบไม่สำเร็จ');
            }
        }
    };

    const columns: Column<Event>[] = [
        { header: 'ชื่อ (TH)', accessorKey: 'title', cell: (v) => v?.th || '-', sortable: true },
        { header: 'ประเภท', accessorKey: 'event_type', sortable: true },
        { header: 'วันที่', accessorKey: 'event_date', cell: (v) => v ? new Date(v).toLocaleDateString('th-TH') : '-', sortable: true },
        { header: 'สถานะ', accessorKey: 'is_active', cell: (v) => <StatusBadge label={v ? 'Active' : 'Inactive'} /> },
        {
            header: 'จัดการ',
            cell: (_, row) => (
                <div className="flex gap-2">
                    <PermissionGuard resource="events" action="update">
                        <Link href={`/admin/events/${row.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                            <Pencil size={16} />
                        </Link>
                    </PermissionGuard>
                    <PermissionGuard resource="events" action="delete">
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
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
                title="จัดการกิจกรรม"
                breadcrumbs={[{ label: 'กิจกรรม' }]}
                actions={
                    <PermissionButton resource="events" action="create" icon={<Plus size={16} />}>
                        <Link href="/admin/events/create">สร้างกิจกรรม</Link>
                    </PermissionButton>
                }
            />
            <DataTable columns={columns} data={data} pagination={pagination} sorting={sort} isLoading={isLoading} onPageChange={onPageChange} onSort={onSort} />
            <ConfirmDialog />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
