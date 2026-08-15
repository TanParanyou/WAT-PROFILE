import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type {
  AdminFilterRecord,
  AdminListParams,
  AdminListResult,
} from "./types";

export interface UseAdminListQueryOptions<
  TItem,
  TFilters extends AdminFilterRecord,
> {
  queryKey: readonly unknown[];
  params: AdminListParams<TFilters>;
  fetcher(params: AdminListParams<TFilters>): Promise<AdminListResult<TItem>>;
  setPage(page: number): void;
}

export function useAdminListQuery<TItem, TFilters extends AdminFilterRecord>(
  options: UseAdminListQueryOptions<TItem, TFilters>,
) {
  const query = useQuery({
    queryKey: [...options.queryKey, options.params],
    queryFn: () => options.fetcher(options.params),
    placeholderData: keepPreviousData,
  });

  const pagination = query.data?.pagination;
  const totalPages = pagination?.totalPages;
  const currentPage = options.params.page;
  const setPage = options.setPage;

  useEffect(() => {
    if (
      totalPages !== undefined &&
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setPage(totalPages);
    }
  }, [currentPage, totalPages, setPage]);

  const rows = useMemo(() => query.data?.data ?? [], [query.data?.data]);

  const effectivePagination = useMemo(
    () =>
      pagination ?? {
        page: options.params.page,
        limit: options.params.limit,
        total: 0,
        totalPages: 0,
      },
    [pagination, options.params.page, options.params.limit]
  );

  return {
    ...query,
    rows,
    pagination: effectivePagination,
  };
}
