import { useTranslation } from 'react-i18next';
import { Save, Receipt } from 'lucide-react';
import Button from '@/components/common/Button';

interface ReceiptTabProps {
    formData: Record<string, string>;
    handleChange: (key: string, value: string) => void;
    handleSave: () => void;
}

export default function ReceiptTab({ formData, handleChange, handleSave }: ReceiptTabProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-orange-500" />
                {t('settings.receipt_title')}
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t('settings.label_receipt_header')}
                    </label>
                    <textarea
                        value={formData['receipt.header'] || ''}
                        onChange={(e) => handleChange('receipt.header', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                        placeholder="Thank you for shopping with us!"
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.receipt_header_hint')}</p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        {t('settings.label_receipt_footer')}
                    </label>
                    <textarea
                        value={formData['receipt.footer'] || ''}
                        onChange={(e) => handleChange('receipt.footer', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                        placeholder="No returns without receipt."
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.receipt_footer_hint')}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <input
                        type="checkbox"
                        id="showLogo"
                        checked={formData['receipt.showLogo'] === 'true'}
                        onChange={(e) => handleChange('receipt.showLogo', String(e.target.checked))}
                        className="rounded border-[var(--color-border)] text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="showLogo" className="text-sm text-[var(--color-text-primary)]">
                        {t('settings.label_show_logo')}
                    </label>
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
