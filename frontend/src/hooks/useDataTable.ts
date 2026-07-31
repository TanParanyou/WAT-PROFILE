import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * @deprecated Use useAdminListState and useAdminListQuery from '@/features/admin-list' instead.
 */
export type SortOrder = 'asc' | 'desc';

export interface SortState {
    key: string | null;
    order: SortOrder;
}

export interface PaginationState {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
}

export interface FetcherParams {
    page: number;
    limit: number;
    search: string;
    sortKey: string | null;
    sortOrder: SortOrder;
}

export interface UseDataTableOptions<T> {
    data?: T[];
    initialLimit?: number;
    initialSort?: SortState;
    fetcher?: (params: FetcherParams) => Promise<{ data: T[]; total: number }>;
    queryKey: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDataTable<T extends Record<string, any>>({
    data = [],
    initialLimit = 10,
    initialSort = { key: null, order: 'asc' },
    fetcher,
    queryKey,
}: UseDataTableOptions<T>) {
    const [page, setPage] = useState(1);
    const [limit] = useState(initialLimit);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<SortState>(initialSort);

    // Using TanStack Query for server-side fetching under the hood
    const { 
        data: serverDataPayload, 
        isLoading, 
        refetch 
    } = useQuery({
        queryKey: [queryKey, page, limit, searchQuery, sort],
        queryFn: async () => {
            if (!fetcher) return { data: [], total: 0 };
            return fetcher({
                page,
                limit,
                search: searchQuery,
                sortKey: sort.key,
                sortOrder: sort.order,
            });
        },
        enabled: !!fetcher,
    });

    const localData = serverDataPayload?.data || [];
    const totalItems = serverDataPayload?.total || 0;

    // Client-side filtering & sorting (fallback if no fetcher is provided)
    const processedData = useMemo(() => {
        if (fetcher) return localData;

        let result = [...data];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((item) =>
                Object.values(item).some((value) => String(value).toLowerCase().includes(q))
            );
        }

        if (sort.key) {
            result.sort((a, b) => {
                const valA = a[sort.key!];
                const valB = b[sort.key!];
                if (valA < valB) return sort.order === 'asc' ? -1 : 1;
                if (valA > valB) return sort.order === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, localData, searchQuery, sort, fetcher]);

    // Client-side pagination
    const displayedData = useMemo(() => {
        if (fetcher) return localData;
        const start = (page - 1) * limit;
        return processedData.slice(start, start + limit);
    }, [processedData, page, limit, fetcher, localData]);

    const finalTotalItems = fetcher ? totalItems : processedData.length;
    const totalPages = Math.ceil(finalTotalItems / limit) || 1;

    const handlePageChange = useCallback(
        (newPage: number) => {
            if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
        },
        [totalPages]
    );

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    const handleSort = useCallback((key: string) => {
        setSort((prev) => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    // Placeholder function for compatibility
    const setDummyData = () => {};

    return {
        data: displayedData,
        pagination: { page, limit, totalPages, totalItems: finalTotalItems },
        sort,
        searchQuery,
        isLoading,
        onPageChange: handlePageChange,
        onSearch: handleSearch,
        onSort: handleSort,
        fetchData: refetch,
        setData: setDummyData,
    };
}
