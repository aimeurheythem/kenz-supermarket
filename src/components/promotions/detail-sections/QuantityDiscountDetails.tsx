import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { QuantityDiscountConfig, PromotionProduct } from '@/lib/types';

interface QuantityDiscountDetailsProps {
    config: QuantityDiscountConfig;
    products: PromotionProduct[];
}

export default function QuantityDiscountDetails({ config, products }: QuantityDiscountDetailsProps) {
    const { t } = useTranslation();
    const { formatCurrency: format } = useFormatCurrency();
    const product = products[0];
    const price = Number(product?.selling_price ?? 0);
    const totalRequired = config.buy_quantity + config.free_quantity;
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
                {hasPrice && (
                    <span className="text-sm font-bold text-zinc-500">{format(price)} {t('promotions.details.per_unit')}</span>
                )}
            </div>

            {/* Deal summary — big visual */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-1">{t('promotions.details.buy')}</p>
                        <p className="text-3xl font-black text-purple-700">{config.buy_quantity}</p>
                    </div>
                    <span className="text-2xl font-black text-purple-300">+</span>
                    <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-1">{t('promotions.details.get_free')}</p>
                        <p className="text-3xl font-black text-yellow-500">{config.free_quantity}</p>
                    </div>
                </div>
                <p className="text-[10px] font-bold text-purple-500 text-center mt-2 uppercase tracking-wider">
                    {t('promotions.details.every_units', { total: totalRequired, free: config.free_quantity })}
                </p>
            </div>

            {/* Value info */}
            {price > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t('promotions.details.pay_for')}</p>
                        <p className="text-sm font-black text-black">{format(price * config.buy_quantity)}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">{config.buy_quantity} {t('promotions.details.per_unit').replace('/ ', '')}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">{t('promotions.details.you_save')}</p>
                        <p className="text-sm font-black text-emerald-700">{format(price * config.free_quantity)}</p>
                        <p className="text-[9px] text-emerald-500 mt-0.5">{t('promotions.details.free_units', { count: config.free_quantity })}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
