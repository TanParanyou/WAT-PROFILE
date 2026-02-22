'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { Loading } from './Loading';
import { cn } from '@/utils/cn';
import type { SortState, PaginationState } from '@/hooks/useDataTable';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell?: (value: any, row: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    pagination?: PaginationState;
    sorting?: SortState;
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
    onSort?: (key: string) => void;
    className?: string;
    hidePagination?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    pagination,
    sorting,
    isLoading = false,
    onPageChange,
    onSort,
    className,
    hidePagination = false,
}: DataTableProps<T>) {
    const safeData = data || [];
    const page = pagination?.page || 1;
    const totalPages = pagination?.totalPages || 1;
    const limit = pagination?.limit || 10;
    const totalItems = pagination?.totalItems ?? safeData.length;
    const sortingState = sorting || { key: null, order: 'asc' as const };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (page <= 3) {
            for (let i = 1; i <= 3; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (page >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            pages.push(page);
            pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className={cn('w-full space-y-4', className)}>
            <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        {/* Header */}
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                {columns.map((col, idx) => {
                                    const isSortable = col.sortable && col.accessorKey && onSort;
                                    const isSorted = sortingState.key === col.accessorKey;

                                    return (
                                        <th
                                            key={idx}
                                            className={cn(
                                                'px-6 py-3 font-medium whitespace-nowrap',
                                                isSortable && 'cursor-pointer hover:text-gray-700',
                                                col.className
                                            )}
                                            onClick={() => isSortable && onSort?.(col.accessorKey as string)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.header}
                                                {isSortable && (
                                                    <ArrowUpDown
                                                        className={cn(
                                                            'h-3 w-3',
                                                            isSorted ? 'text-amber-600' : 'opacity-30'
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="h-48">
                                        <div className="flex items-center justify-center h-full">
                                            <Loading size="lg" text="กำลังโหลดข้อมูล..." />
                                        </div>
                                    </td>
                                </tr>
                            ) : safeData.length > 0 ? (
                                safeData.map((row, rowIdx) => (
                                    <tr
                                        key={(row as { id?: string | number }).id ?? rowIdx}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {columns.map((col, colIdx) => (
                                            <td
                                                key={colIdx}
                                                className={cn('px-6 py-4 whitespace-nowrap text-gray-700', col.className)}
                                            >
                                                {col.cell
                                                    ? col.cell(
                                                          col.accessorKey ? row[col.accessorKey] : undefined,
                                                          row
                                                      )
                                                    : col.accessorKey
                                                      ? String(row[col.accessorKey] ?? '')
                                                      : null}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-32 text-center text-gray-400">
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!hidePagination && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3 gap-3">
                        <div className="text-xs text-gray-500">
                            {totalItems > 0 ? (
                                <>
                                    แสดง{' '}
                                    <span className="font-medium text-gray-700">{(page - 1) * limit + 1}</span> ถึง{' '}
                                    <span className="font-medium text-gray-700">
                                        {Math.min(page * limit, totalItems)}
                                    </span>{' '}
                                    จาก <span className="font-medium text-gray-700">{totalItems}</span> รายการ
                                </>
                            ) : (
                                'ไม่มีรายการ'
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onPageChange?.(1)}
                                disabled={page === 1 || isLoading}
                                className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onPageChange?.(page - 1)}
                                disabled={page === 1 || isLoading}
                                className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {getPageNumbers().map((p, i) =>
                                p === '...' ? (
                                    <span key={i} className="px-2 text-gray-400">...</span>
                                ) : (
                                    <button
                                        key={i}
                                        onClick={() => onPageChange?.(p as number)}
                                        className={cn(
                                            'h-8 w-8 rounded text-sm',
                                            page === p
                                                ? 'bg-amber-600 text-white font-medium'
                                                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                        )}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() => onPageChange?.(page + 1)}
                                disabled={page === totalPages || isLoading}
                                className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onPageChange?.(totalPages)}
                                disabled={page === totalPages || isLoading}
                                className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
