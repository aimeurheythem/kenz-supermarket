import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
    /** Total number of items (after filtering) */
    totalItems: number;
    /** Items per page (default: 20) */
    pageSize?: number;
    /** Initial page (default: 1) */
    initialPage?: number;
}

interface UsePaginationReturn {
    /** Current page (1-based) */
    currentPage: number;
    /** Set the current page */
    setCurrentPage: (page: number) => void;
    /** Total number of pages */
    totalPages: number;
    /** Start index for slicing (0-based, inclusive) */
    startIndex: number;
    /** End index for slicing (0-based, exclusive) — use with Array.slice(startIndex, endIndex) */
    endIndex: number;
    /** Items per page */
    pageSize: number;
    /** Reset to page 1 */
    resetPage: () => void;
    /** Paginate an array — returns the slice for the current page */
    paginate: <T>(items: T[]) => T[];
}

export function usePagination({
    totalItems,
    pageSize = 20,
    initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
    const [currentPage, setCurrentPageRaw] = useState(initialPage);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Clamp current page to valid range
    const clampedPage = Math.min(currentPage, totalPages);

    const setCurrentPage = useCallback(
        (page: number) => {
            setCurrentPageRaw(Math.max(1, Math.min(page, totalPages)));
        },
        [totalPages],
    );

    const resetPage = useCallback(() => {
        setCurrentPageRaw(1);
    }, []);

    const startIndex = (clampedPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const paginate = useCallback(
        <T>(items: T[]): T[] => {
            return items.slice(startIndex, endIndex);
        },
        [startIndex, endIndex],
    );

    return useMemo(
        () => ({
            currentPage: clampedPage,
            setCurrentPage,
            totalPages,
            startIndex,
            endIndex,
            pageSize,
            resetPage,
            paginate,
        }),
        [clampedPage, setCurrentPage, totalPages, startIndex, endIndex, pageSize, resetPage, paginate],
    );
}
