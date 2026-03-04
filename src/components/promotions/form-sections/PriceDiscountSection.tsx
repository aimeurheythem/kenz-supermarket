import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/stores/useProductStore';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { PriceDiscountConfig } from '@/lib/types';
import ProductSearchSelect from './ProductSearchSelect';

interface PriceDiscountValues {
    product_ids: number[];
    config: PriceDiscountConfig;
}

interface PriceDiscountErrors {
    product_ids?: string;
    discount_type?: string;
    discount_value?: string;
    max_discount?: string;
}

interface PriceDiscountSectionProps {
    values: PriceDiscountValues;
    errors: PriceDiscountErrors;
    onChange: (partial: Partial<PriceDiscountValues>) => void;
}

const INPUT_CLASS = 'w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all placeholder:text-[var(--color-text-placeholder)]';
const LABEL_CLASS = 'block text-sm font-medium text-[var(--color-text-muted)] mb-1';

export default function PriceDiscountSection({ values, errors, onChange }: PriceDiscountSectionProps) {
    const { t } = useTranslation();
    const { products } = useProductStore();
    const { formatCurrency: format } = useFormatCurrency();

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === values.product_ids[0]),
        [products, values.product_ids]
    );

    const updateConfig = (partial: Partial<PriceDiscountConfig>) => {
        onChange({ config: { ...values.config, ...partial } });
    };

    // Compute live preview
    const preview = useMemo(() => {
        if (!selectedProduct) return null;
        const { discount_type, discount_value, max_discount } = values.config;
        if (!discount_value || discount_value <= 0) return null;
        let discountAmount: number;
        if (discount_type === 'percentage') {
            discountAmount = selectedProduct.selling_price * (discount_value / 100);
            if (max_discount) discountAmount = Math.min(discountAmount, max_discount);
        } else {
            discountAmount = discount_value;
        }
        discountAmount = Math.min(discountAmount, selectedProduct.selling_price);
        const finalPrice = selectedProduct.selling_price - discountAmount;
        return { original: selectedProduct.selling_price, final: finalPrice, discount: discountAmount };
    }, [selectedProduct, values.config]);

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

            {/* Discount Type */}
            <div>
                <label className={LABEL_CLASS}>{t('promotions.form.discount_type_label')}</label>
                <div className="flex gap-3">
                    {(['percentage', 'fixed'] as const).map((dt) => (
                        <button
                            key={dt}
                            type="button"
                            onClick={() => updateConfig({ discount_type: dt })}
                            className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-all ${
                                values.config.discount_type === dt
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'bg-[var(--color-bg-input)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                            }`}
                        >
                            {t(`promotions.form.discount_type_${dt}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Discount Value */}
            <div>
                <label className={LABEL_CLASS}>
                    {values.config.discount_type === 'percentage'
                        ? t('promotions.form.discount_percentage_label', 'Discount (%)')
                        : t('promotions.form.discount_fixed_label', 'Discount Amount')}
                </label>
                <input
                    type="number"
                    value={values.config.discount_value || ''}
                    onChange={(e) => updateConfig({ discount_value: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min={0}
                    max={values.config.discount_type === 'percentage' ? 100 : undefined}
                    step={values.config.discount_type === 'percentage' ? 1 : 0.01}
                    className={INPUT_CLASS}
                />
                {errors.discount_value && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.discount_value}</p>}
            </div>

            {/* Max Discount (percentage only) */}
            {values.config.discount_type === 'percentage' && (
                <div>
                    <label className={LABEL_CLASS}>
                        {t('promotions.form.max_discount_label')}{' '}
                        <span className="text-zinc-400 normal-case font-semibold">({t('promotions.form.optional', 'optional')})</span>
                    </label>
                    <input
                        type="number"
                        value={values.config.max_discount ?? ''}
                        onChange={(e) => updateConfig({ max_discount: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder={t('promotions.form.max_discount_placeholder', 'No cap')}
                        min={0}
                        step={0.01}
                        className={INPUT_CLASS}
                    />
                    {errors.max_discount && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.max_discount}</p>}
                </div>
            )}

            {/* Live Preview */}
            {preview && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm">
                    <span className="text-zinc-500 font-semibold">{t('promotions.form.preview', 'Preview')}: </span>
                    <span className="line-through text-zinc-400">{format(preview.original)}</span>
                    <span className="mx-2 text-yellow-600 font-black">→</span>
                    <span className="font-black text-black">{format(preview.final)}</span>
                    <span className="ml-2 text-emerald-600 font-semibold">(-{format(preview.discount)})</span>
                </div>
            )}
        </div>
    );
}
