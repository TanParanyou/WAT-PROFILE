import { usePathname, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AdminFilterRecord,
  type AdminListParams,
  type AdminPageSize,
  type AdminSortOrder,
} from "./types";
import {
  parseAdminListParams,
  serializeAdminListParams,
  type AdminListUrlSchema,
} from "./url";

export interface UseAdminListStateOptions<TFilters extends AdminFilterRecord> {
  schema: AdminListUrlSchema<TFilters>;
  debounceMs?: number;
}

export interface AdminListActions<TFilters extends AdminFilterRecord> {
  setSearch(value: string, immediate?: boolean): void;
  setFilter<K extends keyof TFilters>(key: K, value: TFilters[K]): void;
  removeFilterValue<K extends keyof TFilters>(key: K, value: string): void;
  clearFilters(): void;
  setSort(key: string): void;
  setPage(page: number): void;
  setLimit(limit: AdminPageSize): void;
}

export function useAdminListState<TFilters extends AdminFilterRecord>(
  options: UseAdminListStateOptions<TFilters>,
): {
  params: AdminListParams<TFilters>;
  draftSearch: string;
  isDebouncing: boolean;
  scopeKey: string;
  actions: AdminListActions<TFilters>;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceMs = options.debounceMs ?? 350;

  const params = useMemo(() => {
    return parseAdminListParams(searchParams, options.schema);
  }, [searchParams, options.schema]);

  const [draftSearch, setDraftSearch] = useState(params.search);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [prevParamsSearch, setPrevParamsSearch] = useState(params.search);
  if (prevParamsSearch !== params.search) {
    setPrevParamsSearch(params.search);
    setDraftSearch(params.search);
  }

  const updateUrl = useCallback(
    (newParams: AdminListParams<TFilters>) => {
      const query = serializeAdminListParams(newParams);
      const queryString = query.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl);
    },
    [pathname, router],
  );

  const setSearch = useCallback(
    (value: string, immediate = false) => {
      setDraftSearch(value);

      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }

      if (immediate) {
        setIsDebouncing(false);
        const trimmed = value.trim();
        if (trimmed !== params.search) {
          updateUrl({
            ...params,
            search: trimmed,
            page: 1,
          });
        }
        return;
      }

      setIsDebouncing(true);
      searchTimerRef.current = setTimeout(() => {
        setIsDebouncing(false);
        const trimmed = value.trim();
        if (trimmed !== params.search) {
          updateUrl({
            ...params,
            search: trimmed,
            page: 1,
          });
        }
      }, debounceMs);
    },
    [debounceMs, params, updateUrl],
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const setFilter = useCallback(
    <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
      const nextFilters = { ...params.filters };
      if (
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "string" && value === "")
      ) {
        delete nextFilters[key];
      } else {
        nextFilters[key] = value;
      }
      updateUrl({
        ...params,
        filters: nextFilters,
        page: 1,
      });
    },
    [params, updateUrl],
  );

  const removeFilterValue = useCallback(
    <K extends keyof TFilters>(key: K, valueToRemove: string) => {
      const currentValue = params.filters[key];
      const nextFilters = { ...params.filters };

      if (Array.isArray(currentValue)) {
        const updated = currentValue.filter((v) => v !== valueToRemove);
        if (updated.length > 0) {
          nextFilters[key] = updated as TFilters[K];
        } else {
          delete nextFilters[key];
        }
      } else if (typeof currentValue === "string" && currentValue === valueToRemove) {
        delete nextFilters[key];
      }

      updateUrl({
        ...params,
        filters: nextFilters,
        page: 1,
      });
    },
    [params, updateUrl],
  );

  const clearFilters = useCallback(() => {
    updateUrl({
      ...params,
      filters: {} as TFilters,
      search: "",
      page: 1,
    });
    setDraftSearch("");
  }, [params, updateUrl]);

  const setSort = useCallback(
    (key: string) => {
      let newOrder: AdminSortOrder = "asc";
      if (params.sort === key) {
        newOrder = params.order === "asc" ? "desc" : "asc";
      } else {
        newOrder = options.schema.defaultOrder ?? "desc";
      }
      updateUrl({
        ...params,
        sort: key,
        order: newOrder,
        page: 1,
      });
    },
    [options.schema.defaultOrder, params, updateUrl],
  );

  const setPage = useCallback(
    (page: number) => {
      if (page !== params.page) {
        updateUrl({
          ...params,
          page,
        });
      }
    },
    [params, updateUrl],
  );

  const setLimit = useCallback(
    (limit: AdminPageSize) => {
      if (limit !== params.limit) {
        updateUrl({
          ...params,
          limit,
          page: 1,
        });
      }
    },
    [params, updateUrl],
  );

  const scopeKey = useMemo(() => {
    return serializeAdminListParams(params).toString();
  }, [params]);

  return {
    params,
    draftSearch,
    isDebouncing,
    scopeKey,
    actions: {
      setSearch,
      setFilter,
      removeFilterValue,
      clearFilters,
      setSort,
      setPage,
      setLimit,
    },
  };
}
