// ProductDetailCard.tsx — Product preview card for the left panel
import { Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/lib/types';

interface ProductDetailCardProps {
    product: Product | null;
    formatCurrency: (amount: number) => string;
    lowStockThreshold?: number;
}

export default function ProductDetailCard({ product, formatCurrency, lowStockThreshold }: ProductDetailCardProps) {
    const { t } = useTranslation();

    if (!product) {
        return (
            <div className="px-4 py-3 flex items-center justify-center gap-2 text-zinc-300">
                <Box size={14} strokeWidth={1.5} />
                <span className="text-xs font-medium">{t('pos.scan_to_preview', 'Scan or select a product')}</span>
            </div>
        );
    }

    const threshold = lowStockThreshold ?? product.reorder_level ?? 5;
    const isLowStock = product.stock_quantity <= threshold && product.stock_quantity > 0;
    const isOutOfStock = product.stock_quantity <= 0;

    return (
        <div className="px-4 py-3 bg-zinc-900 text-white">
            {/* Top: name + price */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold leading-tight text-zinc-100 line-clamp-1 min-w-0">{product.name}</h3>
                <span className="text-base font-extrabold tabular-nums text-emerald-400 shrink-0 leading-none">
                    {formatCurrency(product.selling_price)}
                </span>
            </div>

            {/* Bottom row: barcode + stock + cost */}
            <div className="flex items-center gap-3 text-[11px]">
                {product.barcode && (
                    <span className="font-mono text-zinc-500 truncate max-w-[100px]">{product.barcode}</span>
                )}

                <span className={`font-semibold ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-emerald-500'}`}>
                    {isOutOfStock
                        ? t('pos.out_of_stock', 'Out of stock')
                        : `${product.stock_quantity} ${t('pos.in_stock', 'in stock')}`}
                </span>

                {product.buying_price != null && (
                    <span className="text-zinc-600 tabular-nums ml-auto">
                        {t('pos.cost', 'Cost')}: {formatCurrency(product.buying_price)}
                    </span>
                )}
            </div>
        </div>
    );
}
