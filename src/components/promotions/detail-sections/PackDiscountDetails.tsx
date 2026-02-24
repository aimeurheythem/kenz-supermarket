import { useTranslation } from 'react-i18next';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { PackDiscountConfig, PromotionProduct } from '@/lib/types';

interface PackDiscountDetailsProps {
    config: PackDiscountConfig;
    products: PromotionProduct[];
}

export default function PackDiscountDetails({ config, products }: PackDiscountDetailsProps) {
    const { t } = useTranslation();
    const { formatCurrency: format } = useFormatCurrency();
    const originalTotal = products.reduce((sum, p) => sum + (p.selling_price ?? 0), 0);
    const savings = Math.max(0, originalTotal - config.bundle_price);
    const savingsPct = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {t('promotions.details.pack_config')}
            </h4>

            {products.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{t('promotions.details.label_products')}</p>
                    <div className="space-y-1.5">
                        {products.map((p) => (
                            <div
                                key={p.product_id}
                                className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2"
                            >
                                <span className="text-sm font-black text-black">{p.product_name ?? `#${p.product_id}`}</span>
                                <span className="text-sm font-bold text-zinc-500">
                                    {p.selling_price != null ? format(p.selling_price) : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">
                {originalTotal > 0 && (
                    <div className="bg-zinc-50 rounded-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                            {t('promotions.details.original')}
                        </p>
                        <p className="text-sm font-black text-zinc-500 line-through">{format(originalTotal)}</p>
                    </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-600 mb-1">
                        {t('promotions.details.label_bundle_price')}
                    </p>
                    <p className="text-sm font-black text-yellow-700">{format(config.bundle_price)}</p>
                </div>

                {originalTotal > 0 && savings > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-green-600 mb-1">
                            {t('promotions.details.you_save')}
                        </p>
                        <p className="text-sm font-black text-green-700">{format(savings)}</p>
                        <p className="text-[9px] font-bold text-green-500 mt-0.5">{savingsPct}% off</p>
                    </div>
                )}
            </div>
        </div>
    );
}
