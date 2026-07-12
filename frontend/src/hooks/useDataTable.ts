import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDataTable<T extends Record<string, any>>({
    data = [],
    initialLimit = 10,
    initialSort = { key: null, order: 'asc' },
    fetcher,
}: UseDataTableOptions<T>) {
    const [localData, setLocalData] = useState<T[]>(data);
    const [page, setPage] = useState(1);
    const [limit] = useState(initialLimit);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<SortState>(initialSort);
    const [isLoading, setIsLoading] = useState(!!fetcher);
    const [totalItems, setTotalItems] = useState(0);

    const fetcherRef = useRef(fetcher);
    useEffect(() => {
        fetcherRef.current = fetcher;
    }, [fetcher]);

    // Server-side fetch
    const fetchData = useCallback(async () => {
        const currentFetcher = fetcherRef.current;
        if (!currentFetcher) return;
        setIsLoading(true);
        try {
            const result = await currentFetcher({
                page,
                limit,
                search: searchQuery,
                sortKey: sort.key,
                sortOrder: sort.order,
            });
            setLocalData(result.data || []);
            setTotalItems(result.total);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, searchQuery, sort]);

    useEffect(() => {
        if (fetcher) fetchData();
    }, [fetchData, fetcher]);

    // Client-side filtering & sorting
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

    return {
        data: displayedData,
        pagination: { page, limit, totalPages, totalItems: finalTotalItems },
        sort,
        searchQuery,
        isLoading,
        onPageChange: handlePageChange,
        onSearch: handleSearch,
        onSort: handleSort,
        fetchData,
        setData: setLocalData,
    };
}
