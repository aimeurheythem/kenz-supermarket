import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Shield,
    Lock,
    Key,
    Smartphone,
    Eye,
    EyeOff,
    Monitor,
    Clock,
    Trash2,
    LogOut,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn, validatePassword } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import AccountTab from '@/components/settings/AccountTab';
import { usePageTitle } from '@/hooks/usePageTitle';

type TabId = 'password' | 'sessions' | 'history' | 'devices' | 'delete';

interface Session {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    current: boolean;
}

interface LoginHistory {
    id: string;
    date: string;
    time: string;
    device: string;
    browser: string;
    location: string;
    status: 'success' | 'failed';
}

export default function Security() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.security'));
    const { user, changePassword } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabId>('password');

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const mockSessions: Session[] = [
        {
            id: '1',
            device: 'Windows PC',
            browser: 'Chrome 120',
            location: 'Current Session',
            lastActive: 'Now',
            current: true,
        },
        {
            id: '2',
            device: 'MacBook Pro',
            browser: 'Safari 17',
            location: 'Casablanca, Morocco',
            lastActive: '2 hours ago',
            current: false,
        },
        {
            id: '3',
            device: 'iPhone 14',
            browser: 'Safari Mobile',
            location: 'Casablanca, Morocco',
            lastActive: 'Yesterday',
            current: false,
        },
    ];

    const mockLoginHistory: LoginHistory[] = [
        {
            id: '1',
            date: '2024-01-15',
            time: '10:30 AM',
            device: 'Windows PC',
            browser: 'Chrome 120',
            location: 'Casablanca, Morocco',
            status: 'success',
        },
        {
            id: '2',
            date: '2024-01-15',
            time: '09:15 AM',
            device: 'Windows PC',
            browser: 'Chrome 120',
            location: 'Casablanca, Morocco',
            status: 'success',
        },
        {
            id: '3',
            date: '2024-01-14',
            time: '04:45 PM',
            device: 'MacBook Pro',
            browser: 'Safari 17',
            location: 'Casablanca, Morocco',
            status: 'success',
        },
        {
            id: '4',
            date: '2024-01-14',
            time: '02:30 PM',
            device: 'Unknown',
            browser: 'Unknown',
            location: 'Rabat, Morocco',
            status: 'failed',
        },
        {
            id: '5',
            date: '2024-01-13',
            time: '11:00 AM',
            device: 'iPhone 14',
            browser: 'Safari Mobile',
            location: 'Casablanca, Morocco',
            status: 'success',
        },
        {
            id: '6',
            date: '2024-01-12',
            time: '03:20 PM',
            device: 'Windows PC',
            browser: 'Firefox 121',
            location: 'Casablanca, Morocco',
            status: 'success',
        },
    ];

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.error(t('settings.password_mismatch'));
            return;
        }
        const validation = validatePassword(passwords.new, t);
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
            const { resetAllData } = await import('../../database/db');
            await resetAllData(user!.id, user!.full_name);
            localStorage.removeItem('auth-storage');
            const { logout: doLogout } = useAuthStore.getState();
            doLogout();
        } catch (error) {
            console.error('Failed to delete account:', error);
            setDeleteError('Failed to delete account. Please try again.');
            setDeleteLoading(false);
        }
    };

    const handleTerminateSession = (sessionId: string) => {
        toast.success('Session terminated successfully');
    };

    const handleTerminateAllSessions = () => {
        toast.success('All other sessions terminated successfully');
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <Shield size={64} className="mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-black">{t('settings.access_denied')}</h2>
                <p className="text-sm">{t('settings.admin_only')}</p>
            </div>
        );
    }

    const tabs = [
        { id: 'password' as TabId, label: t('security.tab_password') || 'Password', icon: Lock },
        { id: 'sessions' as TabId, label: t('security.tab_sessions') || 'Sessions', icon: Monitor },
        { id: 'history' as TabId, label: t('security.tab_history') || 'Login History', icon: Clock },
        { id: 'devices' as TabId, label: t('security.tab_devices') || 'Devices', icon: Smartphone },
        { id: 'delete' as TabId, label: t('security.tab_delete') || 'Delete Account', icon: Trash2 },
    ];

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4 max-w-5xl mx-auto">
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
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.security')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('security.title') || 'Security Settings'}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
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

                        <div className="flex-1 p-6">
                            {activeTab === 'password' && (
                                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn space-y-8">
                                    <div>
                                        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                                            <Lock size={20} className="text-red-500" />
                                            {t('security.change_password')}
                                        </h2>
                                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                            {t('security.password_desc') ||
                                                'Ensure your account is using a strong password for security.'}
                                        </p>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                                                    {t('settings.label_current_password')}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? 'text' : 'password'}
                                                        value={passwords.current}
                                                        onChange={(e) =>
                                                            setPasswords({ ...passwords, current: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                                    >
                                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                                                    {t('settings.label_new_password')}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        value={passwords.new}
                                                        onChange={(e) =>
                                                            setPasswords({ ...passwords, new: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                                    >
                                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                                                    {t('settings.label_confirm_password')}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        value={passwords.confirm}
                                                        onChange={(e) =>
                                                            setPasswords({ ...passwords, confirm: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handlePasswordChange}
                                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <Lock size={16} />
                                                {t('settings.change_password_btn')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-[var(--color-border)]" />

                                    <div>
                                        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                                            <Key size={20} className="text-blue-600" />
                                            {t('security.password_requirements') || 'Password Requirements'}
                                        </h2>
                                        <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                {t('security.req_length') || 'At least 8 characters long'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                {t('security.req_uppercase') || 'Contains uppercase letter'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                {t('security.req_lowercase') || 'Contains lowercase letter'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                {t('security.req_number') || 'Contains a number'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                {t('security.req_special') || 'Contains special character'}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <Monitor size={20} className="text-blue-600" />
                                                {t('security.active_sessions') || 'Active Sessions'}
                                            </h2>
                                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                                {t('security.sessions_desc') ||
                                                    'Manage your active sessions across devices.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleTerminateAllSessions}
                                            className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            {t('security.terminate_all') || 'Terminate All'}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {mockSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    'p-4 rounded-xl border transition-all',
                                                    session.current
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-white border-zinc-100 hover:border-zinc-300',
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                                                session.current
                                                                    ? 'bg-green-100 text-green-600'
                                                                    : 'bg-zinc-100 text-zinc-600',
                                                            )}
                                                        >
                                                            <Monitor size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-black">
                                                                    {session.device}
                                                                </span>
                                                                {session.current && (
                                                                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                                                                        {t('security.current') || 'Current'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-[var(--color-text-muted)]">
                                                                {session.browser} • {session.location}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-[var(--color-text-muted)]">
                                                            {session.lastActive}
                                                        </span>
                                                        {!session.current && (
                                                            <button
                                                                onClick={() => handleTerminateSession(session.id)}
                                                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <LogOut size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn space-y-6">
                                    <div>
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            <Clock size={20} className="text-blue-600" />
                                            {t('security.login_history') || 'Login History'}
                                        </h2>
                                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                            {t('security.history_desc') || 'View your recent login activity.'}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {mockLoginHistory.map((history) => (
                                            <div
                                                key={history.id}
                                                className={cn(
                                                    'p-4 rounded-xl border transition-all',
                                                    history.status === 'success'
                                                        ? 'bg-white border-zinc-100'
                                                        : 'bg-red-50 border-red-200',
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                                                history.status === 'success'
                                                                    ? 'bg-green-100 text-green-600'
                                                                    : 'bg-red-100 text-red-600',
                                                            )}
                                                        >
                                                            {history.status === 'success' ? (
                                                                <ShieldCheck size={20} />
                                                            ) : (
                                                                <AlertTriangle size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-black">
                                                                    {history.device}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                                                                        history.status === 'success'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : 'bg-red-100 text-red-700',
                                                                    )}
                                                                >
                                                                    {history.status === 'success'
                                                                        ? t('security.success')
                                                                        : t('security.failed')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-[var(--color-text-muted)]">
                                                                {history.browser} • {history.location}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-medium text-black">
                                                            {history.date}
                                                        </span>
                                                        <p className="text-sm text-[var(--color-text-muted)]">
                                                            {history.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'devices' && (
                                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn space-y-6">
                                    <div>
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            <Smartphone size={20} className="text-blue-600" />
                                            {t('security.trusted_devices') || 'Trusted Devices'}
                                        </h2>
                                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                            {t('security.devices_desc') || 'Devices you have logged in from.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border bg-white border-zinc-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                                    <Monitor size={24} />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-black block">Windows PC</span>
                                                    <span className="text-sm text-green-600 font-medium">Active</span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                                                <p>Chrome 120</p>
                                                <p>Casablanca, Morocco</p>
                                                <p>Last active: Now</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border bg-white border-zinc-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                                    <Smartphone size={24} />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-black block">iPhone 14</span>
                                                    <span className="text-sm text-zinc-500 font-medium">
                                                        Last active: Yesterday
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                                                <p>Safari Mobile</p>
                                                <p>Casablanca, Morocco</p>
                                                <p>Last active: Yesterday</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border bg-white border-zinc-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                    <Monitor size={24} />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-black block">MacBook Pro</span>
                                                    <span className="text-sm text-zinc-500 font-medium">
                                                        Last active: 2 hours ago
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                                                <p>Safari 17</p>
                                                <p>Casablanca, Morocco</p>
                                                <p>Last active: 2 hours ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'delete' && (
                                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-red-200 shadow-sm animate-fadeIn space-y-6">
                                    <div>
                                        <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600">
                                            <Trash2 size={20} />
                                            {t('security.danger_zone') || 'Danger Zone'}
                                        </h2>
                                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                            {t('security.danger_description') ||
                                                'Once you delete your account, there is no going back. Please be certain.'}
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
                                                <p className="text-sm font-semibold text-red-700">
                                                    {t('settings.delete_password_prompt')}
                                                </p>
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
                                                <p className="text-sm font-semibold text-red-700">
                                                    {t('settings.delete_confirm_prompt')}
                                                </p>
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
                                                        {deleteLoading
                                                            ? t('settings.deleting')
                                                            : t('settings.confirm_delete')}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowDeleteConfirm(false);
                                                            setDeletePassword('');
                                                            setDeleteConfirmText('');
                                                            setDeleteError('');
                                                        }}
                                                        className="px-5 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg transition-colors border border-zinc-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={false}
                onClose={() => {}}
                onConfirm={() => {}}
                title={t('settings.restore_confirm_title')}
                description={t('settings.restore_confirm_desc')}
                confirmLabel={t('settings.restore_confirm_btn')}
                variant="danger"
            />
        </div>
    );
}
