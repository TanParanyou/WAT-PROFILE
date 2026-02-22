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
import { galleryCategoryAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { MultiLangText } from '@/types/api';
import type { GalleryCategory } from '@/types/entities';

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

export default function GalleryCategoriesPage() {
    const [categories, setCategories] = useState<GalleryCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { isOpen, open, close } = useModal();
    const { confirm, ConfirmDialog } = useConfirm();
    const { toasts, toast, removeToast } = useToast();

    const [editingCategory, setEditingCategory] = useState<GalleryCategory | null>(null);
    const [form, setForm] = useState({
        name: { ...emptyLang },
        slug: '',
        display_order: 0,
        is_active: true,
    });

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const result = await galleryCategoryAdminService.getAll();
            setCategories(result.data);
        } catch (error) {
            toast.error('โหลดข้อมูลไม่สำเร็จ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setForm({
            name: { ...emptyLang },
            slug: '',
            display_order: 0,
            is_active: true,
        });
        open();
    };

    const handleOpenEdit = (category: GalleryCategory) => {
        setEditingCategory(category);
        setForm({
            name: category.name,
            slug: category.slug,
            display_order: category.display_order,
            is_active: category.is_active,
        });
        open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingCategory) {
                await galleryCategoryAdminService.update(editingCategory.id, form);
                toast.success('แก้ไขหมวดหมู่สำเร็จ');
            } else {
                await galleryCategoryAdminService.create(form);
                toast.success('เพิ่มหมวดหมู่สำเร็จ');
            }
            close();
            loadCategories();
        } catch (error) {
            toast.error(editingCategory ? 'แก้ไขไม่สำเร็จ' : 'เพิ่มไม่สำเร็จ');
        } finally {
            setIsSaving(false);
        }
    };

    const columns: Column<GalleryCategory>[] = [
        { header: 'ชื่อ (TH)', accessorKey: 'name', cell: (v) => v?.th || '-', sortable: true },
        { header: 'ชื่อ (EN)', accessorKey: 'name', cell: (v) => v?.en || '-' },
        { header: 'Slug', accessorKey: 'slug', sortable: true },
        { header: 'ลำดับ', accessorKey: 'display_order', sortable: true },
        { header: 'สถานะ', accessorKey: 'is_active', cell: (v) => <StatusBadge label={v ? 'Active' : 'Inactive'} /> },
        {
            header: 'จัดการ', cell: (_, row) => (
                <div className="flex gap-2">
                    <PermissionGuard resource="gallery" action="update">
                        <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                            <Pencil size={16} />
                        </button>
                    </PermissionGuard>
                </div>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="จัดการหมวดหมู่คลังภาพ"
                breadcrumbs={[
                    { label: 'คลังภาพ', href: '/admin/gallery' },
                    { label: 'หมวดหมู่' }
                ]}
                actions={
                    <PermissionButton resource="gallery" action="create" icon={<Plus size={16} />} onClick={handleOpenCreate}>
                        เพิ่มหมวดหมู่
                    </PermissionButton>
                }
            />

            <DataTable
                columns={columns}
                data={categories}
                isLoading={isLoading}
                hidePagination={true}
            />

            <FormModal
                isOpen={isOpen}
                onClose={close}
                onSubmit={handleSubmit}
                title={editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
                isLoading={isSaving}
            >
                <div className="space-y-4">
                    <MultiLangInput
                        label="ชื่อหมวดหมู่"
                        value={form.name}
                        onChange={(v) => setForm({ ...form, name: v })}
                        required
                    />
                    <Input
                        id="slug"
                        label="Slug"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        required
                    />
                    <Input
                        id="display_order"
                        label="ลำดับการแสดง"
                        type="number"
                        value={form.display_order}
                        onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    />
                    <Checkbox
                        label="เปิดใช้งาน"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                </div>
            </FormModal>

            <ConfirmDialog />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
