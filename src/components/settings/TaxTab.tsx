import { useTranslation } from 'react-i18next';
import { Save, Banknote } from 'lucide-react';
import Button from '@/components/common/Button';

interface TaxTabProps {
    formData: Record<string, string>;
    handleChange: (key: string, value: string) => void;
    handleSave: () => void;
}

export default function TaxTab({ formData, handleChange, handleSave }: TaxTabProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Banknote size={20} className="text-purple-500" />
                {t('settings.sales_tax_title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t('settings.label_tax_name')}
                    </label>
                    <input
                        type="text"
                        value={formData['tax.name'] || 'Tax'}
                        onChange={(e) => handleChange('tax.name', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        placeholder="VAT, Tax, TVA"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t('settings.label_tax_rate')}
                    </label>
                    <input
                        type="number"
                        value={formData['tax.rate'] || '0'}
                        onChange={(e) => handleChange('tax.rate', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.tax_rate_hint')}</p>
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
