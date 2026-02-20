import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Globe, Receipt, Banknote, Store, Database } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { backupDatabase, restoreDatabase } from '../../database/db';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import StoreInfoTab from '@/components/settings/StoreInfoTab';
import LocalizationTab from '@/components/settings/LocalizationTab';
import TaxTab from '@/components/settings/TaxTab';
import ReceiptTab from '@/components/settings/ReceiptTab';
import SystemTab from '@/components/settings/SystemTab';
import { usePageTitle } from '@/hooks/usePageTitle';

type TabId = 'general' | 'localization' | 'sales' | 'receipt' | 'system';

export default function Settings() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.settings'));
    const { user, updateProfile } = useAuthStore();
    const { settings, loadSettings, updateSettings } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<TabId>('general');

    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        setFormData(settings);
        if (user) {
            setFormData((prev) => ({ ...prev, 'user.name': user.full_name, 'user.username': user.username }));
        }
    }, [settings, user]);

    const handleChange = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        await updateSettings(formData);
        if (user && (formData['user.name'] !== user.full_name || formData['user.username'] !== user.username)) {
            await updateProfile({ full_name: formData['user.name'], username: formData['user.username'] });
        }
        toast.success(t('settings.saved_success'));
    };

    const handleBackup = async () => {
        try {
            await backupDatabase();
        } catch (e) {
            console.error(e);
            toast.error('Failed to create backup.');
        }
    };

    const handleRestore = () => setShowRestoreConfirm(true);

    const confirmRestore = async () => {
        setShowRestoreConfirm(false);
        try {
            await restoreDatabase();
            const { logout } = useAuthStore.getState();
            logout();
            await loadSettings();
            toast.success(t('settings.restore_success', 'Database restored successfully. Please log in again.'));
        } catch (err) {
            console.error(err);
            toast.error('Failed to restore database. Invalid file format.');
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <SettingsIcon size={64} className="mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-black">{t('settings.access_denied')}</h2>
                <p className="text-sm">{t('settings.admin_only')}</p>
            </div>
        );
    }

    const tabs = [
        { id: 'general' as TabId, label: t('settings.tab_general'), icon: Store },
        { id: 'localization' as TabId, label: t('settings.tab_localization'), icon: Globe },
        { id: 'sales' as TabId, label: t('settings.tab_sales'), icon: Banknote },
        { id: 'receipt' as TabId, label: t('settings.tab_receipt'), icon: Receipt },
        { id: 'system' as TabId, label: t('settings.tab_system'), icon: Database },
    ];

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4 max-w-5xl mx-auto">
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.15] rounded-[3rem]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                }}
            />

            <div className="relative z-10 flex-1 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.settings')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('settings.title')}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Settings Container */}
                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        {/* Sidebar Tabs */}
                        <div className="w-full md:w-64 p-4 border-b md:border-b-0 md:border-r border-zinc-100">
                            <div className="flex flex-col gap-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all text-left',
                                            activeTab === tab.id
                                                ? 'bg-black text-white shadow-lg shadow-black/20'
                                                : 'text-zinc-500 hover:text-black hover:bg-zinc-50',
                                        )}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-6">
                            {activeTab === 'general' && (
                                <StoreInfoTab formData={formData} handleChange={handleChange} handleSave={handleSave} />
                            )}
                            {activeTab === 'localization' && (
                                <LocalizationTab
                                    formData={formData}
                                    handleChange={handleChange}
                                    handleSave={handleSave}
                                />
                            )}
                            {activeTab === 'sales' && (
                                <TaxTab formData={formData} handleChange={handleChange} handleSave={handleSave} />
                            )}
                            {activeTab === 'receipt' && (
                                <ReceiptTab formData={formData} handleChange={handleChange} handleSave={handleSave} />
                            )}
                            {activeTab === 'system' && (
                                <SystemTab handleBackup={handleBackup} handleRestore={handleRestore} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showRestoreConfirm}
                onClose={() => setShowRestoreConfirm(false)}
                onConfirm={confirmRestore}
                title={t('settings.restore_confirm_title')}
                description={t('settings.restore_confirm_desc')}
                confirmLabel={t('settings.restore_confirm_btn')}
                variant="danger"
            />
        </div>
    );
}
