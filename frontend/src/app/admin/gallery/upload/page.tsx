'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MultiLangInput } from '@/components/admin/MultiLangInput';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/Loading';
import { galleryAdminService, galleryCategoryAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { MultiLangText } from '@/types/api';
import type { GalleryCategory } from '@/types/entities';

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

export default function GalleryUploadPage() {
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categories, setCategories] = useState<GalleryCategory[]>([]);
    const [form, setForm] = useState({
        image_url: '',
        caption: { ...emptyLang },
        category_id: null as number | null,
        display_order: 0,
        is_active: true,
    });

    // โหลดหมวดหมู่
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const result = await galleryCategoryAdminService.getAll();
                setCategories(result.data.filter(c => c.is_active));
            } catch (error) {
                toast.error('โหลดหมวดหมู่ไม่สำเร็จ');
            } finally {
                setIsLoadingCategories(false);
            }
        };
        loadCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.image_url) {
            toast.error('กรุณาเลือกรูปภาพ');
            return;
        }

        setIsLoading(true);
        try {
            await galleryAdminService.create(form);
            toast.success('อัปโหลดรูปภาพสำเร็จ');
            router.push('/admin/gallery');
        } catch {
            toast.error('อัปโหลดไม่สำเร็จ');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingCategories) {
        return <PageLoading text="กำลังโหลดข้อมูล..." />;
    }

    const categoryOptions = [
        { value: '', label: 'ไม่ระบุหมวดหมู่' },
        ...categories.map(cat => ({
            value: cat.id.toString(),
            label: cat.name.th || cat.name.en || cat.slug,
        })),
    ];

    return (
        <div>
            <AdminPageHeader
                title="อัปโหลดรูปภาพ"
                breadcrumbs={[
                    { label: 'คลังภาพ', href: '/admin/gallery' },
                    { label: 'อัปโหลด' }
                ]}
            />
            <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <ImageUpload
                    label="รูปภาพ"
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                />
                <MultiLangInput
                    label="คำอธิบาย"
                    value={form.caption}
                    onChange={(v) => setForm({ ...form, caption: v })}
                    type="textarea"
                />
                <Select
                    id="category"
                    label="หมวดหมู่"
                    options={categoryOptions}
                    value={form.category_id?.toString() || ''}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value ? parseInt(e.target.value) : null })}
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
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/gallery')}>ยกเลิก</Button>
                    <Button type="submit" isLoading={isLoading}>บันทึก</Button>
                </div>
            </form>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
