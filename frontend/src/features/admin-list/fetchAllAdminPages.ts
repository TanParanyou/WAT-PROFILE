import type {
  AdminFilterRecord,
  AdminListParams,
  AdminListResult,
} from "./types";

export async function fetchAllAdminPages<
  TItem,
  TFilters extends AdminFilterRecord,
>(
  params: AdminListParams<TFilters>,
  fetcher: (params: AdminListParams<TFilters>) => Promise<AdminListResult<TItem>>,
): Promise<AdminListResult<TItem>> {
  const firstPage = await fetcher(params);
  const remainingPageNumbers = Array.from(
    { length: Math.max(firstPage.pagination.totalPages - 1, 0) },
    (_, index) => index + 2,
  );
  const remainingPages = await Promise.all(
    remainingPageNumbers.map((page) => fetcher({ ...params, page })),
  );
  const data = [
    ...firstPage.data,
    ...remainingPages.flatMap((result) => result.data),
  ];

  return {
    data,
    pagination: {
      page: 1,
      limit: firstPage.pagination.limit,
      total: firstPage.pagination.total,
      totalPages: 1,
    },
  };
}
