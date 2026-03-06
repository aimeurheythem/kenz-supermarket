// ProductDetailCard.tsx — Product preview card for the left panel
import { Box, CircleAlert, ScanBarcode, CircleDollarSign } from 'lucide-react';
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
            <div className="p-4 border-b border-zinc-50 flex-1 flex flex-col items-center justify-center text-zinc-300">
                <Box size={28} strokeWidth={1} className="mb-3 text-zinc-200" />
                <div className="text-xs font-medium text-zinc-400">{t('pos.product_detail', 'Product Detail')}</div>
                <div className="text-[10px] mt-1 text-zinc-300">{t('pos.scan_to_preview', 'Scan or select a product')}</div>
            </div>
        );
    }

    const threshold = lowStockThreshold ?? product.reorder_level ?? 5;
    const isLowStock = product.stock_quantity <= threshold && product.stock_quantity > 0;
    const isOutOfStock = product.stock_quantity <= 0;

    return (
        <div className="p-4 border-b border-zinc-50 flex-1">
            <div className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest mb-3">
                {t('pos.product_detail', 'Product Detail')}
            </div>

            {/* Product name */}
            <h3 className="text-sm font-semibold text-zinc-700 leading-tight mb-1.5">{product.name}</h3>

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
                <CircleDollarSign size={14} strokeWidth={1.5} className="text-zinc-300" />
                <span className="text-lg font-bold text-zinc-800 tabular-nums">
                    {formatCurrency(product.selling_price)}
                </span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-zinc-400">
                {product.barcode && (
                    <div className="flex items-center gap-2.5">
                        <ScanBarcode size={13} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                        <span className="font-mono text-[11px] text-zinc-500">{product.barcode}</span>
                    </div>
                )}

                {/* Stock */}
                <div className="flex items-center gap-2.5">
                    {isOutOfStock ? (
                        <>
                            <CircleAlert size={13} strokeWidth={1.5} className="text-red-400 shrink-0" />
                            <span className="font-medium text-red-400">{t('pos.out_of_stock', 'Out of stock')}</span>
                        </>
                    ) : isLowStock ? (
                        <>
                            <CircleAlert size={13} strokeWidth={1.5} className="text-amber-400 shrink-0" />
                            <span className="font-medium text-amber-500">
                                {t('pos.low_stock', 'Low stock')}: {product.stock_quantity}
                            </span>
                        </>
                    ) : (
                        <>
                            <Box size={13} strokeWidth={1.5} className="text-emerald-400 shrink-0" />
                            <span className="font-medium text-emerald-500">
                                {t('pos.in_stock', 'In stock')}: {product.stock_quantity}
                            </span>
                        </>
                    )}
                </div>

                {/* Buy price for reference */}
                {product.buying_price != null && (
                    <div className="flex items-center justify-between text-[10px] text-zinc-300 pt-2 border-t border-zinc-50">
                        <span>{t('pos.cost', 'Cost')}</span>
                        <span className="tabular-nums">{formatCurrency(product.buying_price)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
