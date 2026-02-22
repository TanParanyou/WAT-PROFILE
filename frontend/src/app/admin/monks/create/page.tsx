'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MultiLangInput } from '@/components/admin/MultiLangInput';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { monkAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { MultiLangText } from '@/types/api';

const positionOptions = [
    { value: 'abbot', label: 'เจ้าอาวาส' },
    { value: 'vice_abbot', label: 'รองเจ้าอาวาส' },
    { value: 'monk', label: 'พระภิกษุ' },
];

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

export default function CreateMonkPage() {
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: { ...emptyLang }, title: { ...emptyLang }, bio: { ...emptyLang },
        slug: '', position: 'monk', image_url: '', is_active: true, display_order: 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try { await monkAdminService.create(form); toast.success('เพิ่มพระสงฆ์สำเร็จ'); router.push('/admin/monks'); }
        catch { toast.error('เพิ่มไม่สำเร็จ'); }
        finally { setIsLoading(false); }
    };

    return (
        <div>
            <AdminPageHeader title="เพิ่มพระสงฆ์" breadcrumbs={[{ label: 'พระสงฆ์', href: '/admin/monks' }, { label: 'เพิ่มใหม่' }]} />
            <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <MultiLangInput label="ชื่อ" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <Input id="slug" label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                <MultiLangInput label="ตำแหน่ง/ยศ" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                <MultiLangInput label="ประวัติ" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} type="textarea" />
                <Select id="position" label="ตำแหน่ง" options={positionOptions} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                <ImageUpload label="รูปภาพ" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
                <Checkbox label="เปิดใช้งาน" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/monks')}>ยกเลิก</Button>
                    <Button type="submit" isLoading={isLoading}>บันทึก</Button>
                </div>
            </form>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
