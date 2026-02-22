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
import { eventAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/Toast';
import type { MultiLangText } from '@/types/api';

const eventTypeOptions = [
    { value: 'ceremony', label: 'พิธีกรรม' },
    { value: 'meditation_course', label: 'คอร์สปฏิบัติธรรม' },
    { value: 'festival', label: 'งานเทศกาล' },
    { value: 'other', label: 'อื่นๆ' },
];

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

export default function CreateEventPage() {
    const router = useRouter();
    const { toasts, toast, removeToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        title: { ...emptyLang },
        description: { ...emptyLang },
        location: { ...emptyLang },
        slug: '',
        event_date: '',
        event_type: 'ceremony',
        image_url: '',
        is_active: true,
        registration_enabled: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await eventAdminService.create(form);
            toast.success('สร้างกิจกรรมสำเร็จ');
            router.push('/admin/events');
        } catch {
            toast.error('สร้างกิจกรรมไม่สำเร็จ');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <AdminPageHeader
                title="สร้างกิจกรรมใหม่"
                breadcrumbs={[{ label: 'กิจกรรม', href: '/admin/events' }, { label: 'สร้างใหม่' }]}
            />
            <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <MultiLangInput label="ชื่อกิจกรรม" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
                <Input id="slug" label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="event-slug" />
                <MultiLangInput label="รายละเอียด" value={form.description} onChange={(v) => setForm({ ...form, description: v })} type="textarea" />
                <div className="grid grid-cols-2 gap-4">
                    <Input id="event_date" label="วันที่จัดงาน" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
                    <Select id="event_type" label="ประเภท" options={eventTypeOptions} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} />
                </div>
                <MultiLangInput label="สถานที่" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
                <ImageUpload label="รูปภาพ" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
                <div className="flex gap-6">
                    <Checkbox label="เปิดใช้งาน" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    <Checkbox label="เปิดลงทะเบียน" checked={form.registration_enabled} onChange={(e) => setForm({ ...form, registration_enabled: e.target.checked })} />
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/events')}>ยกเลิก</Button>
                    <Button type="submit" isLoading={isLoading}>บันทึก</Button>
                </div>
            </form>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
