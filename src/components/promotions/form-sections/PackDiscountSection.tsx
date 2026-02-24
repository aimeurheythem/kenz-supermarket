import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/stores/useProductStore';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { PackDiscountConfig } from '@/lib/types';
import ProductSearchSelect from './ProductSearchSelect';

interface PackDiscountValues {
    product_ids: number[];
    config: PackDiscountConfig;
}

interface PackDiscountErrors {
    product_ids?: string;
    bundle_price?: string;
}

interface PackDiscountSectionProps {
    values: PackDiscountValues;
    errors: PackDiscountErrors;
    onChange: (partial: Partial<PackDiscountValues>) => void;
}

const INPUT_CLASS = 'w-full h-14 px-5 rounded-3xl bg-zinc-100/70 border-2 border-zinc-300 font-bold text-sm placeholder:text-zinc-400 focus:outline-none focus:border-yellow-400 transition-colors';
const LABEL_CLASS = 'block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1';

export default function PackDiscountSection({ values, errors, onChange }: PackDiscountSectionProps) {
    const { t } = useTranslation();
    const { products } = useProductStore();
    const { formatCurrency: format } = useFormatCurrency();

    const selectedProducts = useMemo(
        () => products.filter((p) => values.product_ids.includes(p.id)),
        [products, values.product_ids]
    );
    const originalTotal = selectedProducts.reduce((sum, p) => sum + p.selling_price, 0);
    const { bundle_price } = values.config;
    const savings = originalTotal - (bundle_price ?? 0);

    return (
        <div className="space-y-4">
            <div className="h-px bg-zinc-200" />

            {/* Product Selection â€” multi-select */}
            <ProductSearchSelect
                label={`${t('promotions.form.bundle_products_label', 'Bundle Products')} (select 2+)`}
                selectedIds={values.product_ids}
                multiSelect
                onChange={(ids) => onChange({ product_ids: ids })}
                error={errors.product_ids}
                placeholder={t('promotions.form.product_search_placeholder', 'Search by name or barcodeâ€¦')}
            />

            {/* Bundle Price */}
            <div>
                <label className={LABEL_CLASS}>{t('promotions.form.bundle_price_label', 'Bundle Price')}</label>
                <input
                    type="number"
                    value={bundle_price || ''}
                    onChange={(e) => onChange({ config: { bundle_price: parseFloat(e.target.value) || 0 } })}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    className={INPUT_CLASS}
                />
                {errors.bundle_price && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.bundle_price}</p>}
            </div>

            {/* Preview */}
            {selectedProducts.length >= 2 && bundle_price && bundle_price > 0 && (
                <div className="px-5 py-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-sm">
                    <div className="flex justify-between">
                        <span className="text-zinc-500 font-semibold">{t('promotions.form.original_total', 'Original Total')}</span>
                        <span className="font-bold">{format(originalTotal)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-zinc-500 font-semibold">{t('promotions.form.bundle_price_label', 'Bundle Price')}</span>
                        <span className="font-bold">{format(bundle_price)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="font-black text-amber-700">{t('promotions.form.savings', 'Savings')}</span>
                        <span className={`font-black ${savings > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{format(savings)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
