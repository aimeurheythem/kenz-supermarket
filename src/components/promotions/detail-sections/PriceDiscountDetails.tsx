import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { PriceDiscountConfig, PromotionProduct } from '@/lib/types';

interface PriceDiscountDetailsProps {
    config: PriceDiscountConfig;
    products: PromotionProduct[];
}

export default function PriceDiscountDetails({ config, products }: PriceDiscountDetailsProps) {
    const { t } = useTranslation();
    const { formatCurrency: format } = useFormatCurrency();
    const product = products[0];
    const price = Number(product?.selling_price ?? 0);

    const discountAmount =
        config.discount_type === 'percentage'
            ? (price * (config.discount_value ?? 0)) / 100
            : (config.discount_value ?? 0);

    const cappedDiscount =
        config.discount_type === 'percentage' && config.max_discount
            ? Math.min(discountAmount, config.max_discount)
            : discountAmount;

    const finalPrice = Math.max(0, price - cappedDiscount);
    const hasPrice = price > 0;
    const hasProduct = !!product;

    return (
        <div className="space-y-4">
            {/* Product row — always show */}
            <div className="flex items-center justify-between bg-zinc-50 rounded-2xl px-4 py-3">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">{t('promotions.details.label_product')}</p>
                    <p className="text-sm font-black text-black">
                        {hasProduct
                            ? (product.product_name || `#${product.product_id}`)
                            : <span className="italic text-zinc-400">{t('promotions.details.no_product')}</span>}
                    </p>
                </div>
                <span className="text-sm font-bold text-zinc-500">
                    {hasPrice ? format(price) : '—'}
                </span>
            </div>

            {/* Before → After */}
            {hasPrice && (
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-zinc-100 rounded-2xl px-4 py-3 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t('promotions.details.original')}</p>
                        <p className="text-base font-black text-zinc-400 line-through">{format(price)}</p>
                    </div>
                    <span className="text-lg font-black text-zinc-300">→</span>
                    <div className="flex-1 bg-yellow-50 border-2 border-yellow-300 rounded-2xl px-4 py-3 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-yellow-600 mb-1">{t('promotions.details.after_discount')}</p>
                        <p className="text-base font-black text-yellow-700">{format(finalPrice)}</p>
                    </div>
                </div>
            )}

            {/* Discount details row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t('promotions.details.discount')}</p>
                    <p className="text-sm font-black text-black">
                        {config.discount_type === 'percentage'
                            ? `${config.discount_value}%`
                            : format(config.discount_value)}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">
                        {config.discount_type === 'percentage' ? t('promotions.details.percentage') : t('promotions.details.fixed_amount')}
                    </p>
                </div>

                {hasPrice && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">{t('promotions.details.you_save')}</p>
                        <p className="text-sm font-black text-emerald-700">{format(cappedDiscount)}</p>
                        {config.discount_type === 'percentage' && price > 0 && (
                            <p className="text-[9px] font-bold text-emerald-500 mt-0.5">
                                {Math.round((cappedDiscount / price) * 100)}% off
                            </p>
                        )}
                    </div>
                )}
            </div>

            {config.discount_type === 'percentage' && config.max_discount && (
                <div className="bg-zinc-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{t('promotions.details.label_max_discount')}</span>
                    <span className="text-sm font-black text-zinc-700">{format(config.max_discount)}</span>
                </div>
            )}
        </div>
    );
}
