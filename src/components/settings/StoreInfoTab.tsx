import { useTranslation } from 'react-i18next';
import { Save, Store } from 'lucide-react';
import Button from '@/components/common/Button';

interface StoreInfoTabProps {
    formData: Record<string, string>;
    handleChange: (key: string, value: string) => void;
    handleSave: () => void;
}

export default function StoreInfoTab({ formData, handleChange, handleSave }: StoreInfoTabProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Store size={20} className="text-blue-500" />
                {t('settings.store_profile')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_store_name')}
                        </label>
                        <input
                            type="text"
                            value={formData['store.name'] || ''}
                            onChange={(e) => handleChange('store.name', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="My Supermarket"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_email')}
                        </label>
                        <input
                            type="email"
                            value={formData['store.email'] || ''}
                            onChange={(e) => handleChange('store.email', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="contact@store.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_phone')}
                        </label>
                        <input
                            type="text"
                            value={formData['store.phone'] || ''}
                            onChange={(e) => handleChange('store.phone', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="+1 234 567 890"
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_address')}
                        </label>
                        <textarea
                            value={formData['store.address'] || ''}
                            onChange={(e) => handleChange('store.address', e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder="123 Market Street&#10;City, Country"
                        />
                    </div>
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
