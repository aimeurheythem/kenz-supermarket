import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
    const [typeOpen, setTypeOpen] = useState(false);
    const typeRef = useRef<HTMLDivElement>(null);

    const TYPES: { value: PromotionType; label: string }[] = [
        { value: 'price_discount', label: t('promotions.type.price_discount') },
        { value: 'quantity_discount', label: t('promotions.type.quantity_discount') },
        { value: 'pack_discount', label: t('promotions.type.pack_discount') },
    ];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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

            {/* Type — custom dropdown */}
            <div ref={typeRef} className="relative">
                <label className={LABEL_CLASS}>{t('promotions.form.type_label')}</label>
                <button
                    type="button"
                    disabled={isEditMode}
                    onClick={() => !isEditMode && setTypeOpen((o) => !o)}
                    className={`w-full h-14 ps-5 pe-4 rounded-3xl bg-zinc-100/70 border-2 font-bold text-sm text-start flex items-center transition-colors
                        ${typeOpen ? 'border-yellow-400' : 'border-zinc-300'}
                        ${isEditMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-400'}`}
                >
                    <span className="flex-1 text-zinc-800">
                        {TYPES.find((tp) => tp.value === values.type)?.label ?? values.type}
                    </span>
                    <ChevronDown
                        size={16}
                        strokeWidth={2.5}
                        className={`shrink-0 text-zinc-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {typeOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
                        <ul>
                            {TYPES.map((tp) => {
                                const selected = values.type === tp.value;
                                return (
                                    <li key={tp.value}>
                                        <button
                                            type="button"
                                            onClick={() => { onChange({ type: tp.value }); setTypeOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                                        >
                                            <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                selected ? 'bg-yellow-400 border-yellow-400' : 'border-zinc-300'
                                            }`}>
                                                {selected && <Check size={10} strokeWidth={3.5} className="text-white" />}
                                            </span>
                                            <span className="text-sm font-bold text-zinc-800">{tp.label}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
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
