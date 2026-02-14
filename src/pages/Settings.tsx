import { useState, useEffect } from 'react';
import { Save, Database, Upload, Download, Settings as SettingsIcon } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { saveDatabase, getDatabase, initDatabase } from '../../database/db';

export default function Settings() {
    const { user } = useAuthStore();
    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [storePhone, setStorePhone] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('store_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            setStoreName(parsed.name || '');
            setStoreAddress(parsed.address || '');
            setStorePhone(parsed.phone || '');
        }
    }, []);

    const handleSaveProfile = () => {
        const settings = { name: storeName, address: storeAddress, phone: storePhone };
        localStorage.setItem('store_settings', JSON.stringify(settings));
        alert('Store profile saved!');
    };

    const handleBackup = () => {
        try {
            saveDatabase(); // Ensure latest is saved to localStorage first
            const db = getDatabase();
            const data = db.export();
            const blob = new Blob([data as unknown as BlobPart], { type: 'application/x-sqlite3' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `supermarket_backup_${new Date().toISOString().split('T')[0]}.db`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Failed to create backup.');
        }
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('WARNING: This will overwrite the current database with the backup. All current data will be lost. Continue?')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const buffer = event.target?.result as ArrayBuffer;
                const uint8 = new Uint8Array(buffer);

                // We need to re-init the DB with this data
                // This is a bit hacky: we save to localStorage then reload the page
                const base64 = btoa(
                    new Uint8Array(buffer)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                localStorage.setItem('supermarket_pro_db', base64);

                alert('Database restored successfully. The application will now reload.');
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert('Failed to restore database. Invalid file format.');
            }
        };
        reader.readAsArrayBuffer(file);
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

    return (
        <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="border-b border-[var(--color-border)] pb-4">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">System configuration and maintenance</p>
            </div>

            {/* Store Profile */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Store Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--color-bg-card)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Store Name</label>
                            <input
                                type="text"
                                value={storeName}
                                onChange={e => setStoreName(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] border border-[var(--color-border)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Phone Number</label>
                            <input
                                type="text"
                                value={storePhone}
                                onChange={e => setStorePhone(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] border border-[var(--color-border)]"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Address</label>
                            <textarea
                                value={storeAddress}
                                onChange={e => setStoreAddress(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] border border-[var(--color-border)] resize-none"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSaveProfile} icon={<Save size={16} />}>Save Profile</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Database Management */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Database Management</h2>
                <div className="bg-[var(--color-bg-card)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
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
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".db,.sqlite"
                                    onChange={handleRestore}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button variant="secondary" icon={<Upload size={16} />}>
                                    Restore Data
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
