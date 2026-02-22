'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { PermissionButton } from '@/components/admin/PermissionButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FormModal, useModal, useConfirm } from '@/components/ui/Modal';
import { MultiLangInput } from '@/components/admin/MultiLangInput';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { donationCategoryAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { DonationCategory } from '@/types/entities';
import type { MultiLangText } from '@/types/api';

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

export default function DonationCategoriesPage() {
    const [categories, setCategories] = useState<DonationCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { isOpen, open, close } = useModal();
    const { confirm, ConfirmDialog } = useConfirm();
    const { toasts, toast, removeToast } = useToast();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: { ...emptyLang },
        description: { ...emptyLang },
        display_order: 0,
        is_active: true,
    });

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const result = await donationCategoryAdminService.getAll();
            setCategories(result.data);
        } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { loadCategories(); }, []);

    const handleOpenCreate = () => {
        setEditingId(null);
        setForm({ name: { ...emptyLang }, description: { ...emptyLang }, display_order: 0, is_active: true });
        open();
    };

    const handleOpenEdit = (cat: DonationCategory) => {
        setEditingId(cat.id);
        setForm({ name: cat.name, description: cat.description, display_order: cat.display_order, is_active: cat.is_active });
        open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.th) { toast.error('กรุณากรอกชื่อหมวดหมู่ (ไทย)'); return; }
        setIsSaving(true);
        try {
            if (editingId) {
                await donationCategoryAdminService.update(editingId, form);
                toast.success('แก้ไขสำเร็จ');
            } else {
                await donationCategoryAdminService.create(form);
                toast.success('เพิ่มสำเร็จ');
            }
            close();
            loadCategories();
        } catch { toast.error('บันทึกไม่สำเร็จ'); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (await confirm({ title: 'ลบหมวดหมู่', message: 'ยืนยันการลบ?', variant: 'danger' })) {
            try { await donationCategoryAdminService.delete(id); toast.success('ลบสำเร็จ'); loadCategories(); }
            catch { toast.error('ลบไม่สำเร็จ'); }
        }
    };

    const columns: Column<DonationCategory>[] = [
        { header: 'ชื่อ (TH)', accessorKey: 'name', cell: (v) => v?.th || '-', sortable: true },
        { header: 'ชื่อ (EN)', accessorKey: 'name', cell: (v) => v?.en || '-' },
        { header: 'คำอธิบาย', accessorKey: 'description', cell: (v) => v?.th || '-' },
        { header: 'ลำดับ', accessorKey: 'display_order', sortable: true },
        { header: 'สถานะ', accessorKey: 'is_active', cell: (v) => <StatusBadge label={v ? 'Active' : 'Inactive'} /> },
        {
            header: 'จัดการ', cell: (_, row) => (
                <div className="flex gap-2">
                    <PermissionGuard resource="donations" action="update">
                        <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={16} /></button>
                    </PermissionGuard>
                    <PermissionGuard resource="donations" action="delete">
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                    </PermissionGuard>
                </div>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="หมวดหมู่การบริจาค"
                breadcrumbs={[{ label: 'รายการบริจาค', href: '/admin/donations' }, { label: 'หมวดหมู่' }]}
                actions={
                    <PermissionButton resource="donations" action="create" icon={<Plus size={16} />} onClick={handleOpenCreate}>
                        เพิ่มหมวดหมู่
                    </PermissionButton>
                }
            />
            <DataTable columns={columns} data={categories} isLoading={isLoading} hidePagination={true} />

            <FormModal isOpen={isOpen} onClose={close} onSubmit={handleSubmit} title={editingId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'} isLoading={isSaving}>
                <div className="space-y-4">
                    <MultiLangInput label="ชื่อหมวดหมู่" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                    <MultiLangInput label="คำอธิบาย" value={form.description} onChange={(v) => setForm({ ...form, description: v })} type="textarea" />
                    <Input id="display_order" label="ลำดับ" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
                    <Checkbox label="เปิดใช้งาน" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                </div>
            </FormModal>

            <ConfirmDialog />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
