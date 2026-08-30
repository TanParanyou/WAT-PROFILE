'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { adminAlertService } from '@/services/alertService';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useConfirm } from '@/hooks/useConfirm';
import { useDataTable } from '@/hooks/useDataTable';
import { useToast } from '@/hooks/useToast';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { PermissionButton } from '@/components/admin/PermissionButton';
import { AdminSearchInput } from '@/components/admin/list/AdminSearchInput';
import { AdminTableAction, AdminTableActionGroup } from '@/components/admin/AdminTableAction';
import { SiteAlert, SiteAlertSeverity } from '@/types/alert';

export default function AdminAlertsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('admin.siteAlerts');
  const { toast } = useToast();
  const getLocalizedText = useLocalizedText();
  const { confirm, ConfirmDialog } = useConfirm();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, pagination, isLoading, onPageChange, fetchData } = useDataTable<SiteAlert>({
    queryKey: `admin-site-alerts-${severityFilter}-${statusFilter}-${debouncedSearch}`,
    fetcher: (p) => {
      const params: Record<string, string | number> = {
        page: p.page,
        limit: p.limit,
      };
      if (severityFilter !== 'all') {
        params.severity = severityFilter;
      }
      if (statusFilter !== 'all') {
        params.is_active = statusFilter;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      return adminAlertService.getAll(params);
    },
  });

  const handleDelete = async (alert: SiteAlert) => {
    await confirm({
      title: t('deleteConfirm'),
      message: `${t('deleteConfirmDesc')}\n"${getLocalizedText(alert.title)}"`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await adminAlertService.delete(alert.id);
          toast.success(t('deleteSuccess'));
          fetchData();
        } catch {
          toast.error(t('deleteError'));
        }
      },
    });
  };

  const handleToggleActive = async (alert: SiteAlert) => {
    try {
      await adminAlertService.update(alert.id, {
        is_active: !alert.is_active,
      } as Partial<SiteAlert>);
      toast.success(alert.is_active ? t('statusDeactivated') : t('statusActivated'));
      fetchData();
    } catch {
      toast.error(t('saveError'));
    }
  };

  const getSeverityBadge = (severity: SiteAlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Info className="w-3.5 h-3.5" />
            Info
          </span>
        );
    }
  };

  const columns: Column<SiteAlert>[] = [
    {
      header: t('table.title'),
      cell: (_, item) => (
        <div className="flex flex-col gap-1 max-w-md">
          <div className="flex items-center gap-2">
            {getSeverityBadge(item.severity)}
            <span className="font-medium text-admin-foreground">{getLocalizedText(item.title)}</span>
          </div>
          <span className="text-xs text-admin-muted line-clamp-1">{getLocalizedText(item.message)}</span>
        </div>
      ),
    },
    {
      header: t('table.format'),
      cell: (_, item) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-mono text-admin-foreground">{item.display_type}</span>
          <span className="text-admin-muted">{item.scope === 'home_only' ? t('table.homeOnly') : t('table.allPages')}</span>
        </div>
      ),
    },
    {
      header: t('table.status'),
      cell: (_, item) => (
        <Switch
          checked={item.is_active}
          onChange={() => handleToggleActive(item)}
        />
      ),
    },
    {
      header: t('table.actions'),
      cell: (_, item) => (
        <AdminTableActionGroup>
          <AdminTableAction
            icon={<Edit className="w-4 h-4" />}
            label={t('edit')}
            resource="site_alerts"
            action="update"
            onClick={() => router.push(`/admin/alerts/${item.id}`)}
          />
          <AdminTableAction
            icon={<Trash2 className="w-4 h-4" />}
            label={t('deleteConfirm')}
            variant="danger"
            resource="site_alerts"
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
          <PermissionButton
            resource="site_alerts"
            action="create"
            icon={<Plus size={16} />}
            onClick={() => router.push('/admin/alerts/new')}
          >
            {t('create')}
          </PermissionButton>
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
          placeholder="ค้นหาข้อความประกาศ..."
        />

        {/* Severity Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-xs font-medium text-admin-body">
            {t('form.severity')}
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm border border-admin-control-border bg-admin-surface text-admin-foreground focus-visible:outline-admin-focus"
          >
            <option value="all">ระดับทั้งหมด (All Severities)</option>
            <option value="critical">เหตุการณ์วิกฤต (Critical)</option>
            <option value="warning">แจ้งเตือนสำคัญ (Warning)</option>
            <option value="info">ข้อมูลทั่วไป (Info)</option>
          </select>
        </div>

        {/* Active Status Filter */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-admin-body">
            {t('table.status')}
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: 'ทั้งหมด (All)' },
              { key: 'true', label: t('activeOn') },
              { key: 'false', label: t('activeOff') },
            ].map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={statusFilter === key ? 'primary' : 'outline'}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

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
