import { useTranslation } from 'react-i18next';
import { Save, Globe } from 'lucide-react';
import Button from '@/components/common/Button';

interface LocalizationTabProps {
    formData: Record<string, string>;
    handleChange: (key: string, value: string) => void;
    handleSave: () => void;
}

export default function LocalizationTab({ formData, handleChange, handleSave }: LocalizationTabProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe size={20} className="text-emerald-500" />
                {t('settings.localization_title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t('settings.label_currency_symbol')}
                    </label>
                    <input
                        type="text"
                        value={formData['currency.symbol'] || 'DZ'}
                        onChange={(e) => handleChange('currency.symbol', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="DZ"
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.currency_hint')}</p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t('settings.label_currency_position')}
                    </label>
                    <select
                        value={formData['currency.position'] || 'suffix'}
                        onChange={(e) => handleChange('currency.position', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    >
                        <option value="prefix">{t('settings.currency_prefix')}</option>
                        <option value="suffix">{t('settings.currency_suffix')}</option>
                    </select>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button className="btn-page-action" onClick={handleSave} icon={<Save size={16} />}>
                    {t('settings.save_changes')}
                </Button>
            </div>
        </div>
    );
}
