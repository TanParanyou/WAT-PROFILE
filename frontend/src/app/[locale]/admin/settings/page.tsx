'use client';

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/Loading';
import { settingsAdminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import type { Setting } from '@/types/entities';

export default function SettingsPage() {
    const t = useTranslations('Admin');
    const [settings, setSettings] = useState<Setting[]>([]);
    const [changes, setChanges] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const data = await settingsAdminService.getAll();
            setSettings(data);
        } catch { toast.error(t('settings.loadError')); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { loadSettings(); }, []);

    const handleChange = (key: string, value: string | boolean) => {
        setChanges(prev => ({ ...prev, [key]: String(value) }));
    };

    const getValue = (setting: Setting) => changes[setting.key] ?? setting.value;

    const handleSave = async () => {
        if (Object.keys(changes).length === 0) { toast.info(t('common.noChanges')); return; }
        setIsSaving(true);
        try {
            await settingsAdminService.update(Object.entries(changes).map(([key, value]) => ({ key, value })));
            toast.success(t('common.success'));
            setChanges({});
            loadSettings();
        } catch { toast.error(t('common.error')); }
        finally { setIsSaving(false); }
    };

    // จัดกลุ่มตาม category
    const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
        const cat = s.category || 'General';
        (acc[cat] ||= []).push(s);
        return acc;
    }, {});

    const renderInput = (setting: Setting) => {
        const val = getValue(setting);
        switch (setting.type) {
            case 'boolean':
                return <Checkbox id={setting.key} label={setting.key} checked={val === 'true'} onChange={(e) => handleChange(setting.key, e.target.checked)} />;
            case 'number':
                return <Input id={setting.key} label={setting.key} type="number" value={val} onChange={(e) => handleChange(setting.key, e.target.value)} />;
            case 'textarea':
                return (
                    <div className="space-y-1">
                        <label htmlFor={setting.key} className="text-sm font-medium text-gray-700">{setting.key}</label>
                        <textarea id={setting.key} value={val} onChange={(e) => handleChange(setting.key, e.target.value)} rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-vertical" />
                    </div>
                );
            default:
                return <Input id={setting.key} label={setting.key} value={val} onChange={(e) => handleChange(setting.key, e.target.value)} />;
        }
    };

    if (isLoading) return <PageLoading />;

    return (
        <div>
            <AdminPageHeader title={t('settings.title')} breadcrumbs={[{ label: t('settings.title') }]} />
            <div className="space-y-6 max-w-3xl">
                {Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className="bg-white rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {items.map((setting) => <div key={setting.id}>{renderInput(setting)}</div>)}
                        </div>
                    </div>
                ))}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving || Object.keys(changes).length === 0} isLoading={isSaving}>
                        <Save size={16} className="mr-2" />{t('common.saveChanges')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
