'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Save } from 'lucide-react';
import { adminAlertService } from '@/services/alertService';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MultiLangInput } from '@/components/admin/MultiLangInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/hooks/useToast';
import { SiteAlert, SiteAlertFormData, SiteAlertSeverity, SiteAlertDisplayType, SiteAlertScope } from '@/types/alert';
import { MultiLangText } from '@/types/api';
import { FormActionBar } from '@/components/admin/FormActionBar';
import { PageLoading } from '@/components/ui/Loading';

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

const defaultForm: SiteAlertFormData = {
  title: { ...emptyLang },
  message: { ...emptyLang },
  severity: 'info',
  display_type: 'top_banner',
  scope: 'all_pages',
  action_text: { ...emptyLang },
  action_url: '',
  starts_at: null,
  ends_at: null,
  is_active: true,
  display_order: 0,
  is_dismissible: true,
};

export default function AdminAlertFormPage() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';
  const isEditMode = !isNew;
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('admin.siteAlerts');
  const { toast } = useToast();

  const [formData, setFormData] = useState<SiteAlertFormData>(defaultForm);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isNew) {
      const load = async () => {
        try {
          const alert = await adminAlertService.getById(id);
          setFormData({
            title: { ...emptyLang, ...alert.title },
            message: { ...emptyLang, ...alert.message },
            severity: alert.severity || 'info',
            display_type: alert.display_type || 'top_banner',
            scope: alert.scope || 'all_pages',
            action_text: { ...emptyLang, ...(alert.action_text || {}) },
            action_url: alert.action_url || '',
            starts_at: alert.starts_at || null,
            ends_at: alert.ends_at || null,
            is_active: alert.is_active ?? true,
            display_order: alert.display_order || 0,
            is_dismissible: alert.is_dismissible ?? true,
          });
        } catch {
          toast.error('ไม่สามารถโหลดข้อมูลประกาศได้');
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }
  }, [id, isNew]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title.th || !formData.message.th) {
      toast.error('กรุณาระบุหัวข้อและข้อความภาษาไทย');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<SiteAlert> = {
        title: formData.title,
        message: formData.message,
        severity: formData.severity,
        display_type: formData.display_type,
        scope: formData.scope,
        action_text: formData.action_text,
        action_url: formData.action_url,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        is_active: formData.is_active,
        display_order: formData.display_order,
        is_dismissible: formData.is_dismissible,
      };

      if (isNew) {
        await adminAlertService.create(payload);
        toast.success(t('saveSuccess'));
      } else {
        await adminAlertService.update(id, payload);
        toast.success(t('saveSuccess'));
      }
      setIsDirty(false);
      setTimeout(() => {
        router.push('/admin/alerts');
      }, 800);
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-[calc(100vh-7rem)] flex flex-col justify-between space-y-8">
      <div className="space-y-8 flex-1">
        <AdminPageHeader
          title={isNew ? t('create') : t('edit')}
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: t('title'), href: '/admin/alerts' },
            { label: isNew ? t('create') : t('edit') },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Form (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-admin-surface border border-admin-border space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-3">
                {t('form.sectionContent')}
              </h2>

              <MultiLangInput
                label={t('form.title')}
                value={formData.title}
                onChange={(v) => {
                  setIsDirty(true);
                  setFormData({ ...formData, title: v });
                }}
                required
              />

              <MultiLangInput
                label={t('form.message')}
                value={formData.message}
                onChange={(v) => {
                  setIsDirty(true);
                  setFormData({ ...formData, message: v });
                }}
                type="textarea"
                required
              />
            </div>

            <div className="p-6 bg-admin-surface border border-admin-border space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-3">
                {t('form.sectionAction')}
              </h2>

              <MultiLangInput
                label={t('form.actionText')}
                value={formData.action_text}
                onChange={(v) => {
                  setIsDirty(true);
                  setFormData({ ...formData, action_text: v });
                }}
              />

              <Input
                label={t('form.actionUrl')}
                value={formData.action_url}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, action_url: e.target.value });
                }}
                placeholder={t('form.actionUrlPlaceholder')}
              />
            </div>
          </div>

          {/* Sidebar Controls (Right 1 Column) */}
          <div className="space-y-6">
            <div className="p-6 bg-admin-surface border border-admin-border space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-3">
                {t('form.sectionDisplay')}
              </h2>

              <Select
                label={t('form.severity')}
                value={formData.severity}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, severity: e.target.value as SiteAlertSeverity });
                }}
                options={[
                  { value: 'info', label: t('form.severityInfo') },
                  { value: 'warning', label: t('form.severityWarning') },
                  { value: 'critical', label: t('form.severityCritical') },
                ]}
              />

              <Select
                label={t('form.displayType')}
                value={formData.display_type}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, display_type: e.target.value as SiteAlertDisplayType });
                }}
                options={[
                  { value: 'top_banner', label: t('form.displayTopBanner') },
                  { value: 'modal_popup', label: t('form.displayModalPopup') },
                ]}
              />

              <Select
                label={t('form.scope')}
                value={formData.scope}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, scope: e.target.value as SiteAlertScope });
                }}
                options={[
                  { value: 'all_pages', label: t('form.scopeAllPages') },
                  { value: 'home_only', label: t('form.scopeHomeOnly') },
                ]}
              />

              <Input
                label={t('form.startsAt')}
                type="datetime-local"
                value={formData.starts_at ? new Date(formData.starts_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({
                    ...formData,
                    starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  });
                }}
              />

              <Input
                label={t('form.endsAt')}
                type="datetime-local"
                value={formData.ends_at ? new Date(formData.ends_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({
                    ...formData,
                    ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  });
                }}
              />

              <Input
                label={t('form.displayOrder')}
                type="number"
                value={String(formData.display_order)}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 });
                }}
              />

              <div className="pt-2 space-y-2 border-t border-admin-border">
                <Checkbox
                  label={t('form.isActive')}
                  checked={formData.is_active}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, is_active: e.target.checked });
                  }}
                />
                <Checkbox
                  label={t('form.isDismissible')}
                  checked={formData.is_dismissible}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, is_dismissible: e.target.checked });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <FormActionBar
        isDirty={isDirty}
        isLoading={isSaving}
        isEditMode={isEditMode}
        onCancel={() => router.push(`/${locale}/admin/alerts`)}
      />
    </form>
  );
}
