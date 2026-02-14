import { useState, useEffect } from 'react';
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
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { useAuthStore } from '@/stores/useAuthStore';
import SearchInput from '@/components/common/SearchInput';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import type { User, UserInput } from '@/lib/types';

const defaultForm: UserInput & { pin_code?: string } = {
    username: '',
    password: '',
    full_name: '',
    role: 'cashier',
    pin_code: '',
};

export default function Users() {
    const { users, loadUsers, addUser, updateUser, deleteUser, loadCashierSessions, cashierSessions, getCashierPerformance } = useUserStore();
    const { user: currentUser } = useAuthStore();
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState<UserInput & { pin_code?: string }>(defaultForm);
    const [selectedCashier, setSelectedCashier] = useState<User | null>(null);
    const [showPerformance, setShowPerformance] = useState(false);

    useEffect(() => {
        loadUsers();
        loadCashierSessions();
    }, []);

    const filtered = users.filter(
        (u) =>
            !search ||
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase())
    );

    const cashiers = users.filter(u => u.role === 'cashier');

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setForm({
            username: user.username,
            password: '', // Don't fill password
            full_name: user.full_name,
            role: user.role,
            pin_code: user.pin_code || '',
        });
        setIsFormOpen(true);
    };

    const handleViewPerformance = (user: User) => {
        setSelectedCashier(user);
        loadCashierSessions(user.id);
        setShowPerformance(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to deactivate this user?')) {
            deleteUser(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.full_name) return;

        if (editingUser) {
            // If password is empty, don't update it
            const updateData: any = { ...form };
            if (!form.password) delete updateData.password;
            if (!form.pin_code) delete updateData.pin_code;

            updateUser(editingUser.id, updateData);
        } else {
            if (!form.password) return alert('Password is required for new users');
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
            case 'admin': return 'text-red-400 bg-red-500/10';
            case 'manager': return 'text-blue-400 bg-blue-500/10';
            default: return 'text-emerald-400 bg-emerald-500/10';
        }
    };

    const inputClass = cn(
        'w-full px-3 py-2.5 rounded-lg',
        'bg-neutral-800 border border-neutral-700',
        'text-sm text-white placeholder:text-zinc-500',
        'focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500',
        'transition-all duration-200'
    );

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <Shield size={64} className="mb-4 opacity-50" />
                <h2 className="text-xl font-semibold text-white">Access Denied</h2>
                <p>Only administrators can manage users.</p>
            </div>
        );
    }

    const getPerformanceStats = (cashierId: number) => {
        const sessions = cashierSessions.filter(s => s.cashier_id === cashierId);
        const performance = getCashierPerformance(cashierId);
        return { sessions, performance };
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Manage staff access, roles, and track cashier performance
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)} icon={<UserPlus size={16} />}>
                    Add User
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Total Users</p>
                            <p className="text-xl font-bold text-white">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Cashiers</p>
                            <p className="text-xl font-bold text-white">{cashiers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Active Sessions</p>
                            <p className="text-xl font-bold text-white">{cashierSessions.filter(s => s.status === 'active').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Today's Sessions</p>
                            <p className="text-xl font-bold text-white">
                                {cashierSessions.filter(s => new Date(s.login_time).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="w-72" />

            {/* Users List */}
            <div className="rounded-xl border border-neutral-700 overflow-hidden bg-neutral-800">
                <table className="w-full">
                    <thead className="bg-neutral-800 border-b border-neutral-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">PIN Code</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Last Login</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700">
                        {filtered.map(user => (
                            <tr key={user.id} className="hover:bg-neutral-700/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{user.full_name}</p>
                                            <p className="text-xs text-zinc-500">@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", getRoleColor(user.role))}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {user.role === 'cashier' ? (
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} className="text-zinc-500" />
                                            <span className="text-sm text-zinc-400">
                                                {user.pin_code ? '••••' : 'No PIN'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-zinc-600">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {user.is_active ? (
                                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                            <CheckCircle size={12} /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                            <XCircle size={12} /> Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-zinc-400">
                                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        {user.role === 'cashier' && (
                                            <button
                                                onClick={() => handleViewPerformance(user)}
                                                className="p-1.5 rounded-lg text-zinc-400 hover:bg-orange-500/10 hover:text-orange-400"
                                                title="View Performance"
                                            >
                                                <BarChart3 size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:bg-blue-500/10 hover:text-blue-400"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {user.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1.5 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
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
            <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingUser ? 'Edit User' : 'Add New User'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Full Name *</label>
                        <input 
                            type="text" 
                            value={form.full_name} 
                            onChange={e => setForm({ ...form, full_name: e.target.value })} 
                            className={inputClass} 
                            placeholder="Enter full name"
                            required 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Username *</label>
                        <input 
                            type="text" 
                            value={form.username} 
                            onChange={e => setForm({ ...form, username: e.target.value })} 
                            className={inputClass} 
                            placeholder="Enter username"
                            required 
                            disabled={!!editingUser} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                            {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                        </label>
                        <input 
                            type="password" 
                            value={form.password} 
                            onChange={e => setForm({ ...form, password: e.target.value })} 
                            className={inputClass} 
                            placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                            required={!editingUser} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Role *</label>
                        <select 
                            value={form.role} 
                            onChange={e => setForm({ ...form, role: e.target.value as any })} 
                            className={inputClass}
                        >
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    {form.role === 'cashier' && (
                        <div>
                            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                                {editingUser ? 'PIN Code (4-6 digits, leave blank to keep current)' : 'PIN Code * (4-6 digits for quick login)'}
                            </label>
                            <input 
                                type="password" 
                                inputMode="numeric"
                                maxLength={6}
                                value={form.pin_code} 
                                onChange={e => setForm({ ...form, pin_code: e.target.value.replace(/\D/g, '') })} 
                                className={inputClass} 
                                placeholder="Enter 4-6 digit PIN"
                                required={!editingUser && form.role === 'cashier'} 
                            />
                            <p className="text-xs text-zinc-500 mt-1">Cashiers use this PIN for quick login at the POS</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t border-neutral-700">
                        <Button variant="secondary" onClick={handleCloseForm}>Cancel</Button>
                        <Button type="submit">{editingUser ? 'Update User' : 'Create User'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Cashier Performance Modal */}
            <Modal 
                isOpen={showPerformance} 
                onClose={() => setShowPerformance(false)} 
                title={selectedCashier ? `${selectedCashier.full_name} - Performance` : 'Cashier Performance'}
                maxWidth="max-w-2xl"
            >
                {selectedCashier && (
                    <div className="space-y-6">
                        {/* Performance Stats */}
                        {(() => {
                            const { performance } = getPerformanceStats(selectedCashier.id);
                            return (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                        <p className="text-xs text-emerald-400 mb-1">Total Sessions</p>
                                        <p className="text-2xl font-bold text-white">{performance.total_sessions}</p>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                        <p className="text-xs text-blue-400 mb-1">Total Sales</p>
                                        <p className="text-2xl font-bold text-white">{formatCurrency(performance.total_sales)}</p>
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                        <p className="text-xs text-purple-400 mb-1">Transactions</p>
                                        <p className="text-2xl font-bold text-white">{performance.total_transactions}</p>
                                    </div>
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                                        <p className="text-xs text-orange-400 mb-1">Avg Sale</p>
                                        <p className="text-2xl font-bold text-white">{formatCurrency(performance.average_sale)}</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Recent Sessions */}
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-3">Recent Sessions</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {cashierSessions
                                    .filter(s => s.cashier_id === selectedCashier.id)
                                    .slice(0, 10)
                                    .map(session => (
                                        <div 
                                            key={session.id} 
                                            className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg border border-neutral-700"
                                        >
                                            <div>
                                                <p className="text-sm text-white">
                                                    {formatDate(session.login_time)}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {session.status === 'active' ? 'Active' : `Closed - ${session.logout_time ? formatDate(session.logout_time) : 'Unknown'}`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-white">{formatCurrency(session.opening_cash)}</p>
                                                <p className="text-xs text-zinc-500">Opening Cash</p>
                                            </div>
                                        </div>
                                    ))}
                                {cashierSessions.filter(s => s.cashier_id === selectedCashier.id).length === 0 && (
                                    <p className="text-center text-zinc-500 py-4">No sessions recorded yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
