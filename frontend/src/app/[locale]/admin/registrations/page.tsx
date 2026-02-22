'use client';

import React, { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Select';
import { useDataTable } from '@/hooks/useDataTable';
import { registrationAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';

const statusOptions = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'approved', label: 'อนุมัติ' },
    { value: 'rejected', label: 'ปฏิเสธ' },
    { value: 'cancelled', label: 'ยกเลิก' },
];

export default function RegistrationsPage() {
    const { toasts, toast, removeToast } = useToast();
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
        useDataTable<Record<string, unknown>>({ fetcher: (p) => registrationAdminService.getAll({ page: p.page, limit: p.limit }) });

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        setUpdatingId(id);
        try {
            await registrationAdminService.updateStatus(id, newStatus);
            toast.success('อัปเดตสถานะสำเร็จ');
            fetchData();
        } catch { toast.error('อัปเดตไม่สำเร็จ'); }
        finally { setUpdatingId(null); }
    };

    const columns: Column<Record<string, unknown>>[] = [
        { header: 'ชื่อ', accessorKey: 'name', sortable: true, cell: (v) => <span className="font-medium">{String(v || '-')}</span> },
        { header: 'อีเมล', accessorKey: 'email', sortable: true, cell: (v) => String(v || '-') },
        { header: 'โทรศัพท์', accessorKey: 'phone', cell: (v) => String(v || '-') },
        { header: 'กิจกรรม', accessorKey: 'event_title', sortable: true, cell: (v) => String(v || '-') },
        { header: 'สถานะ', accessorKey: 'status', sortable: true, cell: (v) => <StatusBadge label={String(v || 'pending')} /> },
        {
            header: 'วันที่', accessorKey: 'created_at', sortable: true,
            cell: (v) => v ? new Date(String(v)).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
        },
        {
            header: 'จัดการ', accessorKey: 'id',
            cell: (v, row) => {
                const id = Number(v);
                return (
                    <Select
                        value={String(row.status || 'pending')}
                        onChange={(e) => handleStatusUpdate(id, e.target.value)}
                        options={statusOptions}
                        disabled={updatingId === id}
                    />
                );
            },
        },
    ];

    return (
        <div>
            <AdminPageHeader title="การลงทะเบียน" breadcrumbs={[{ label: 'การลงทะเบียน' }]} />
            <DataTable columns={columns} data={data} pagination={pagination} sorting={sort} isLoading={isLoading} onPageChange={onPageChange} onSort={onSort} />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
