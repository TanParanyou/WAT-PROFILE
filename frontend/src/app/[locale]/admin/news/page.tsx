'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, Tag, Star, Eye, ExternalLink } from 'lucide-react';
import { adminNewsService, adminNewsCategoryService } from '@/services/newsService';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/hooks/useConfirm';
import { useDataTable } from '@/hooks/useDataTable';
import { useToast } from '@/hooks/useToast';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { PermissionButton } from '@/components/admin/PermissionButton';
import { AdminSearchInput } from '@/components/admin/list/AdminSearchInput';
import { AdminTableAction, AdminTableActionGroup } from '@/components/admin/AdminTableAction';
import { NewsArticle, NewsCategory } from '@/types/news';

export default function AdminNewsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('admin.news');
  const { toast } = useToast();
  const getLocalizedText = useLocalizedText();
  const { confirm, ConfirmDialog } = useConfirm();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [categories, setCategories] = useState<NewsCategory[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    adminNewsCategoryService.getAll({ limit: 100 }).then((res) => {
      setCategories(res.data || []);
    });
  }, []);

  const { data, pagination, isLoading, onPageChange, fetchData } = useDataTable<NewsArticle>({
    queryKey: `admin-news-${statusFilter}-${categoryFilter}-${debouncedSearch}`,
    fetcher: (p) => {
      const params: Record<string, string | number> = {
        page: p.page,
        limit: p.limit,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        params.category_id = categoryFilter;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      return adminNewsService.getAll(params);
    },
  });

  const handleDelete = async (article: NewsArticle) => {
    await confirm({
      title: t('deleteConfirm'),
      message: `${t('deleteConfirmDesc')}\n"${getLocalizedText(article.title)}"`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await adminNewsService.delete(article.id);
          toast.success(t('deleteSuccess'));
          fetchData();
        } catch {
          toast.error(t('deleteError'));
        }
      },
    });
  };

  const handleToggleFeature = async (article: NewsArticle) => {
    try {
      await adminNewsService.update(article.id, {
        is_featured: !article.is_featured,
      } as Partial<NewsArticle>);
      toast.success(article.is_featured ? t('unfeaturedSuccess') : t('featuredSuccess'));
      fetchData();
    } catch {
      toast.error(t('statusUpdateError'));
    }
  };

  const columns: Column<NewsArticle>[] = [
    {
      header: t('table.title'),
      cell: (_, item) => (
        <div className="flex flex-col gap-1 max-w-md">
          <div className="flex items-center gap-2 font-medium text-admin-foreground">
            {item.is_featured && (
              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-1 border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Featured
              </span>
            )}
            <span>{getLocalizedText(item.title)}</span>
          </div>
          <span className="text-xs text-admin-muted font-mono">/{item.slug}</span>
        </div>
      ),
    },
    {
      header: t('table.category'),
      cell: (_, item) => (
        <span className="text-xs text-admin-foreground bg-admin-surface-muted px-2 py-1 border border-admin-border">
          {item.category ? getLocalizedText(item.category.name) : '-'}
        </span>
      ),
    },
    {
      header: t('table.status'),
      cell: (_, item) => <StatusBadge label={item.publish_status} />,
    },
    {
      header: t('table.views'),
      cell: (_, item) => (
        <span className="text-xs text-admin-muted font-mono flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {item.view_count || 0}
        </span>
      ),
    },
    {
      header: t('table.actions'),
      cell: (_, item) => (
        <AdminTableActionGroup>
          <AdminTableAction
            icon={<Star className={`w-4 h-4 ${item.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} />}
            label={t('table.toggleFeatured')}
            onClick={() => handleToggleFeature(item)}
          />
          <AdminTableAction
            icon={<ExternalLink className="w-4 h-4" />}
            label={t('viewLive')}
            href={`/news/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          />
          <AdminTableAction
            icon={<Edit className="w-4 h-4" />}
            label={t('table.edit')}
            resource="news"
            action="update"
            onClick={() => router.push(`/admin/news/${item.id}`)}
          />
          <AdminTableAction
            icon={<Trash2 className="w-4 h-4" />}
            label={t('table.delete')}
            variant="danger"
            resource="news"
            action="delete"
            onClick={() => handleDelete(item)}
          />
        </AdminTableActionGroup>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: t('title') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Tag size={16} />}
              onClick={() => router.push('/admin/news/categories')}
            >
              {t('categories')}
            </Button>
            <PermissionButton
              resource="news"
              action="create"
              icon={<Plus size={16} />}
              onClick={() => router.push('/admin/news/new')}
            >
              {t('create')}
            </PermissionButton>
          </div>
        }
      />

      {/* Advanced Filter Toolbar */}
      <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-end gap-3 p-4 bg-admin-surface border border-admin-border">
        {/* Search */}
        <AdminSearchInput
          value={search}
          isDebouncing={search !== debouncedSearch}
          onChange={setSearch}
          onSubmit={setDebouncedSearch}
          onClear={() => setSearch('')}
          placeholder="ค้นหาชื่อข่าวสาร หรือ slug..."
        />

        {/* Category Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-xs font-medium text-admin-body">
            {t('table.category')}
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm border border-admin-control-border bg-admin-surface text-admin-foreground focus-visible:outline-admin-focus"
          >
            <option value="all">ทั้งหมด (All Categories)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {getLocalizedText(cat.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-admin-body">
            {t('filterByStatus')}
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'published', 'draft', 'scheduled', 'archived'] as const).map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={statusFilter === status ? 'primary' : 'outline'}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={onPageChange}
      />

      <ConfirmDialog />
    </div>
  );
}
