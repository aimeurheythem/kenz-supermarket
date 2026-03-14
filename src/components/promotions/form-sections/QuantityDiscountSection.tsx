import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useProductStore } from '@/stores/useProductStore';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { QuantityDiscountConfig } from '@/lib/types';
import ProductSearchSelect from './ProductSearchSelect';

interface QuantityDiscountValues {
    product_ids: number[];
    config: QuantityDiscountConfig;
}

interface QuantityDiscountErrors {
    product_ids?: string;
    buy_quantity?: string;
    free_quantity?: string;
}

interface QuantityDiscountSectionProps {
    values: QuantityDiscountValues;
    errors: QuantityDiscountErrors;
    onChange: (partial: Partial<QuantityDiscountValues>) => void;
}

const INPUT_CLASS = 'w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all placeholder:text-[var(--color-text-placeholder)]';
const LABEL_CLASS = 'block text-sm font-medium text-[var(--color-text-muted)] mb-1';

export default function QuantityDiscountSection({ values, errors, onChange }: QuantityDiscountSectionProps) {
    const { t } = useTranslation();
    const { products } = useProductStore();
    const { formatCurrency: format } = useFormatCurrency();

    const { buy_quantity, free_quantity } = values.config;
    const totalRequired = buy_quantity + free_quantity;

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === values.product_ids[0]),
        [products, values.product_ids]
    );

    const preview = useMemo(() => {
        if (!selectedProduct) return null;
        const originalTotal = selectedProduct.selling_price * Math.max(totalRequired, 0);
        const discountedTotal = selectedProduct.selling_price * Math.max(buy_quantity, 0);
        const savings = Math.max(originalTotal - discountedTotal, 0);
        return { originalTotal, discountedTotal, savings };
    }, [selectedProduct, totalRequired, buy_quantity]);

    const updateConfig = (partial: Partial<QuantityDiscountConfig>) => {
        onChange({ config: { ...values.config, ...partial } });
    };

    return (
        <div className="space-y-4">
            <div className="h-px bg-zinc-200 my-2" />

            {/* Product Selection */}
            <ProductSearchSelect
                label={t('promotions.form.product_label')}
                selectedIds={values.product_ids}
                onChange={(ids) => onChange({ product_ids: ids })}
                error={errors.product_ids}
                placeholder={t('promotions.form.product_search_placeholder', 'Search by name or barcode...')}
            />

            {selectedProduct && (
                <div className="px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm">
                    <span className="text-zinc-500 font-semibold">
                        {t('promotions.form.original_price', 'Original Price')}: 
                    </span>
                    <span className="font-black text-black ml-1">{format(selectedProduct.selling_price)}</span>
                </div>
            )}

            {/* Buy / Free Quantity */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>{t('promotions.form.buy_quantity_label', 'Buy Quantity')}</label>
                    <input
                        type="number"
                        value={buy_quantity || ''}
                        onChange={(e) => updateConfig({ buy_quantity: parseInt(e.target.value) || 0 })}
                        placeholder="2"
                        min={1}
                        step={1}
                        className={INPUT_CLASS}
                    />
                    {errors.buy_quantity && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.buy_quantity}</p>}
                </div>
                <div>
                    <label className={LABEL_CLASS}>{t('promotions.form.free_quantity_label', 'Free Quantity')}</label>
                    <input
                        type="number"
                        value={free_quantity || ''}
                        onChange={(e) => updateConfig({ free_quantity: parseInt(e.target.value) || 0 })}
                        placeholder="1"
                        min={1}
                        step={1}
                        className={INPUT_CLASS}
                    />
                    {errors.free_quantity && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.free_quantity}</p>}
                </div>
            </div>

            {/* Preview */}
            {buy_quantity >= 1 && free_quantity >= 1 && (
                <div className="px-4 py-3 rounded-lg bg-purple-50 border border-purple-200 text-sm">
                    <span className="font-black text-purple-700">
                        Buy {buy_quantity} Get {free_quantity} Free
                    </span>
                    <span className="ml-2 text-purple-500">
                        - {t('promotions.form.total_required', 'Total required')}: {totalRequired}
                    </span>
                </div>
            )}

            {preview && buy_quantity >= 1 && free_quantity >= 1 && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm space-y-1">
                    <div>
                        <span className="text-zinc-500 font-semibold">{t('promotions.form.original_total', 'Original Total')}: </span>
                        <span className="line-through text-zinc-400">{format(preview.originalTotal)}</span>
                        <span className="mx-2 text-yellow-600 font-black">→</span>
                        <span className="font-black text-black">{format(preview.discountedTotal)}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 font-semibold">{t('promotions.form.savings', 'Savings')}: </span>
                        <span className="text-emerald-600 font-black">{format(preview.savings)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
