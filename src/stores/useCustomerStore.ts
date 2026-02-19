import { create } from 'zustand';
import { CustomerRepo } from '../../database/repositories/customer.repo';
import type { Customer, CustomerInput, CustomerTransaction } from '@/lib/types';

interface CustomerStore {
    customers: Customer[];
    transactions: CustomerTransaction[];
    isLoadingCustomers: boolean;
    isLoadingTransactions: boolean;
    error: string | null;
    clearError: () => void;
    loadCustomers: () => Promise<void>;
    searchCustomers: (query: string) => Promise<Customer[]>;
    addCustomer: (customer: CustomerInput) => Promise<void>;
    updateCustomer: (id: number, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;
    loadTransactions: (customerId: number) => Promise<void>;
    makePayment: (customerId: number, amount: number) => Promise<void>;
    getDebtors: () => Promise<Customer[]>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
    customers: [],
    transactions: [],
    isLoadingCustomers: false,
    isLoadingTransactions: false,
    error: null,

    clearError: () => set({ error: null }),

    loadCustomers: async () => {
        try {
            set({ isLoadingCustomers: true, error: null });
            const customers = await CustomerRepo.getAll();
            set({ customers });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingCustomers: false });
        }
    },

    searchCustomers: async (query: string) => {
        if (!query) return [];
        return await CustomerRepo.search(query);
    },

    addCustomer: async (customer) => {
        try {
            set({ error: null });
            await CustomerRepo.create(customer);
            await get().loadCustomers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateCustomer: async (id, customer) => {
        try {
            set({ error: null });
            await CustomerRepo.update(id, customer);
            await get().loadCustomers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    deleteCustomer: async (id) => {
        try {
            set({ error: null });
            await CustomerRepo.delete(id);
            await get().loadCustomers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    loadTransactions: async (customerId) => {
        try {
            set({ isLoadingTransactions: true, error: null });
            const transactions = await CustomerRepo.getTransactions(customerId);
            set({ transactions });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingTransactions: false });
        }
    },

    makePayment: async (customerId, amount) => {
        try {
            set({ isLoadingTransactions: true, error: null });
            await CustomerRepo.addTransaction(customerId, 'payment', amount, undefined, undefined, 'Manual Payment');
            await get().loadCustomers();
            await get().loadTransactions(customerId);
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingTransactions: false });
        }
    },

    getDebtors: async () => {
        return await CustomerRepo.getDebtors();
    },
}));
