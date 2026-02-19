import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users as UsersIcon,
    UserPlus,
    Edit2,
    Trash2,
    Shield,
    CheckCircle,
    XCircle,
    Lock,
    TrendingUp,
    Clock,
    DollarSign,
    BarChart3,
} from 'lucide-react';
import { cn, formatDate, formatCurrency, validatePassword, validatePin } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { useAuthStore } from '@/stores/useAuthStore';
import SearchInput from '@/components/common/SearchInput';
import Button from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { User, UserInput } from '@/lib/types';

const defaultForm: UserInput & { pin_code?: string } = {
    username: '',
    password: '',
    full_name: '',
    role: 'cashier',
    pin_code: '',
};

export default function Users() {
    const {
        users,
        loadUsers,
        addUser,
        updateUser,
        deleteUser,
        loadCashierSessions,
        cashierSessions,
        getCashierPerformance,
    } = useUserStore();
    const { user: currentUser } = useAuthStore();
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState<UserInput & { pin_code?: string }>(defaultForm);
    const [selectedCashier, setSelectedCashier] = useState<User | null>(null);
    const [showPerformance, setShowPerformance] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    useEffect(() => {
        loadUsers();
        loadCashierSessions();
    }, [loadUsers, loadCashierSessions]);

    const filtered = users.filter(
        (u) =>
            !search ||
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()),
    );

    const cashiers = users.filter((u) => u.role === 'cashier');

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setForm({
            username: user.username,
            password: '', // Don't fill password
            full_name: user.full_name,
            role: user.role,
            pin_code: '',
        });
        setIsFormOpen(true);
    };

    const handleViewPerformance = (user: User) => {
        setSelectedCashier(user);
        loadCashierSessions(user.id);
        setShowPerformance(true);
    };

    const handleDelete = (id: number) => {
        setDeleteTargetId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (deleteTargetId !== null) {
            deleteUser(deleteTargetId);
        }
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.full_name) return;

        // Validate password when provided
        if (form.password) {
            const pwResult = validatePassword(form.password);
            if (!pwResult.valid) return toast.error(pwResult.message);
        }

        // Validate PIN when provided
        if (form.pin_code) {
            const pinResult = validatePin(form.pin_code);
            if (!pinResult.valid) return toast.error(pinResult.message);
        }

        if (editingUser) {
            // If password is empty, don't update it
            const updateData: any = { ...form };
            if (!form.password) delete updateData.password;
            if (!form.pin_code) delete updateData.pin_code;

            updateUser(editingUser.id, updateData);
        } else {
            if (!form.password) return toast.error('Password is required for new users');
            addUser(form);
        }
        handleCloseForm();
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingUser(null);
        setForm(defaultForm);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'text-red-400 bg-red-500/10';
            case 'manager':
                return 'text-blue-400 bg-blue-500/10';
            default:
                return 'text-emerald-400 bg-emerald-500/10';
        }
    };

    const inputClass = cn(
        'w-full px-3 py-2.5 rounded-lg',
        'bg-[var(--color-bg-input)] border border-[var(--color-border)]',
        'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)]',
        'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
        'transition-all duration-200',
    );

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                <Shield size={64} className="mb-4 opacity-50" />
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{t('users.access_denied')}</h2>
                <p>{t('users.admin_only')}</p>
            </div>
        );
    }

    const getPerformanceStats = (cashierId: number) => {
        const sessions = cashierSessions.filter((s) => s.cashier_id === cashierId);
        const performance = getCashierPerformance(cashierId);
        return { sessions, performance };
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('users.title')}</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('users.subtitle')}</p>
                </div>
                <Button className="btn-page-action" onClick={() => setIsFormOpen(true)} icon={<UserPlus size={16} />}>
                    {t('users.add_user')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">{t('users.stat_total')}</p>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">{t('users.stat_cashiers')}</p>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">{cashiers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">{t('users.stat_active_sessions')}</p>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">
                                {cashierSessions.filter((s) => s.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">{t('users.stat_today_sessions')}</p>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">
                                {
                                    cashierSessions.filter(
                                        (s) => new Date(s.login_time).toDateString() === new Date().toDateString(),
                                    ).length
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('users.search_placeholder')}
                className="w-72"
            />

            {/* Users List */}
            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-card)]">
                <table className="w-full">
                    <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('users.col_user')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('users.col_role')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('users.col_pin')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('users.col_status')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('users.col_last_login')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('users.col_actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {filtered.map((user) => (
                            <tr key={user.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                {user.full_name}
                                            </p>
                                            <p className="text-xs text-[var(--color-text-muted)]">@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            'px-2 py-1 rounded-full text-xs font-medium capitalize',
                                            getRoleColor(user.role),
                                        )}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {user.role === 'cashier' ? (
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} className="text-[var(--color-text-muted)]" />
                                            <span className="text-sm text-[var(--color-text-muted)]">
                                                {user.has_pin ? '••••' : t('users.no_pin')}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-[var(--color-text-placeholder)]">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {user.is_active ? (
                                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                            <CheckCircle size={12} /> {t('users.status_active')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                            <XCircle size={12} /> {t('users.status_inactive')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                                    {user.last_login ? formatDate(user.last_login) : t('users.never_logged')}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        {user.role === 'cashier' && (
                                            <button
                                                onClick={() => handleViewPerformance(user)}
                                                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-orange-500/10 hover:text-orange-400"
                                                title={t('users.view_performance')}
                                            >
                                                <BarChart3 size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-blue-500/10 hover:text-blue-400"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {user.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-red-400"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Form Modal */}
            <Dialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    if (!open) handleCloseForm();
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? t('users.form_edit_title') : t('users.form_add_title')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                {t('users.label_full_name')} *
                            </label>
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                className={inputClass}
                                placeholder={t('users.placeholder_full_name')}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                {t('users.label_username')} *
                            </label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className={inputClass}
                                placeholder={t('users.placeholder_username')}
                                required
                                disabled={!!editingUser}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block"></label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className={inputClass}
                                placeholder={
                                    editingUser
                                        ? t('users.placeholder_password_edit')
                                        : t('users.placeholder_password_new')
                                }
                                required={!editingUser}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                {t('users.label_role')} *
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                                className={inputClass}
                            >
                                <option value="cashier">{t('users.role_cashier')}</option>
                                <option value="manager">{t('users.role_manager')}</option>
                                <option value="admin">{t('users.role_admin')}</option>
                            </select>
                        </div>
                        {form.role === 'cashier' && (
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block"></label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={form.pin_code}
                                    onChange={(e) => setForm({ ...form, pin_code: e.target.value.replace(/\D/g, '') })}
                                    className={inputClass}
                                    placeholder={t('users.placeholder_pin')}
                                    required={!editingUser && form.role === 'cashier'}
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('users.pin_hint')}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                            <Button variant="secondary" onClick={handleCloseForm}>
                                {t('users.cancel')}
                            </Button>
                            <Button type="submit">
                                {editingUser ? t('users.update_user') : t('users.create_user')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Cashier Performance Modal */}
            <Dialog
                open={showPerformance}
                onOpenChange={(open) => {
                    if (!open) setShowPerformance(false);
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCashier
                                ? t('users.performance_title', { name: selectedCashier.full_name })
                                : t('users.performance_title', { name: '' })}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedCashier && (
                        <div className="space-y-6">
                            {/* Performance Stats */}
                            {(() => {
                                const { performance } = getPerformanceStats(selectedCashier.id);
                                return (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                            <p className="text-xs text-emerald-400 mb-1">{t('users.perf_sessions')}</p>
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                                {performance.total_sessions}
                                            </p>
                                        </div>
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                            <p className="text-xs text-blue-400 mb-1">{t('users.perf_sales')}</p>
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                                {formatCurrency(performance.total_sales)}
                                            </p>
                                        </div>
                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                            <p className="text-xs text-purple-400 mb-1">
                                                {t('users.perf_transactions')}
                                            </p>
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                                {performance.total_transactions}
                                            </p>
                                        </div>
                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                                            <p className="text-xs text-orange-400 mb-1">{t('users.perf_avg_sale')}</p>
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                                {formatCurrency(performance.average_sale)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Recent Sessions */}
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                                    {t('users.recent_sessions')}
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {cashierSessions
                                        .filter((s) => s.cashier_id === selectedCashier.id)
                                        .slice(0, 10)
                                        .map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]"
                                            >
                                                <div>
                                                    <p className="text-sm text-[var(--color-text-primary)]">
                                                        {formatDate(session.login_time)}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {session.status === 'active'
                                                            ? t('users.session_active')
                                                            : t('users.session_closed', {
                                                                  time: session.logout_time
                                                                      ? formatDate(session.logout_time)
                                                                      : t('users.session_unknown'),
                                                              })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-[var(--color-text-primary)]">
                                                        {formatCurrency(session.opening_cash)}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {t('users.opening_cash')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    {cashierSessions.filter((s) => s.cashier_id === selectedCashier.id).length ===
                                        0 && (
                                        <p className="text-center text-[var(--color-text-muted)] py-4">
                                            {t('users.no_sessions')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetId(null);
                }}
                onConfirm={confirmDelete}
                title={t('users.deactivate_title')}
                description={t('users.deactivate_description')}
                confirmLabel={t('users.deactivate_btn')}
                variant="danger"
            />
        </div>
    );
}
