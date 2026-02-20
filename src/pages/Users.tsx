import { useState, useEffect, useRef } from 'react';
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
    Search,
    X,
} from 'lucide-react';
import { cn, formatDate, formatCurrency, validatePassword, validatePin } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Button from '@/components/common/Button';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, UserInput } from '@/lib/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion } from 'framer-motion';

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
    usePageTitle(t('sidebar.users'));
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState<UserInput & { pin_code?: string }>(defaultForm);
    const [selectedCashier, setSelectedCashier] = useState<User | null>(null);
    const [showPerformance, setShowPerformance] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    const { currentPage, totalPages, startIndex, endIndex, setCurrentPage, paginate, resetPage } = usePagination({
        totalItems: filtered.length,
    });

    useEffect(() => {
        resetPage();
    }, [search, resetPage]);

    const paginatedUsers = paginate(filtered);

    const cashiers = users.filter((u) => u.role === 'cashier');
    const activeSessions = cashierSessions.filter((s) => s.status === 'active').length;
    const todaySessions = cashierSessions.filter(
        (s) => new Date(s.login_time).toDateString() === new Date().toDateString(),
    ).length;

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setForm({
            username: user.username,
            password: '',
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

        if (form.password) {
            const pwResult = validatePassword(form.password, t);
            if (!pwResult.valid) return toast.error(pwResult.message);
        }

        if (form.pin_code) {
            const pinResult = validatePin(form.pin_code, t);
            if (!pinResult.valid) return toast.error(pinResult.message);
        }

        if (editingUser) {
            const updateData: any = { ...form };
            if (!form.password) delete updateData.password;
            if (!form.pin_code) delete updateData.pin_code;

            updateUser(editingUser.id, updateData);
        } else {
            if (!form.password) return toast.error(t('users.password_required'));
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
                return 'bg-rose-100 text-rose-700';
            case 'manager':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-emerald-100 text-emerald-700';
        }
    };

    const inputClass = cn(
        'w-full h-12 px-4 rounded-xl',
        'bg-zinc-50 border border-zinc-200',
        'text-sm font-medium text-black placeholder:text-zinc-400',
        'focus:outline-none focus:border-zinc-400 focus:bg-white',
        'transition-all duration-300',
    );

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <Shield size={64} className="mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-black">{t('users.access_denied')}</h2>
                <p className="text-sm">{t('users.admin_only')}</p>
            </div>
        );
    }

    const [selectedCashierPerf, setSelectedCashierPerf] = useState<{
        total_sessions: number;
        total_sales: number;
        total_transactions: number;
        average_sale: number;
        total_hours: number;
    } | null>(null);

    useEffect(() => {
        if (!selectedCashier) {
            setSelectedCashierPerf(null);
            return;
        }
        let cancelled = false;
        getCashierPerformance(selectedCashier.id).then((perf) => {
            if (!cancelled) setSelectedCashierPerf(perf);
        });
        return () => {
            cancelled = true;
        };
    }, [selectedCashier, getCashierPerformance]);

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4">
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

            <div className="relative z-10 flex-1 flex flex-col min-w-0 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.users')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('users.title')}
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md border border-black shadow-lg shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95"
                        >
                            <UserPlus size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {t('users.add_user')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('users.stat_total')}
                            </span>
                            <div className="p-2 bg-zinc-100 rounded-full">
                                <UsersIcon size={14} className="text-zinc-500" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-black tracking-tighter">{users.length}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-emerald-100 border-2 border-emerald-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">
                                {t('users.stat_cashiers')}
                            </span>
                            <div className="p-2 bg-emerald-500/10 rounded-full">
                                <DollarSign size={14} className="text-emerald-700" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-emerald-800 tracking-tighter">
                                {cashiers.length}
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                {t('users.stat_active_sessions')}
                            </span>
                            <div className="p-2 bg-black/5 rounded-full">
                                <Clock size={14} className="text-black" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-black tracking-tighter">{activeSessions}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-black text-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-24 bg-zinc-800 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('users.stat_today_sessions')}
                            </span>
                            <div className="p-2 bg-white/10 rounded-full">
                                <TrendingUp size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-white tracking-tighter">{todaySessions}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Search Bar */}
                <div className="relative group mb-6">
                    <Search
                        size={22}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('users.search_placeholder')}
                        className={cn(
                            'w-full pl-16 pr-16 py-4 rounded-2xl',
                            'bg-white border border-zinc-200 shadow-none',
                            'text-black placeholder:text-zinc-300 text-base font-bold',
                            'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
                        )}
                    />
                    {search && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => {
                                setSearch('');
                                searchInputRef.current?.focus();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                        >
                            <X size={16} strokeWidth={3} />
                        </motion.button>
                    )}
                </div>

                {/* Users Table */}
                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
                    <table className="w-full" dir="auto">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('users.col_user')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('users.col_role')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('users.col_pin')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('users.col_status')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('users.col_last_login')}
                                </th>
                                <th className="px-6 py-4 rtl:text-left ltr:text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('users.col_actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-black">{user.full_name}</p>
                                                <p className="text-xs text-zinc-400">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={cn(
                                                'inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                                getRoleColor(user.role),
                                            )}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'cashier' ? (
                                            <div className="flex items-center gap-2">
                                                <Lock size={14} className="text-zinc-300" />
                                                <span className="text-sm text-zinc-500">
                                                    {user.has_pin ? '••••' : t('users.no_pin')}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-zinc-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_active ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-bold text-emerald-600 uppercase">
                                                    {t('users.status_active')}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                                                <span className="text-xs font-bold text-zinc-400 uppercase">
                                                    {t('users.status_inactive')}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-zinc-500">
                                            {user.last_login ? formatDate(user.last_login) : t('users.never_logged')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.role === 'cashier' && (
                                                <button
                                                    onClick={() => handleViewPerformance(user)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-orange-100 hover:text-orange-600 transition-all"
                                                    title={t('users.view_performance')}
                                                >
                                                    <BarChart3 size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-blue-100 hover:text-blue-600 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            {user.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-rose-100 hover:text-rose-600 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="px-6 pb-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filtered.length}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            onPageChange={setCurrentPage}
                            itemLabel={t('users.title')}
                        />
                    </div>
                </div>
            </div>

            {/* User Form Modal */}
            <Dialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    if (!open) handleCloseForm();
                }}
            >
                <DialogContent className="max-w-md rounded-[2rem] p-6 bg-white border border-zinc-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-black tracking-tight">
                            {editingUser ? t('users.form_edit_title') : t('users.form_add_title')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-1">
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
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-1">
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
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-1">
                                {editingUser ? t('users.label_password_edit') : t('users.label_password')}{' '}
                                {!editingUser && '*'}
                            </label>
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
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-1">
                                {t('users.label_role')} *
                            </label>
                            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                                <SelectTrigger className={cn(inputClass, '!ring-0 flex items-center')}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cashier">{t('users.role_cashier')}</SelectItem>
                                    <SelectItem value="manager">{t('users.role_manager')}</SelectItem>
                                    <SelectItem value="admin">{t('users.role_admin')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {form.role === 'cashier' && (
                            <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-1">
                                    {t('users.label_pin')} {!editingUser && '*'}
                                </label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    minLength={4}
                                    maxLength={6}
                                    value={form.pin_code}
                                    onChange={(e) => setForm({ ...form, pin_code: e.target.value.replace(/\D/g, '') })}
                                    className={inputClass}
                                    placeholder={t('users.placeholder_pin')}
                                    required={!editingUser && form.role === 'cashier'}
                                />
                                <p className="text-xs text-zinc-400 mt-2">{t('users.pin_hint')}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-5 border-t border-zinc-100">
                            <Button variant="secondary" onClick={handleCloseForm} className="rounded-xl px-5">
                                {t('users.cancel')}
                            </Button>
                            <Button type="submit" className="rounded-xl px-5">
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
                <DialogContent className="max-w-2xl rounded-[2rem] p-6 bg-white border border-zinc-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-black tracking-tight">
                            {selectedCashier
                                ? t('users.performance_title', { name: selectedCashier.full_name })
                                : t('users.performance_title', { name: '' })}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedCashier && selectedCashierPerf && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                        {t('users.perf_sessions')}
                                    </span>
                                    <p className="text-2xl font-black text-black mt-1">
                                        {selectedCashierPerf.total_sessions}
                                    </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                        {t('users.perf_sales')}
                                    </span>
                                    <p className="text-2xl font-black text-black mt-1">
                                        {formatCurrency(selectedCashierPerf.total_sales)}
                                    </p>
                                </div>
                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                                        {t('users.perf_transactions')}
                                    </span>
                                    <p className="text-2xl font-black text-black mt-1">
                                        {selectedCashierPerf.total_transactions}
                                    </p>
                                </div>
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                                        {t('users.perf_avg_sale')}
                                    </span>
                                    <p className="text-2xl font-black text-black mt-1">
                                        {formatCurrency(selectedCashierPerf.average_sale)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-black mb-3">{t('users.recent_sessions')}</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {cashierSessions
                                        .filter((s) => s.cashier_id === selectedCashier.id)
                                        .slice(0, 10)
                                        .map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-black">
                                                        {formatDate(session.login_time)}
                                                    </p>
                                                    <p className="text-xs text-zinc-400">
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
                                                    <p className="text-sm font-bold text-black">
                                                        {formatCurrency(session.opening_cash)}
                                                    </p>
                                                    <p className="text-xs text-zinc-400">{t('users.opening_cash')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    {cashierSessions.filter((s) => s.cashier_id === selectedCashier.id).length ===
                                        0 && <p className="text-center text-zinc-400 py-4">{t('users.no_sessions')}</p>}
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
