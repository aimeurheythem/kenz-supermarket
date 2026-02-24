import { useTranslation } from 'react-i18next';
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

const INPUT_CLASS = 'w-full h-14 px-5 rounded-3xl bg-zinc-100/70 border-2 border-zinc-300 font-bold text-sm placeholder:text-zinc-400 focus:outline-none focus:border-yellow-400 transition-colors';
const LABEL_CLASS = 'block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1';

export default function QuantityDiscountSection({ values, errors, onChange }: QuantityDiscountSectionProps) {
    const { t } = useTranslation();

    const { buy_quantity, free_quantity } = values.config;
    const totalRequired = buy_quantity + free_quantity;

    const updateConfig = (partial: Partial<QuantityDiscountConfig>) => {
        onChange({ config: { ...values.config, ...partial } });
    };

    return (
        <div className="space-y-4">
            <div className="h-px bg-zinc-200" />

            {/* Product Selection */}
            <ProductSearchSelect
                label={t('promotions.form.product_label')}
                selectedIds={values.product_ids}
                onChange={(ids) => onChange({ product_ids: ids })}
                error={errors.product_ids}
                placeholder={t('promotions.form.product_search_placeholder', 'Search by name or barcodeâ€¦')}
            />

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
                <div className="px-5 py-4 rounded-2xl bg-purple-50 border-2 border-purple-200 text-sm">
                    <span className="font-black text-purple-700">
                        Buy {buy_quantity} Get {free_quantity} Free
                    </span>
                    <span className="ml-2 text-purple-500">
                        â€” {t('promotions.form.total_required', 'Total required')}: {totalRequired}
                    </span>
                </div>
            )}
        </div>
    );
}
