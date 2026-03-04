import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { useProductStore } from '@/stores/useProductStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
    Promotion,
    PriceDiscountConfig,
    QuantityDiscountConfig,
    PackDiscountConfig,
    PromotionProduct,
} from '@/lib/types';
import PriceDiscountDetails from './detail-sections/PriceDiscountDetails';
import QuantityDiscountDetails from './detail-sections/QuantityDiscountDetails';
import PackDiscountDetails from './detail-sections/PackDiscountDetails';
import { cn } from '@/lib/utils';

interface PromotionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    promotion: Promotion;
}

const TYPE_COLORS: Record<string, string> = {
    price_discount: 'bg-blue-100 text-blue-700',
    quantity_discount: 'bg-purple-100 text-purple-700',
    pack_discount: 'bg-amber-100 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-zinc-100 text-zinc-500',
    expired: 'bg-rose-100 text-rose-700',
    scheduled: 'bg-sky-100 text-sky-700',
};

export default function PromotionDetailsModal({ isOpen, onClose, promotion }: PromotionDetailsModalProps) {
    const { t } = useTranslation();
    const { products: storeProducts, loadProducts } = useProductStore();

    // Ensure the product store is loaded
    useEffect(() => {
        if (storeProducts.length === 0) loadProducts();
    }, []);

    let parsedConfig: Record<string, unknown> = {};
    try {
        parsedConfig =
            typeof promotion.config === 'string'
                ? JSON.parse(promotion.config)
                : (promotion.config as Record<string, unknown>);
    } catch {
        /* ignore */
    }

    // Build enriched products: use DB data first, fall back to store, fall back to ID label
    const products: PromotionProduct[] = useMemo(() => {
        const linkedProducts = promotion.products ?? [];
        return linkedProducts.map((pp) => {
            // Try DB-joined data first
            const name = pp.product_name || null;
            const price = pp.selling_price != null ? Number(pp.selling_price) : null;
            if (name && price !== null) return { ...pp, product_name: name, selling_price: price };
            // Fall back to product store
            const sp = storeProducts.find((s) => s.id === pp.product_id);
            return {
                ...pp,
                product_name: name ?? sp?.name ?? `Product #${pp.product_id}`,
                selling_price: price ?? sp?.selling_price ?? 0,
            };
        });
    }, [promotion.products, storeProducts]);

    const effectiveStatus = promotion.effective_status ?? promotion.status;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <DialogTitle>{promotion.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                            className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded-full',
                                TYPE_COLORS[promotion.type] ?? 'bg-zinc-100 text-zinc-600',
                            )}
                        >
                            {t(`promotions.type.${promotion.type}`, promotion.type.replace('_', ' '))}
                        </span>
                        <span
                            className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded-full',
                                STATUS_COLORS[effectiveStatus] ?? 'bg-zinc-100 text-zinc-600',
                            )}
                        >
                            {t(`promotions.status.${effectiveStatus}`, effectiveStatus)}
                        </span>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Date Range */}
                    <div className="flex items-center gap-3 bg-[var(--color-bg-input)] rounded-lg px-3 py-2.5 border border-[var(--color-border)]">
                        <Calendar size={14} className="text-[var(--color-text-muted)] shrink-0" strokeWidth={2.5} />
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] flex-wrap">
                            <span>{promotion.start_date}</span>
                            <span className="text-[var(--color-text-muted)]">→</span>
                            <span>{promotion.end_date}</span>
                        </div>
                    </div>

                    {/* Type-specific detail section */}
                    <div className="border border-[var(--color-border)] rounded-lg p-4">
                        {promotion.type === 'price_discount' && (
                            <PriceDiscountDetails
                                config={parsedConfig as unknown as PriceDiscountConfig}
                                products={products}
                            />
                        )}
                        {promotion.type === 'quantity_discount' && (
                            <QuantityDiscountDetails
                                config={parsedConfig as unknown as QuantityDiscountConfig}
                                products={products}
                            />
                        )}
                        {promotion.type === 'pack_discount' && (
                            <PackDiscountDetails
                                config={parsedConfig as unknown as PackDiscountConfig}
                                products={products}
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
