import { useState, useEffect } from 'react';
import { Save, Database, Upload, Download, Settings as SettingsIcon, Globe, Receipt, DollarSign, Store } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { backupDatabase, restoreDatabase, triggerSave } from '../../database/db';
import { cn } from '@/lib/utils';

export default function Settings() {
    const { user } = useAuthStore();
    const { settings, loadSettings, updateSettings, isLoading } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<'general' | 'localization' | 'sales' | 'receipt' | 'system'>('general');

    // Local state for form handling
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        await updateSettings(formData);
        alert('Settings saved successfully!');
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
        { id: 'general', label: 'General', icon: Store },
        { id: 'localization', label: 'Localization', icon: Globe },
        { id: 'sales', label: 'Sales & Tax', icon: DollarSign },
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
                                        value={formData['currency.symbol'] || '$'}
                                        onChange={e => handleChange('currency.symbol', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="$"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Symbol displayed next to prices (e.g. $, €, £, DA).</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Currency Position</label>
                                    <select
                                        value={formData['currency.position'] || 'prefix'}
                                        onChange={e => handleChange('currency.position', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="prefix">Prefix ($100)</option>
                                        <option value="suffix">Suffix (100$)</option>
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
                                <DollarSign size={20} className="text-purple-500" />
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
