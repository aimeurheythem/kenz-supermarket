import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { useProductStore } from '@/stores/useProductStore';
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
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl focus:outline-none overflow-hidden max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between p-8 pb-6 shrink-0">
                        <div className="flex-1 min-w-0 pr-4">
                            <Dialog.Title className="text-xl font-black uppercase tracking-tight leading-tight truncate">
                                {promotion.name}
                            </Dialog.Title>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                    className={cn(
                                        'text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full',
                                        TYPE_COLORS[promotion.type] ?? 'bg-zinc-100 text-zinc-600',
                                    )}
                                >
                                    {t(`promotions.type.${promotion.type}`, promotion.type.replace('_', ' '))}
                                </span>
                                <span
                                    className={cn(
                                        'text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full',
                                        STATUS_COLORS[effectiveStatus] ?? 'bg-zinc-100 text-zinc-600',
                                    )}
                                >
                                    {t(`promotions.status.${effectiveStatus}`, effectiveStatus)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors shrink-0"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto scrollbar-hide px-8 pb-8 space-y-6">
                        {/* Date Range */}
                        <div className="flex items-center gap-3 bg-zinc-50 rounded-2xl px-4 py-3">
                            <Calendar size={14} className="text-zinc-400 shrink-0" strokeWidth={2.5} />
                            <div className="flex items-center gap-2 text-sm font-bold text-zinc-600 flex-wrap">
                                <span>{promotion.start_date}</span>
                                <span className="text-zinc-300">→</span>
                                <span>{promotion.end_date}</span>
                            </div>
                        </div>

                        {/* Type-specific detail section */}
                        <div className="border border-zinc-100 rounded-2xl p-4">
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
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
