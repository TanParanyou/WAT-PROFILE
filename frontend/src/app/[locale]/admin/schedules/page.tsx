'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { PermissionButton } from '@/components/admin/PermissionButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { MultiLangInput } from '@/components/admin/MultiLangInput';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useConfirm, FormModal, useModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useDataTable } from '@/hooks/useDataTable';
import { scheduleAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { Schedule } from '@/types/entities';
import type { MultiLangText } from '@/types/api';

const scheduleTypeOptions = [
    { value: '', label: 'เลือกประเภท' },
    { value: 'daily', label: 'รายวัน' },
    { value: 'weekly', label: 'รายสัปดาห์' },
    { value: 'special', label: 'พิเศษ' },
];

const dayOfWeekOptions = [
    { value: '', label: 'เลือกวัน' },
    { value: '0', label: 'อาทิตย์' },
    { value: '1', label: 'จันทร์' },
    { value: '2', label: 'อังคาร' },
    { value: '3', label: 'พุธ' },
    { value: '4', label: 'พฤหัสบดี' },
    { value: '5', label: 'ศุกร์' },
    { value: '6', label: 'เสาร์' },
];

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

const defaultForm = {
    schedule_type: '',
    day_of_week: null as number | null,
    time_start: '',
    time_end: '',
    activity: { ...emptyLang },
    location: { ...emptyLang },
    online_link: '',
    is_active: true,
    display_order: 0,
};

export default function SchedulesPage() {
    const { toasts, toast, removeToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { isOpen, open, close } = useModal();
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({ ...defaultForm });

    const { data, pagination, sort, onPageChange, onSort, isLoading, fetchData } =
        useDataTable<Schedule>({ fetcher: (p) => scheduleAdminService.getAll({ page: p.page, limit: p.limit }) });

    const getTypeLabel = (type: string) => scheduleTypeOptions.find(o => o.value === type)?.label || type;
    const getDayLabel = (day: number | null) => day !== null ? dayOfWeekOptions.find(o => o.value === String(day))?.label || '-' : '-';

    const handleCreate = () => {
        setEditingSchedule(null);
        setForm({ ...defaultForm, activity: { ...emptyLang }, location: { ...emptyLang } });
        open();
    };

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        setForm({
            schedule_type: schedule.schedule_type,
            day_of_week: schedule.day_of_week,
            time_start: schedule.time_start || '',
            time_end: schedule.time_end || '',
            activity: schedule.activity || { ...emptyLang },
            location: schedule.location || { ...emptyLang },
            online_link: schedule.online_link || '',
            is_active: schedule.is_active,
            display_order: schedule.display_order,
        });
        open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.schedule_type) { toast.error('กรุณาเลือกประเภท'); return; }
        if (form.schedule_type === 'weekly' && form.day_of_week === null) { toast.error('กรุณาเลือกวัน'); return; }
        if (!form.activity.th) { toast.error('กรุณากรอกกิจกรรม (ไทย)'); return; }

        setIsSaving(true);
        try {
            const submitData = {
                ...form,
                time_start: form.time_start || null,
                time_end: form.time_end || null,
                day_of_week: form.schedule_type === 'weekly' ? form.day_of_week : null,
            };
            if (editingSchedule) {
                await scheduleAdminService.update(editingSchedule.id, submitData);
                toast.success('อัปเดตสำเร็จ');
            } else {
                await scheduleAdminService.create(submitData);
                toast.success('เพิ่มสำเร็จ');
            }
            close();
            fetchData();
        } catch { toast.error('บันทึกไม่สำเร็จ'); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (schedule: Schedule) => {
        if (await confirm({ title: 'ลบตารางเวลา', message: `ยืนยันการลบ "${schedule.activity.th}"?`, variant: 'danger' })) {
            try { await scheduleAdminService.delete(schedule.id); toast.success('ลบสำเร็จ'); fetchData(); }
            catch { toast.error('ลบไม่สำเร็จ'); }
        }
    };

    const columns: Column<Schedule>[] = [
        { header: 'ประเภท', accessorKey: 'schedule_type', sortable: true, cell: (v) => getTypeLabel(v) },
        { header: 'วัน', accessorKey: 'day_of_week', cell: (v) => getDayLabel(v as number | null) },
        { header: 'เวลา', cell: (_, row) => row.time_start && row.time_end ? `${row.time_start} - ${row.time_end}` : row.time_start || row.time_end || '-' },
        { header: 'กิจกรรม (TH)', accessorKey: 'activity', sortable: true, cell: (v) => v?.th || '-' },
        { header: 'สถานะ', accessorKey: 'is_active', cell: (v) => <StatusBadge label={v ? 'Active' : 'Inactive'} /> },
        {
            header: 'จัดการ', cell: (_, row) => (
                <div className="flex gap-2">
                    <PermissionGuard resource="schedules" action="update">
                        <button onClick={() => handleEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={16} /></button>
                    </PermissionGuard>
                    <PermissionGuard resource="schedules" action="delete">
                        <button onClick={() => handleDelete(row)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                    </PermissionGuard>
                </div>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="ตารางเวลา"
                breadcrumbs={[{ label: 'ตารางเวลา' }]}
                actions={
                    <PermissionButton resource="schedules" action="create" icon={<Plus size={16} />} onClick={handleCreate}>
                        เพิ่มตารางเวลา
                    </PermissionButton>
                }
            />
            <DataTable columns={columns} data={data} pagination={pagination} sorting={sort} isLoading={isLoading} onPageChange={onPageChange} onSort={onSort} />

            <FormModal isOpen={isOpen} onClose={close} onSubmit={handleSubmit} title={editingSchedule ? 'แก้ไขตารางเวลา' : 'เพิ่มตารางเวลา'} isLoading={isSaving}>
                <div className="space-y-4">
                    <Select id="schedule_type" label="ประเภท" options={scheduleTypeOptions} value={form.schedule_type} onChange={(e) => setForm({ ...form, schedule_type: e.target.value })} required />
                    {form.schedule_type === 'weekly' && (
                        <Select id="day_of_week" label="วัน" options={dayOfWeekOptions} value={form.day_of_week !== null ? String(form.day_of_week) : ''} onChange={(e) => setForm({ ...form, day_of_week: e.target.value ? Number(e.target.value) : null })} required />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input id="time_start" label="เวลาเริ่ม" type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
                        <Input id="time_end" label="เวลาสิ้นสุด" type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
                    </div>
                    <MultiLangInput label="กิจกรรม" value={form.activity} onChange={(v) => setForm({ ...form, activity: v })} required />
                    <MultiLangInput label="สถานที่" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
                    <Input id="online_link" label="ลิงก์ออนไลน์" value={form.online_link} onChange={(e) => setForm({ ...form, online_link: e.target.value })} />
                    <Checkbox label="เปิดใช้งาน" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                </div>
            </FormModal>

            <ConfirmDialog />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
