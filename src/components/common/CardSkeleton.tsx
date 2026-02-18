import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
    /** Number of skeleton cards to render */
    count?: number;
    /** Additional className for the grid wrapper */
    className?: string;
}

/**
 * Reusable card loading skeleton.
 * Renders a grid of shimmer cards mimicking stat/info cards.
 */
export function CardSkeleton({ count = 3, className }: CardSkeletonProps) {
    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white border border-zinc-100 rounded-[2rem] p-6 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-32 rounded-full" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                </div>
            ))}
        </div>
    );
}

/**
 * Single card skeleton variant for inline use.
 */
export function SingleCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('bg-white border border-zinc-100 rounded-[2rem] p-6 space-y-4', className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
        </div>
    );
}

export default CardSkeleton;
