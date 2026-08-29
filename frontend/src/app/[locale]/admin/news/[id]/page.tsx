'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { adminNewsService, adminNewsCategoryService } from '@/services/newsService';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MultiLangInput } from '@/components/admin/MultiLangInput';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { RichTextEditor } from '@/components/admin/rich-text/RichTextEditor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/hooks/useToast';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { NewsArticle, NewsCategory, NewsArticleFormData, NewsPublishStatus } from '@/types/news';
import { MultiLangText } from '@/types/api';
import type { RichTextDocument } from '@/lib/rich-text/document';
import { emptyRichTextDocument } from '@/lib/rich-text/document';
import { generateDefaultSlug, generateSlug } from '@/utils/slug';

import { FormActionBar } from '@/components/admin/FormActionBar';
import { PageLoading } from '@/components/ui/Loading';

const emptyLang: MultiLangText = { th: '', en: '', de: '' };

const defaultForm: NewsArticleFormData = {
  slug: '',
  title: { ...emptyLang },
  excerpt: { ...emptyLang },
  content: {
    th: emptyRichTextDocument(),
    en: emptyRichTextDocument(),
    de: emptyRichTextDocument(),
  },
  cover_image_url: '',
  gallery_urls: [],
  category_id: null,
  author_name: 'Wat Loung Por Sai',
  publish_status: 'published',
  published_at: null,
  scheduled_at: null,
  is_featured: false,
  is_pinned: false,
};

export default function AdminNewsFormPage() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';
  const isEditMode = !isNew;
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('admin.news');
  const { toast } = useToast();
  const getLocalizedText = useLocalizedText();

  const [formData, setFormData] = useState<NewsArticleFormData>(() => ({
    ...defaultForm,
    slug: isNew ? generateDefaultSlug('news') : '',
  }));
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [activeLangTab, setActiveLangTab] = useState<'th' | 'en' | 'de'>('th');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load Categories & Existing Article
  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await adminNewsCategoryService.getAll({ limit: 100 });
        setCategories(catRes.data || []);

        if (!isNew) {
          const article = await adminNewsService.getById(id);
          setFormData({
            slug: article.slug,
            title: { ...emptyLang, ...article.title },
            excerpt: { ...emptyLang, ...(article.excerpt || {}) },
            content: {
              th: article.content?.th || emptyRichTextDocument(),
              en: article.content?.en || emptyRichTextDocument(),
              de: article.content?.de || emptyRichTextDocument(),
            },
            cover_image_url: article.cover_image_url || '',
            gallery_urls: article.gallery_urls || [],
            category_id: article.category_id || null,
            author_name: article.author_name || 'Wat Loung Por Sai',
            publish_status: article.publish_status || 'published',
            published_at: article.published_at || null,
            scheduled_at: article.scheduled_at || null,
            is_featured: article.is_featured || false,
            is_pinned: article.is_pinned || false,
          });
        }
      } catch {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [id, isNew]);

  const handleTitleChange = (val: MultiLangText) => {
    setIsDirty(true);
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (isNew && !prev.slug) {
        const source = val.en || val.th || '';
        const generated = source
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (generated) {
          updated.slug = generated;
        }
      }
      return updated;
    });
  };

  const handleRichTextChange = (doc: RichTextDocument) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [activeLangTab]: doc,
      },
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title.th) {
      toast.error('กรุณาระบุหัวข้อข่าวภาษาไทย');
      return;
    }
    if (!formData.slug) {
      toast.error('กรุณาระบุ Slug');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<NewsArticle> = {
        slug: formData.slug,
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        cover_image_url: formData.cover_image_url,
        gallery_urls: formData.gallery_urls,
        category_id: formData.category_id,
        author_name: formData.author_name,
        publish_status: formData.publish_status,
        published_at: formData.published_at,
        scheduled_at: formData.scheduled_at,
        is_featured: formData.is_featured,
        is_pinned: formData.is_pinned,
      };

      if (isNew) {
        await adminNewsService.create(payload);
        toast.success(t('saveSuccess'));
      } else {
        await adminNewsService.update(id, payload);
        toast.success(t('saveSuccess'));
      }
      setIsDirty(false);
      setTimeout(() => {
        router.push('/admin/news');
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
            { label: t('title'), href: '/admin/news' },
            { label: isNew ? t('create') : formData.slug },
          ]}
          actions={
            !isNew ? (
              <div className="flex items-center gap-2">
                <a
                  href={`/news/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-admin-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground transition-colors"
                >
                  <Eye size={14} />
                  <span>{t('viewLive')}</span>
                </a>
              </div>
            ) : undefined
          }
        />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editorial Form (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-admin-surface border border-admin-border space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-3">
              {t('form.sectionTitle')}
            </h2>

            <MultiLangInput
              label={t('form.title')}
              value={formData.title}
              onChange={handleTitleChange}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-admin-body">
                  {t('form.slug')} <span className="text-admin-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const s = generateSlug(formData.title);
                    if (s) setFormData((prev) => ({ ...prev, slug: s }));
                  }}
                  className="text-xs text-admin-action hover:text-admin-action-hover underline font-medium"
                >
                  ⚡ Auto Generate
                </button>
              </div>
              <Input
                value={formData.slug}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, slug: e.target.value });
                }}
                placeholder="meditation-hall-renovation"
                required
              />
              <p className="text-xs text-admin-muted mt-1">{t('form.slugHelp')}</p>
            </div>

            <MultiLangInput
              label={t('form.excerpt')}
              value={formData.excerpt}
              onChange={(v) => {
                setIsDirty(true);
                setFormData({ ...formData, excerpt: v });
              }}
              type="textarea"
            />
          </div>

          {/* Full Article Rich Text Editor */}
          <div className="p-6 bg-admin-surface border border-admin-border space-y-6">
            <div className="flex items-center justify-between border-b border-admin-border pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-admin-foreground">
                {t('form.content')}
              </h2>
              {/* Language Tabs for Rich Text */}
              <div className="flex items-center gap-1">
                {(['th', 'en', 'de'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLangTab(lang)}
                    className={`px-2.5 py-1 text-xs font-mono uppercase transition-colors border ${
                      activeLangTab === lang
                        ? 'bg-admin-action text-admin-on-action border-admin-action'
                        : 'bg-admin-surface text-admin-foreground border-admin-border hover:bg-admin-surface-muted'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <RichTextEditor
                value={formData.content[activeLangTab] || emptyRichTextDocument()}
                onChange={handleRichTextChange}
                placeholder={`Content (${activeLangTab.toUpperCase()})...`}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings (Right 1 Column) */}
        <div className="space-y-6">
          {/* Publication Status & Options */}
          <div className="p-6 bg-admin-surface border border-admin-border space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-3">
              {t('form.sectionPublish')}
            </h2>

            <Select
              label={t('form.publishStatus')}
              value={formData.publish_status}
              onChange={(e) => {
                setIsDirty(true);
                setFormData({ ...formData, publish_status: e.target.value as NewsPublishStatus });
              }}
              options={[
                { value: 'published', label: t('form.statusPublished') },
                { value: 'draft', label: t('form.statusDraft') },
                { value: 'scheduled', label: t('form.statusScheduled') },
                { value: 'archived', label: t('form.statusArchived') },
              ]}
            />

            {/* Published At Date Picker */}
            <Input
              label={t('form.publishedAt')}
              type="datetime-local"
              value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                setIsDirty(true);
                setFormData({
                  ...formData,
                  published_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                });
              }}
            />

            {/* Scheduled At Date Picker (Shown when status is scheduled or optional) */}
            {formData.publish_status === 'scheduled' && (
              <Input
                label={t('form.scheduledAt')}
                type="datetime-local"
                value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({
                    ...formData,
                    scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  });
                }}
              />
            )}

            <Select
              label={t('form.category')}
              value={formData.category_id ? String(formData.category_id) : ''}
              onChange={(e) => {
                setIsDirty(true);
                setFormData({
                  ...formData,
                  category_id: e.target.value ? parseInt(e.target.value, 10) : null,
                });
              }}
              options={[
                { value: '', label: `-- ${t('form.selectCategory')} --` },
                ...categories.map((c) => ({
                  value: String(c.id),
                  label: getLocalizedText(c.name),
                })),
              ]}
            />

            <Input
              label={t('form.authorName')}
              value={formData.author_name}
              onChange={(e) => {
                setIsDirty(true);
                setFormData({ ...formData, author_name: e.target.value });
              }}
            />

            <div className="pt-2 space-y-2 border-t border-admin-border">
              <Checkbox
                label={t('form.isFeatured')}
                checked={formData.is_featured}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, is_featured: e.target.checked });
                }}
              />
              <Checkbox
                label={t('form.isPinned')}
                checked={formData.is_pinned}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, is_pinned: e.target.checked });
                }}
              />
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="p-6 bg-admin-surface border border-admin-border space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-3">
              {t('form.coverImage')}
            </h2>

            <ImageUpload
              label={t('form.chooseCover')}
              value={formData.cover_image_url}
              onChange={(val) => {
                setIsDirty(true);
                setFormData({ ...formData, cover_image_url: typeof val === 'string' ? val : '' });
              }}
            />
          </div>
        </div>
      </div>
      </div>

      {/* Sticky Action Bar */}
      <FormActionBar
        isDirty={isDirty}
        isLoading={isSaving}
        isEditMode={isEditMode}
        onCancel={() => router.push(`/${locale}/admin/news`)}
      />
    </form>
  );
}
