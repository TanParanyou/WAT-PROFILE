export const ADMIN_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AdminPageSize = (typeof ADMIN_PAGE_SIZES)[number];
export type AdminSortOrder = "asc" | "desc";
export type AdminFilterValue = string | string[] | undefined;
export type AdminFilterRecord = Record<string, AdminFilterValue>;

export interface AdminListParams<TFilters extends AdminFilterRecord = AdminFilterRecord> {
  page: number;
  limit: AdminPageSize;
  search: string;
  sort?: string;
  order: AdminSortOrder;
  filters: TFilters;
}

export interface AdminPagination {
  page: number;
  limit: AdminPageSize;
  total: number;
  totalPages: number;
}

export interface AdminListResult<T> {
  data: T[];
  pagination: AdminPagination;
}

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterDefinition<TFilters extends AdminFilterRecord> {
  key: keyof TFilters & string;
  kind: "multi" | "date-range";
  label: string;
  options?: AdminFilterOption[];
}
