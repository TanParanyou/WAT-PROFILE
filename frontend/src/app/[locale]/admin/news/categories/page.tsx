'use client';

import React, { useState } from 'react';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { adminNewsCategoryService } from '@/services/newsService';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { MultiLangInput } from '@/components/admin/MultiLangInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { useDataTable } from '@/hooks/useDataTable';
import { useToast } from '@/hooks/useToast';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { NewsCategory, NewsCategoryFormData } from '@/types/news';
import { MultiLangText } from '@/types/api';
import { generateDefaultSlug, generateSlug } from '@/utils/slug';

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

const defaultForm: NewsCategoryFormData = {
  slug: '',
  name: { ...emptyLang },
  description: { ...emptyLang },
  is_active: true,
  display_order: 0,
};

export default function AdminNewsCategoriesPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('admin.news');
  const { toast } = useToast();
  const getLocalizedText = useLocalizedText();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<NewsCategoryFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<NewsCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, fetchData } = useDataTable<NewsCategory>({
    queryKey: 'admin-news-categories',
    fetcher: () => adminNewsCategoryService.getAll({ limit: 100 }),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...defaultForm,
      slug: generateDefaultSlug('cat'),
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: NewsCategory) => {
    setEditingId(cat.id);
    setFormData({
      slug: cat.slug,
      name: { ...emptyLang, ...cat.name },
      description: { ...emptyLang, ...(cat.description || {}) },
      is_active: cat.is_active,
      display_order: cat.display_order || 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.th || !formData.slug) {
      toast.error('กรุณากรอกชื่อภาษาไทยและ Slug');
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await adminNewsCategoryService.update(editingId, formData as unknown as Partial<NewsCategory>);
        toast.success(t('categoriesPage.saveSuccess'));
      } else {
        await adminNewsCategoryService.create(formData as unknown as Partial<NewsCategory>);
        toast.success(t('categoriesPage.saveSuccess'));
      }
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error(t('categoriesPage.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminNewsCategoryService.delete(deleteTarget.id);
      toast.success(t('categoriesPage.deleteSuccess'));
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error(t('categoriesPage.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<NewsCategory>[] = [
    {
      header: t('categoriesPage.form.name'),
      cell: (_, item) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-admin-foreground">{getLocalizedText(item.name)}</span>
          <span className="text-xs text-admin-muted font-mono">{item.slug}</span>
        </div>
      ),
    },
    {
      header: t('categoriesPage.form.description'),
      cell: (_, item) => (
        <span className="text-xs text-admin-muted max-w-sm truncate block">
          {item.description ? getLocalizedText(item.description) : '-'}
        </span>
      ),
    },
    {
      header: t('categoriesPage.form.order'),
      cell: (_, item) => <span className="font-mono text-xs text-admin-foreground">{item.display_order}</span>,
    },
    {
      header: t('table.status'),
      cell: (_, item) => (
        <span
          className={`px-2 py-0.5 text-[11px] font-medium border ${
            item.is_active
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30'
          }`}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: t('table.actions'),
      cell: (_, item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 text-admin-muted hover:text-admin-foreground transition-colors"
            title={t('table.edit')}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-admin-danger hover:bg-admin-danger-surface transition-colors"
            title={t('table.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('categoriesPage.title')}
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin` },
          { label: t('title'), href: `/${locale}/admin/news` },
          { label: t('categories') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push(`/${locale}/admin/news`)}
            >
              {t('categoriesPage.back')}
            </Button>
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              {t('categoriesPage.create')}
            </Button>
          </div>
        }
      />

      <DataTable columns={columns} data={data} isLoading={isLoading} />

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('categoriesPage.edit') : t('categoriesPage.create')}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-site-foreground">
                {t('categoriesPage.form.slug')} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const s = generateSlug(formData.name);
                  if (s) setFormData((prev) => ({ ...prev, slug: s }));
                }}
                className="text-xs text-site-accent hover:underline font-medium"
              >
                ⚡ Auto Generate
              </button>
            </div>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="temple-news"
              required
            />
          </div>

          <MultiLangInput
            label={t('categoriesPage.form.name')}
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            required
          />

          <MultiLangInput
            label={t('categoriesPage.form.description')}
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            type="textarea"
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label={t('categoriesPage.form.order')}
              type="number"
              value={String(formData.display_order)}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
            />
            <div className="flex items-center pt-6">
              <Checkbox
                label={t('categoriesPage.form.active')}
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-site-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSaving}>
              {t('categoriesPage.back') || 'Cancel'}
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {t('saveSuccess') || 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={t('categoriesPage.deleteConfirm')}>
        <div className="space-y-4">
          <p className="text-sm text-site-muted">
            {t('categoriesPage.deleteConfirmDesc')}
          </p>
          <div className="p-3 bg-site-surface border border-site-border text-sm font-medium">
            {deleteTarget && getLocalizedText(deleteTarget.name)}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              {t('table.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
