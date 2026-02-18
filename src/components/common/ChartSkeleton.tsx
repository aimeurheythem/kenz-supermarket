import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
    /** Height of the chart area */
    height?: number;
    /** Additional className */
    className?: string;
}

/**
 * Reusable chart loading skeleton.
 * Mimics an area/bar chart with shimmer bars and axis lines.
 */
export function ChartSkeleton({ height = 300, className }: ChartSkeletonProps) {
    const barCount = 8;

    return (
        <div className={cn('w-full rounded-2xl p-6 space-y-4', className)}>
            {/* Header shimmer */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40 rounded-full" />
                    <Skeleton className="h-3 w-28 rounded-full" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            {/* Chart area */}
            <div
                className="relative flex items-end gap-3 pt-4"
                style={{ height }}
            >
                {/* Y-axis ticks */}
                <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-2 w-6 rounded-full" />
                    ))}
                </div>

                {/* Bars */}
                <div className="flex-1 flex items-end gap-2 pl-10 pb-8">
                    {Array.from({ length: barCount }).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <Skeleton
                                className="w-full rounded-t-md"
                                style={{
                                    height: `${30 + Math.sin(i * 0.8) * 25 + Math.random() * 20}%`,
                                    minHeight: 20,
                                }}
                            />
                            {/* X-axis label */}
                            <Skeleton className="h-2 w-8 rounded-full" />
                        </div>
                    ))}
                </div>

                {/* X-axis line */}
                <div className="absolute bottom-6 left-10 right-0 h-px bg-zinc-200" />
            </div>
        </div>
    );
}

export default ChartSkeleton;
