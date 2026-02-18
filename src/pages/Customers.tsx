import { useState, useEffect } from 'react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Trash2, Edit, Phone, Mail, MapPin, Award } from 'lucide-react';
import Button from '@/components/common/Button';
import CustomerModal from '@/components/customers/CustomerModal';
import { cn, formatCurrency } from '@/lib/utils';
import type { Customer } from '@/lib/types';

export default function Customers() {
    const { t } = useTranslation();
    const { customers, loadCustomers, deleteCustomer, isLoadingCustomers } = useCustomerStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            await deleteCustomer(id);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Manage your customer database and loyalty program.
                    </p>
                </div>
                <Button
                    variant="primary"
                    icon={<Plus size={18} />}
                    onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
                >
                    Add Customer
                </Button>
            </div>

            {/* Content */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="p-4 border-b border-neutral-800 flex items-center gap-4 bg-neutral-900/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-neutral-600 transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-800/50 text-zinc-400 border-b border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Loyalty</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Debt</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {isLoadingCustomers ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        Loading customers...
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="group hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                                                    {customer.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{customer.full_name}</p>
                                                    {customer.address && (
                                                        <div className="flex items-center gap-1 text-zinc-500 text-xs mt-0.5">
                                                            <MapPin size={10} />
                                                            <span className="truncate max-w-[150px]">{customer.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {customer.phone && (
                                                    <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                                                        <Phone size={12} className="text-zinc-500" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                                                        <Mail size={12} className="text-zinc-500" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Award size={16} className="text-yellow-500" />
                                                <span className="text-white font-medium">{customer.loyalty_points}</span>
                                                <span className="text-zinc-500 text-xs">pts</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "font-bold",
                                                (customer.total_debt || 0) > 0 ? "text-red-500" : "text-zinc-500"
                                            )}>
                                                {formatCurrency(customer.total_debt || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Modal */}
            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedCustomer(null); }}
                customer={selectedCustomer}
            />
        </div>
    );
}
