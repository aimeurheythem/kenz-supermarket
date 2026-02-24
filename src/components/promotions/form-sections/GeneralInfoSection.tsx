import { useTranslation } from 'react-i18next';
import type { PromotionType, PromotionStatus } from '@/lib/types';

interface GeneralInfoValues {
    name: string;
    type: PromotionType;
    status: PromotionStatus;
    start_date: string;
    end_date: string;
}

interface GeneralInfoErrors {
    name?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
}

interface GeneralInfoSectionProps {
    values: GeneralInfoValues;
    errors: GeneralInfoErrors;
    onChange: (partial: Partial<GeneralInfoValues>) => void;
    isEditMode: boolean;
}

const INPUT_CLASS = 'w-full h-14 px-5 rounded-3xl bg-zinc-100/70 border-2 border-zinc-300 font-bold text-sm placeholder:text-zinc-400 focus:outline-none focus:border-yellow-400 transition-colors';
const LABEL_CLASS = 'block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1';

export default function GeneralInfoSection({ values, errors, onChange, isEditMode }: GeneralInfoSectionProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            {/* Name */}
            <div>
                <label className={LABEL_CLASS}>{t('promotions.form.name_label')}</label>
                <input
                    type="text"
                    value={values.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder={t('promotions.form.name_placeholder')}
                    className={INPUT_CLASS}
                    maxLength={200}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.name}</p>}
            </div>

            {/* Type */}
            <div>
                <label className={LABEL_CLASS}>{t('promotions.form.type_label')}</label>
                <select
                    value={values.type}
                    onChange={(e) => onChange({ type: e.target.value as PromotionType })}
                    disabled={isEditMode}
                    className={`${INPUT_CLASS} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                    <option value="price_discount">{t('promotions.type.price_discount')}</option>
                    <option value="quantity_discount">{t('promotions.type.quantity_discount')}</option>
                    <option value="pack_discount">{t('promotions.type.pack_discount')}</option>
                </select>
                {errors.type && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.type}</p>}
            </div>

            {/* Status */}
            <div>
                <label className={LABEL_CLASS}>{t('promotions.form.status_label')}</label>
                <div className="flex gap-3">
                    {(['active', 'inactive'] as PromotionStatus[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => onChange({ status: s })}
                            className={`flex-1 h-14 rounded-3xl border-2 font-black uppercase tracking-widest text-xs transition-all ${
                                values.status === s
                                    ? s === 'active'
                                        ? 'bg-emerald-400 border-emerald-400 text-white'
                                        : 'bg-zinc-700 border-zinc-700 text-white'
                                    : 'bg-zinc-100/70 border-zinc-300 text-zinc-500 hover:border-zinc-400'
                            }`}
                        >
                            {t(`promotions.status.${s}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>{t('promotions.form.start_date_label')}</label>
                    <input
                        type="date"
                        value={values.start_date}
                        onChange={(e) => onChange({ start_date: e.target.value })}
                        className={INPUT_CLASS}
                    />
                    {errors.start_date && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.start_date}</p>}
                </div>
                <div>
                    <label className={LABEL_CLASS}>{t('promotions.form.end_date_label')}</label>
                    <input
                        type="date"
                        value={values.end_date}
                        onChange={(e) => onChange({ end_date: e.target.value })}
                        className={INPUT_CLASS}
                    />
                    {errors.end_date && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.end_date}</p>}
                </div>
            </div>
        </div>
    );
}
