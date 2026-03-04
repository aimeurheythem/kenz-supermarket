// CashierSettings.tsx — Cashier-specific settings page (language, display, receipt prefs)
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Globe, User, Receipt, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, selectSetting } from '@/stores/useSettingsStore';
import { useLanguageSwitch, languages } from '@/hooks/useLanguageSwitch';
import { cn } from '@/lib/utils';

export default function CashierSettings() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, updateProfile } = useAuthStore();
    const { updateSettings } = useSettingsStore();
    const { currentLang, changeLanguage } = useLanguageSwitch();

    const receiptAutoprint = useSettingsStore(selectSetting('receipt.autoprint', 'false'));
    const soundEnabled = useSettingsStore(selectSetting('pos.sound', 'true'));

    const [displayName, setDisplayName] = useState(user?.full_name ?? '');
    const [autoprint, setAutoprint] = useState(receiptAutoprint === 'true');
    const [sound, setSound] = useState(soundEnabled === 'true');
    const [saving, setSaving] = useState(false);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            // Update display name
            if (displayName.trim() && displayName !== user?.full_name) {
                await updateProfile({ full_name: displayName.trim() });
            }
            // Update preferences
            await updateSettings({
                'receipt.autoprint': autoprint ? 'true' : 'false',
                'pos.sound': sound ? 'true' : 'false',
            });
            toast.success(t('settings.saved_success', 'Settings saved'));
        } catch {
            toast.error(t('settings.save_error', 'Failed to save settings'));
        } finally {
            setSaving(false);
        }
    }, [displayName, user, autoprint, sound, updateProfile, updateSettings, t]);

    return (
        <div className="h-screen w-screen flex flex-col bg-zinc-50 overflow-hidden">
            {/* Top bar */}
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/pos')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        {t('pos.back_to_pos', 'Back to POS')}
                    </motion.button>
                    <h1 className="text-base font-bold text-zinc-800">
                        {t('pos.cashier_settings', 'My Settings')}
                    </h1>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white font-bold text-sm rounded-xl transition-colors"
                >
                    {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </motion.button>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="max-w-2xl mx-auto p-6 space-y-6">

                    {/* Language Section */}
                    <Section icon={<Globe size={18} />} title={t('pos.cashier_settings_lang', 'Language')}>
                        <div className="grid grid-cols-3 gap-3">
                            {languages.map((lang) => (
                                <motion.button
                                    key={lang.code}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={cn(
                                        'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                                        currentLang === lang.code
                                            ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                                            : 'border-zinc-200 bg-white hover:border-zinc-300',
                                    )}
                                >
                                    <span className="text-2xl font-black text-zinc-400">{lang.flag}</span>
                                    <span className={cn(
                                        'text-sm font-semibold',
                                        currentLang === lang.code ? 'text-emerald-700' : 'text-zinc-600',
                                    )}>
                                        {lang.label}
                                    </span>
                                    <AnimatePresence>
                                        {currentLang === lang.code && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                                            >
                                                <Check size={12} className="text-white" strokeWidth={3} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            ))}
                        </div>
                    </Section>

                    {/* Profile Section */}
                    <Section icon={<User size={18} />} title={t('pos.cashier_settings_profile', 'Display Name')}>
                        <div className="space-y-2">
                            <p className="text-xs text-zinc-400">
                                {t('pos.cashier_settings_profile_hint', 'This name appears on receipts and in the POS header.')}
                            </p>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                                placeholder={t('pos.cashier_settings_name_placeholder', 'Your display name')}
                            />
                            <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-100 font-mono text-zinc-500">
                                    {user?.role ?? 'cashier'}
                                </span>
                                <span>@{user?.username}</span>
                            </div>
                        </div>
                    </Section>

                    {/* Receipt Preferences */}
                    <Section icon={<Receipt size={18} />} title={t('pos.cashier_settings_receipt', 'Preferences')}>
                        <div className="space-y-4">
                            <ToggleRow
                                label={t('pos.cashier_settings_autoprint', 'Auto-print receipt after sale')}
                                description={t('pos.cashier_settings_autoprint_hint', 'Automatically send receipt to printer when checkout completes.')}
                                value={autoprint}
                                onChange={setAutoprint}
                            />
                            <ToggleRow
                                label={t('pos.cashier_settings_sound', 'POS sound effects')}
                                description={t('pos.cashier_settings_sound_hint', 'Play sounds on scan, checkout, and errors.')}
                                value={sound}
                                onChange={setSound}
                            />
                        </div>
                    </Section>

                </div>
            </main>
        </div>
    );
}

/* ── Helper Components ── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
        >
            <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                <span className="text-zinc-500">{icon}</span>
                <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </motion.div>
    );
}

function ToggleRow({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className="w-full flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors text-left"
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-700">{label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
            </div>
            <div
                className={cn(
                    'w-11 h-6 rounded-full transition-colors relative shrink-0',
                    value ? 'bg-emerald-500' : 'bg-zinc-300',
                )}
            >
                <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                    style={{ left: value ? '22px' : '2px' }}
                />
            </div>
        </button>
    );
}
