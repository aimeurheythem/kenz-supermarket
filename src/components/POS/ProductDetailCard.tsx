// ProductDetailCard.tsx — Product preview card for the left panel
import { Package, AlertTriangle, Barcode, Tag } from 'lucide-react';
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
            <div className="p-3 border-b border-zinc-100 flex-1 flex flex-col items-center justify-center text-zinc-400">
                <Package size={24} className="mb-2 opacity-50" />
                <div className="text-xs font-medium">{t('pos.product_detail', 'Product Detail')}</div>
                <div className="text-[10px] mt-0.5">{t('pos.scan_to_preview', 'Scan or select a product')}</div>
            </div>
        );
    }

    const threshold = lowStockThreshold ?? product.reorder_level ?? 5;
    const isLowStock = product.stock_quantity <= threshold && product.stock_quantity > 0;
    const isOutOfStock = product.stock_quantity <= 0;

    return (
        <div className="p-3 border-b border-zinc-100 flex-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                {t('pos.product_detail', 'Product Detail')}
            </div>

            {/* Product image or placeholder */}
            <div className="w-full aspect-square rounded-xl bg-zinc-100 flex items-center justify-center mb-3 overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package size={40} className="text-zinc-300" />
                )}
            </div>

            {/* Product name */}
            <h3 className="text-sm font-bold text-zinc-800 leading-tight mb-1">{product.name}</h3>

            {/* Price */}
            <div className="flex items-center gap-1.5 mb-2">
                <Tag size={12} className="text-zinc-400" />
                <span className="text-lg font-black text-zinc-900 tabular-nums">
                    {formatCurrency(product.selling_price)}
                </span>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-zinc-500">
                {product.barcode && (
                    <div className="flex items-center gap-2">
                        <Barcode size={12} className="text-zinc-400 shrink-0" />
                        <span className="font-mono text-[11px]">{product.barcode}</span>
                    </div>
                )}

                {/* Stock */}
                <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                        <>
                            <AlertTriangle size={12} className="text-red-500 shrink-0" />
                            <span className="font-bold text-red-500">{t('pos.out_of_stock', 'Out of stock')}</span>
                        </>
                    ) : isLowStock ? (
                        <>
                            <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                            <span className="font-bold text-amber-500">
                                {t('pos.low_stock', 'Low stock')}: {product.stock_quantity}
                            </span>
                        </>
                    ) : (
                        <>
                            <Package size={12} className="text-emerald-500 shrink-0" />
                            <span className="font-medium text-emerald-600">
                                {t('pos.in_stock', 'In stock')}: {product.stock_quantity}
                            </span>
                        </>
                    )}
                </div>

                {/* Buy price for reference */}
                {product.buying_price != null && (
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                        <span>{t('pos.cost', 'Cost')}</span>
                        <span className="tabular-nums">{formatCurrency(product.buying_price)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
