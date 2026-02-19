import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Globe, Receipt, Banknote, Store, User, Database } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { backupDatabase, restoreDatabase, resetAllData } from '../../database/db';
import { cn, validatePassword } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import AccountTab from '@/components/settings/AccountTab';
import StoreInfoTab from '@/components/settings/StoreInfoTab';
import LocalizationTab from '@/components/settings/LocalizationTab';
import TaxTab from '@/components/settings/TaxTab';
import ReceiptTab from '@/components/settings/ReceiptTab';
import SystemTab from '@/components/settings/SystemTab';

type TabId = 'account' | 'general' | 'localization' | 'sales' | 'receipt' | 'system';

export default function Settings() {
    const { t } = useTranslation();
    const { user, updateProfile, changePassword } = useAuthStore();
    const { settings, loadSettings, updateSettings } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<TabId>('account');

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
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

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.error(t('settings.password_mismatch'));
            return;
        }
        const validation = validatePassword(passwords.new);
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }
        const success = await changePassword(passwords.current, passwords.new);
        if (success) {
            toast.success(t('settings.password_changed'));
            setPasswords({ current: '', new: '', confirm: '' });
        } else {
            toast.error(t('settings.password_change_failed'));
        }
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
            window.location.reload();
        } catch (err) {
            console.error(err);
            toast.error('Failed to restore database. Invalid file format.');
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError('Please enter your password');
            return;
        }
        if (deleteConfirmText !== 'DELETE') {
            setDeleteError('Please type DELETE to confirm');
            return;
        }
        setDeleteLoading(true);
        setDeleteError('');
        const { login } = useAuthStore.getState();
        const isValid = await login(user!.username, deletePassword);
        if (!isValid) {
            setDeleteError('Incorrect password. Account deletion denied.');
            setDeleteLoading(false);
            return;
        }
        try {
            await resetAllData(user!.id, user!.full_name);
            localStorage.removeItem('auth-storage');
            window.location.reload();
        } catch (error) {
            console.error('Failed to delete account:', error);
            setDeleteError('Failed to delete account. Please try again.');
            setDeleteLoading(false);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                <SettingsIcon size={64} className="mb-4 opacity-50" />
                <h2 className="text-xl font-semibold">{t('settings.access_denied')}</h2>
                <p>{t('settings.admin_only')}</p>
            </div>
        );
    }

    const tabs = [
        { id: 'account' as TabId, label: t('settings.tab_account'), icon: User },
        { id: 'general' as TabId, label: t('settings.tab_general'), icon: Store },
        { id: 'localization' as TabId, label: t('settings.tab_localization'), icon: Globe },
        { id: 'sales' as TabId, label: t('settings.tab_sales'), icon: Banknote },
        { id: 'receipt' as TabId, label: t('settings.tab_receipt'), icon: Receipt },
        { id: 'system' as TabId, label: t('settings.tab_system'), icon: Database },
    ];

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-10">
            <div className="border-b border-[var(--color-border)] pb-4">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('settings.title')}</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('settings.subtitle')}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 flex flex-col gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left',
                                activeTab === tab.id
                                    ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]/50',
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 space-y-6">
                    {activeTab === 'account' && (
                        <AccountTab
                            formData={formData}
                            handleChange={handleChange}
                            handleSave={handleSave}
                            passwords={passwords}
                            setPasswords={setPasswords}
                            handlePasswordChange={handlePasswordChange}
                            showDeleteConfirm={showDeleteConfirm}
                            setShowDeleteConfirm={setShowDeleteConfirm}
                            deletePassword={deletePassword}
                            setDeletePassword={setDeletePassword}
                            deleteConfirmText={deleteConfirmText}
                            setDeleteConfirmText={setDeleteConfirmText}
                            deleteError={deleteError}
                            setDeleteError={setDeleteError}
                            deleteLoading={deleteLoading}
                            handleDeleteAccount={handleDeleteAccount}
                        />
                    )}
                    {activeTab === 'general' && (
                        <StoreInfoTab formData={formData} handleChange={handleChange} handleSave={handleSave} />
                    )}
                    {activeTab === 'localization' && (
                        <LocalizationTab formData={formData} handleChange={handleChange} handleSave={handleSave} />
                    )}
                    {activeTab === 'sales' && (
                        <TaxTab formData={formData} handleChange={handleChange} handleSave={handleSave} />
                    )}
                    {activeTab === 'receipt' && (
                        <ReceiptTab formData={formData} handleChange={handleChange} handleSave={handleSave} />
                    )}
                    {activeTab === 'system' && <SystemTab handleBackup={handleBackup} handleRestore={handleRestore} />}
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
