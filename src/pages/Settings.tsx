import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Database, Upload, Download, Settings as SettingsIcon, Globe, Receipt, Banknote, Store, User, Trash2 } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { backupDatabase, restoreDatabase, resetAllData, triggerSave } from '../../database/db';
import { cn, validatePassword } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function Settings() {
    const { t } = useTranslation();
    const { user, updateProfile, changePassword } = useAuthStore();
    const { settings, loadSettings, updateSettings, isLoading } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<'account' | 'general' | 'localization' | 'sales' | 'receipt' | 'system'>('account');

    // Local state for password change
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Local state for form handling
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        setFormData(settings);
        if (user) {
            setFormData(prev => ({
                ...prev,
                'user.name': user.full_name,
                'user.username': user.username
            }));
        }
    }, [settings, user]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        // Save Settings
        await updateSettings(formData);

        // Update User Profile if changed
        if (user && (formData['user.name'] !== user.full_name || formData['user.username'] !== user.username)) {
            await updateProfile({
                full_name: formData['user.name'],
                username: formData['user.username']
            });
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

    const handleRestore = async () => {
        setShowRestoreConfirm(true);
    };

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

        // Verify password using login
        const { login } = useAuthStore.getState();
        const isValid = await login(user!.username, deletePassword);
        if (!isValid) {
            setDeleteError('Incorrect password. Account deletion denied.');
            setDeleteLoading(false);
            return;
        }

        try {
            // Use the safe, transactional resetAllData function
            await resetAllData(user!.id, user!.full_name);

            // Clear auth state and reload — triggers onboarding
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
        { id: 'account', label: t('settings.tab_account'), icon: User },
        { id: 'general', label: t('settings.tab_general'), icon: Store },
        { id: 'localization', label: t('settings.tab_localization'), icon: Globe },
        { id: 'sales', label: t('settings.tab_sales'), icon: Banknote },
        { id: 'receipt', label: t('settings.tab_receipt'), icon: Receipt },
        { id: 'system', label: t('settings.tab_system'), icon: Database },
    ];

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-10">
            <div className="border-b border-[var(--color-border)] pb-4">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('settings.title')}</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('settings.subtitle')}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left",
                                activeTab === tab.id
                                    ? "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]"
                                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]/50"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Account Settings */}
                    {activeTab === 'account' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn space-y-8">

                            {/* Profile Info */}
                            <div>
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <User size={20} className="text-blue-600" />
                                    {t('settings.profile_title')}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_full_name')}</label>
                                        <input
                                            type="text"
                                            value={formData['user.name'] || ''}
                                            onChange={e => handleChange('user.name', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_username')}</label>
                                        <input
                                            type="text"
                                            value={formData['user.username'] || ''}
                                            onChange={e => handleChange('user.username', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button className="btn-page-action" onClick={handleSave} icon={<Save size={16} />}>{t('settings.update_profile')}</Button>
                                </div>
                            </div>

                            <div className="w-full h-px bg-[var(--color-border)]" />

                            {/* Password Change */}
                            <div>
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <SettingsIcon size={20} className="text-red-500" />
                                    {t('settings.change_password')}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_current_password')}</label>
                                        <input
                                            type="password"
                                            value={passwords.current}
                                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_new_password')}</label>
                                        <input
                                            type="password"
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_confirm_password')}</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handlePasswordChange} icon={<Save size={16} />} variant="secondary">{t('settings.change_password_btn')}</Button>
                                </div>
                            </div>

                            <div className="w-full h-px bg-[var(--color-border)]" />

                            {/* Danger Zone */}
                            <div>
                                <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600">
                                    <Trash2 size={20} />
                                    {t('settings.danger_zone')}
                                </h2>
                                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                    {t('settings.danger_description')}
                                </p>

                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        {t('settings.delete_account')}
                                    </button>
                                ) : (
                                    <div className="p-4 border-2 border-red-300 bg-red-50 rounded-xl space-y-3">
                                        <p className="text-sm font-semibold text-red-700">{t('settings.delete_password_prompt')}</p>
                                        <input
                                            type="password"
                                            value={deletePassword}
                                            onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                            placeholder={t('settings.delete_password_placeholder')}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                                            autoFocus
                                        />
                                        <p className="text-sm font-semibold text-red-700">{t('settings.delete_confirm_prompt')}</p>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={e => { setDeleteConfirmText(e.target.value.toUpperCase()); setDeleteError(''); }}
                                            placeholder={t('settings.delete_type_placeholder')}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-mono"
                                        />
                                        {deleteError && (
                                            <p className="text-sm text-red-600 font-medium">{deleteError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                {deleteLoading ? t('settings.deleting') : t('settings.confirm_delete')}
                                            </button>
                                            <button
                                                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteConfirmText(''); setDeleteError(''); }}
                                                className="px-5 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Store size={20} className="text-blue-500" />
                                {t('settings.store_profile')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_store_name')}</label>
                                        <input
                                            type="text"
                                            value={formData['store.name'] || ''}
                                            onChange={e => handleChange('store.name', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="My Supermarket"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_email')}</label>
                                        <input
                                            type="email"
                                            value={formData['store.email'] || ''}
                                            onChange={e => handleChange('store.email', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="contact@store.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_phone')}</label>
                                        <input
                                            type="text"
                                            value={formData['store.phone'] || ''}
                                            onChange={e => handleChange('store.phone', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_address')}</label>
                                        <textarea
                                            value={formData['store.address'] || ''}
                                            onChange={e => handleChange('store.address', e.target.value)}
                                            rows={5}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                            placeholder="123 Market Street&#10;City, Country"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button className="btn-page-action" onClick={handleSave} icon={<Save size={16} />}>{t('settings.save_changes')}</Button>
                            </div>
                        </div>
                    )}

                    {/* Localization Settings */}
                    {activeTab === 'localization' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Globe size={20} className="text-emerald-500" />
                                {t('settings.localization_title')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_currency_symbol')}</label>
                                    <input
                                        type="text"
                                        value={formData['currency.symbol'] || 'DZ'}
                                        onChange={e => handleChange('currency.symbol', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="DZ"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.currency_hint')}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_currency_position')}</label>
                                    <select
                                        value={formData['currency.position'] || 'suffix'}
                                        onChange={e => handleChange('currency.position', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="prefix">{t('settings.currency_prefix')}</option>
                                        <option value="suffix">{t('settings.currency_suffix')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button className="btn-page-action" onClick={handleSave} icon={<Save size={16} />}>{t('settings.save_changes')}</Button>
                            </div>
                        </div>
                    )}

                    {/* Sales & Tax Settings */}
                    {activeTab === 'sales' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Banknote size={20} className="text-purple-500" />
                                {t('settings.sales_tax_title')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_tax_name')}</label>
                                    <input
                                        type="text"
                                        value={formData['tax.name'] || 'Tax'}
                                        onChange={e => handleChange('tax.name', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                        placeholder="VAT, Tax, TVA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_tax_rate')}</label>
                                    <input
                                        type="number"
                                        value={formData['tax.rate'] || '0'}
                                        onChange={e => handleChange('tax.rate', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.tax_rate_hint')}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button className="btn-page-action" onClick={handleSave} icon={<Save size={16} />}>{t('settings.save_changes')}</Button>
                            </div>
                        </div>
                    )}

                    {/* Receipt Settings */}
                    {activeTab === 'receipt' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Receipt size={20} className="text-orange-500" />
                                {t('settings.receipt_title')}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_receipt_header')}</label>
                                    <textarea
                                        value={formData['receipt.header'] || ''}
                                        onChange={e => handleChange('receipt.header', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                                        placeholder="Thank you for shopping with us!"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.receipt_header_hint')}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{t('settings.label_receipt_footer')}</label>
                                    <textarea
                                        value={formData['receipt.footer'] || ''}
                                        onChange={e => handleChange('receipt.footer', e.target.value)}
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
                                        onChange={e => handleChange('receipt.showLogo', String(e.target.checked))}
                                        className="rounded border-[var(--color-border)] text-orange-500 focus:ring-orange-500"
                                    />
                                    <label htmlFor="showLogo" className="text-sm text-[var(--color-text-primary)]">{t('settings.label_show_logo')}</label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button className="btn-page-action" onClick={handleSave} icon={<Save size={16} />}>{t('settings.save_changes')}</Button>
                            </div>
                        </div>
                    )}

                    {/* System Settings */}
                    {activeTab === 'system' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Database size={20} className="text-red-500" />
                                {t('settings.system_title')}
                            </h2>
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{t('settings.backup_title')}</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        {t('settings.backup_desc')}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="secondary" onClick={handleBackup} icon={<Download size={16} />}>
                                        {t('settings.backup_btn')}
                                    </Button>
                                    <Button variant="secondary" onClick={handleRestore} icon={<Upload size={16} />}>
                                        {t('settings.restore_btn')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
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
