import { useState, useEffect } from 'react';
import { Save, Database, Upload, Download, Settings as SettingsIcon, Globe, Receipt, Banknote, Store, User, Trash2 } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { backupDatabase, restoreDatabase, resetAllData, triggerSave } from '../../database/db';
import { cn, validatePassword } from '@/lib/utils';

export default function Settings() {
    const { user, updateProfile, changePassword } = useAuthStore();
    const { settings, loadSettings, updateSettings, isLoading } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<'account' | 'general' | 'localization' | 'sales' | 'receipt' | 'system'>('account');

    // Local state for password change
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

        alert('Settings saved successfully!');
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            alert('New passwords do not match');
            return;
        }
        const validation = validatePassword(passwords.new);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        const success = await changePassword(passwords.current, passwords.new);
        if (success) {
            alert('Password changed successfully');
            setPasswords({ current: '', new: '', confirm: '' });
        } else {
            alert('Failed to change password. Check current password.');
        }
    };

    const handleBackup = async () => {
        try {
            await backupDatabase();
        } catch (e) {
            console.error(e);
            alert('Failed to create backup.');
        }
    };

    const handleRestore = async () => {
        if (!confirm('WARNING: This will overwrite the current database with the backup. All current data will be lost. Continue?')) {
            return;
        }

        try {
            await restoreDatabase();
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Failed to restore database. Invalid file format.');
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
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p>Only administrators can access settings.</p>
            </div>
        );
    }

    const tabs = [
        { id: 'account', label: 'My Account', icon: User },
        { id: 'general', label: 'General', icon: Store },
        { id: 'localization', label: 'Localization', icon: Globe },
        { id: 'sales', label: 'Sales & Tax', icon: Banknote },
        { id: 'receipt', label: 'Receipt', icon: Receipt },
        { id: 'system', label: 'System', icon: Database },
    ];

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-10">
            <div className="border-b border-[var(--color-border)] pb-4">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">System configuration and maintenance</p>
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
                                    Profile Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData['user.name'] || ''}
                                            onChange={e => handleChange('user.name', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Username</label>
                                        <input
                                            type="text"
                                            value={formData['user.username'] || ''}
                                            onChange={e => handleChange('user.username', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleSave} icon={<Save size={16} />}>Update Profile</Button>
                                </div>
                            </div>

                            <div className="w-full h-px bg-[var(--color-border)]" />

                            {/* Password Change */}
                            <div>
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <SettingsIcon size={20} className="text-red-500" />
                                    Change Password
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwords.current}
                                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">New Password</label>
                                        <input
                                            type="password"
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handlePasswordChange} icon={<Save size={16} />} variant="secondary">Change Password</Button>
                                </div>
                            </div>

                            <div className="w-full h-px bg-[var(--color-border)]" />

                            {/* Danger Zone */}
                            <div>
                                <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600">
                                    <Trash2 size={20} />
                                    Danger Zone
                                </h2>
                                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                    This will permanently delete your account, all products, sales, and every piece of data. The app will restart from scratch with the setup wizard.
                                </p>

                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete Account & All Data
                                    </button>
                                ) : (
                                    <div className="p-4 border-2 border-red-300 bg-red-50 rounded-xl space-y-3">
                                        <p className="text-sm font-semibold text-red-700">Enter your password to confirm deletion:</p>
                                        <input
                                            type="password"
                                            value={deletePassword}
                                            onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                            placeholder="Enter your password"
                                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                                            autoFocus
                                        />
                                        <p className="text-sm font-semibold text-red-700">Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm:</p>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={e => { setDeleteConfirmText(e.target.value.toUpperCase()); setDeleteError(''); }}
                                            placeholder="Type DELETE"
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
                                                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                                            </button>
                                            <button
                                                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteConfirmText(''); setDeleteError(''); }}
                                                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
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
                                Store Profile
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Store Name</label>
                                        <input
                                            type="text"
                                            value={formData['store.name'] || ''}
                                            onChange={e => handleChange('store.name', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="My Supermarket"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData['store.email'] || ''}
                                            onChange={e => handleChange('store.email', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="contact@store.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Phone Number</label>
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
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Address</label>
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
                                <Button onClick={handleSave} icon={<Save size={16} />}>Save Changes</Button>
                            </div>
                        </div>
                    )}

                    {/* Localization Settings */}
                    {activeTab === 'localization' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Globe size={20} className="text-emerald-500" />
                                Localization
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Currency Symbol</label>
                                    <input
                                        type="text"
                                        value={formData['currency.symbol'] || 'DZ'}
                                        onChange={e => handleChange('currency.symbol', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="DZ"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Symbol displayed next to prices (e.g. DZ, €, £).</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Currency Position</label>
                                    <select
                                        value={formData['currency.position'] || 'suffix'}
                                        onChange={e => handleChange('currency.position', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="prefix">Prefix (DZ 100)</option>
                                        <option value="suffix">Suffix (100 DZ)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleSave} icon={<Save size={16} />}>Save Changes</Button>
                            </div>
                        </div>
                    )}

                    {/* Sales & Tax Settings */}
                    {activeTab === 'sales' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Banknote size={20} className="text-purple-500" />
                                Sales & Tax
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Tax Name</label>
                                    <input
                                        type="text"
                                        value={formData['tax.name'] || 'Tax'}
                                        onChange={e => handleChange('tax.name', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                        placeholder="VAT, Tax, TVA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Default Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        value={formData['tax.rate'] || '0'}
                                        onChange={e => handleChange('tax.rate', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Default tax rate applied to new products.</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleSave} icon={<Save size={16} />}>Save Changes</Button>
                            </div>
                        </div>
                    )}

                    {/* Receipt Settings */}
                    {activeTab === 'receipt' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Receipt size={20} className="text-orange-500" />
                                Receipt Configuration
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Receipt Header</label>
                                    <textarea
                                        value={formData['receipt.header'] || ''}
                                        onChange={e => handleChange('receipt.header', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                                        placeholder="Thank you for shopping with us!"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Text displayed at the top of the receipt, below the store details.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Receipt Footer</label>
                                    <textarea
                                        value={formData['receipt.footer'] || ''}
                                        onChange={e => handleChange('receipt.footer', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                                        placeholder="No returns without receipt."
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Text displayed at the bottom of the receipt.</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="showLogo"
                                        checked={formData['receipt.showLogo'] === 'true'}
                                        onChange={e => handleChange('receipt.showLogo', String(e.target.checked))}
                                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <label htmlFor="showLogo" className="text-sm text-[var(--color-text-primary)]">Show Store Logo on Receipt</label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleSave} icon={<Save size={16} />}>Save Changes</Button>
                            </div>
                        </div>
                    )}

                    {/* System Settings */}
                    {activeTab === 'system' && (
                        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Database size={20} className="text-red-500" />
                                Database Management
                            </h2>
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Backup & Restore</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        Download a backup of your data or restore from a previous backup file.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="secondary" onClick={handleBackup} icon={<Download size={16} />}>
                                        Backup Data
                                    </Button>
                                    <Button variant="secondary" onClick={handleRestore} icon={<Upload size={16} />}>
                                        Restore Data
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
