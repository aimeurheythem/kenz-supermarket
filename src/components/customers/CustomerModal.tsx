import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import Button from '@/components/common/Button';
import { useCustomerStore } from '@/stores/useCustomerStore';
import type { Customer, CustomerInput } from '@/lib/types';
import { cn } from '@/lib/utils'; // Assuming you have this utility

interface CustomerModalProps {
    customer?: Customer | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function CustomerModal({ customer, isOpen, onClose }: CustomerModalProps) {
    const { addCustomer, updateCustomer } = useCustomerStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CustomerInput>({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        loyalty_points: 0
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                full_name: customer.full_name,
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                notes: customer.notes || '',
                loyalty_points: customer.loyalty_points
            });
        } else {
            setFormData({
                full_name: '',
                phone: '',
                email: '',
                address: '',
                notes: '',
                loyalty_points: 0
            });
        }
    }, [customer, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (customer) {
                await updateCustomer(customer.id, formData);
            } else {
                await addCustomer(formData);
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save customer');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">
                        {customer ? 'Edit Customer' : 'New Customer'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-4">

                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name *</label>
                            <input
                                required
                                type="text"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder:text-zinc-600"
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        {/* Contact Info Group */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder:text-zinc-600"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder:text-zinc-600"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        {/* Address Input */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Address</label>
                            <input
                                type="text"
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder:text-zinc-600"
                                placeholder="Street, City, Zip"
                            />
                        </div>

                        {/* Loyalty Points */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Loyalty Points</label>
                            <input
                                type="number"
                                value={formData.loyalty_points}
                                onChange={e => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) || 0 })}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Notes</label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder:text-zinc-600 min-h-[80px] resize-none"
                                placeholder="Internal notes about this customer..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                            icon={isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        >
                            {customer ? 'Update Customer' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
