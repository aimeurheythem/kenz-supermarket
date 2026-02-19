import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
    /** Number of columns to render */
    columns?: number;
    /** Number of shimmer rows to render */
    rows?: number;
    /** Optional className for the wrapper */
    className?: string;
}

/**
 * Reusable table loading skeleton with shimmer rows.
 * Renders inside a <tbody> context — wrap in table/thead yourself or use within existing table.
 */
export function TableSkeletonRows({ columns = 5, rows = 5 }: TableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <td key={colIdx} className="px-6 py-4">
                            <Skeleton className="h-4 rounded-full" style={{ width: `${50 + Math.random() * 40}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/**
 * Variant using shadcn Table components for pages that use them.
 */
export function TableSkeletonCells({ columns = 5, rows = 5 }: TableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-zinc-100">
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <td key={colIdx} className="px-6 py-4">
                            <Skeleton
                                className="h-4 rounded-full"
                                style={{ width: colIdx === 0 ? '60%' : colIdx === columns - 1 ? '40%' : '70%' }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default TableSkeletonRows;
