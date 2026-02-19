import { useTranslation } from 'react-i18next';
import { Save, User, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import Button from '@/components/common/Button';

interface AccountTabProps {
    formData: Record<string, string>;
    handleChange: (key: string, value: string) => void;
    handleSave: () => void;
    passwords: { current: string; new: string; confirm: string };
    setPasswords: React.Dispatch<React.SetStateAction<{ current: string; new: string; confirm: string }>>;
    handlePasswordChange: () => void;
    showDeleteConfirm: boolean;
    setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    deletePassword: string;
    setDeletePassword: React.Dispatch<React.SetStateAction<string>>;
    deleteConfirmText: string;
    setDeleteConfirmText: React.Dispatch<React.SetStateAction<string>>;
    deleteError: string;
    setDeleteError: React.Dispatch<React.SetStateAction<string>>;
    deleteLoading: boolean;
    handleDeleteAccount: () => void;
}

export default function AccountTab({
    formData,
    handleChange,
    handleSave,
    passwords,
    setPasswords,
    handlePasswordChange,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deletePassword,
    setDeletePassword,
    deleteConfirmText,
    setDeleteConfirmText,
    deleteError,
    setDeleteError,
    deleteLoading,
    handleDeleteAccount,
}: AccountTabProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn space-y-8">
            {/* Profile Info */}
            <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    {t('settings.profile_title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_full_name')}
                        </label>
                        <input
                            type="text"
                            value={formData['user.name'] || ''}
                            onChange={(e) => handleChange('user.name', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_username')}
                        </label>
                        <input
                            type="text"
                            value={formData['user.username'] || ''}
                            onChange={(e) => handleChange('user.username', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button className="btn-page-action" onClick={handleSave} icon={<Save size={16} />}>
                        {t('settings.update_profile')}
                    </Button>
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
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_current_password')}
                        </label>
                        <input
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_new_password')}
                        </label>
                        <input
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            {t('settings.label_confirm_password')}
                        </label>
                        <input
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handlePasswordChange} icon={<Save size={16} />} variant="secondary">
                        {t('settings.change_password_btn')}
                    </Button>
                </div>
            </div>

            <div className="w-full h-px bg-[var(--color-border)]" />

            {/* Danger Zone */}
            <div>
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600">
                    <Trash2 size={20} />
                    {t('settings.danger_zone')}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('settings.danger_description')}</p>

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
                            onChange={(e) => {
                                setDeletePassword(e.target.value);
                                setDeleteError('');
                            }}
                            placeholder={t('settings.delete_password_placeholder')}
                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                            autoFocus
                        />
                        <p className="text-sm font-semibold text-red-700">{t('settings.delete_confirm_prompt')}</p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => {
                                setDeleteConfirmText(e.target.value.toUpperCase());
                                setDeleteError('');
                            }}
                            placeholder={t('settings.delete_type_placeholder')}
                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-mono"
                        />
                        {deleteError && <p className="text-sm text-red-600 font-medium">{deleteError}</p>}
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
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeletePassword('');
                                    setDeleteConfirmText('');
                                    setDeleteError('');
                                }}
                                className="px-5 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-sm font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
