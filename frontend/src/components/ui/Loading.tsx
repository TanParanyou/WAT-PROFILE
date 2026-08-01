'use client';

import React from 'react';

type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
    size?: LoadingSize;
    text?: string;
    className?: string;
}

const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
};

const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
};

// Spinner Loading
const Loading: React.FC<LoadingProps> = ({ size = 'md', text, className = '' }) => {
    return (
        <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
            <div
                className={`${sizeMap[size]} rounded-full border-admin-border border-t-admin-action animate-spin`}
            />
            {text && (
                <p className={`text-admin-muted ${textSizeMap[size]}`}>{text}</p>
            )}
        </div>
    );
};

// Page Loading
const PageLoading: React.FC<{ text?: string }> = ({ text = 'กำลังโหลด...' }) => (
    <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text={text} />
    </div>
);

// Skeleton
interface SkeletonProps {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`animate-pulse bg-admin-surface-muted rounded ${className}`} />
);

// Table Skeleton
const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4,
}) => (
    <div className="border border-admin-border rounded-none overflow-hidden">
        <div className="flex gap-4 p-4 border-b border-admin-border bg-admin-surface-muted">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 p-4 border-b border-admin-border">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton key={colIndex} className="h-4 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

export { Loading, PageLoading, Skeleton, TableSkeleton };
export type { LoadingProps, LoadingSize };
