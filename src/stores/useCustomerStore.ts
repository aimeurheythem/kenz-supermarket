import { create } from 'zustand';
import { CustomerRepo } from '../../database/repositories/customer.repo';
import type { Customer, CustomerInput, CustomerTransaction } from '@/lib/types';

interface CustomerStore {
    customers: Customer[];
    isLoading: boolean;
    loadCustomers: () => Promise<void>;
    searchCustomers: (query: string) => Promise<Customer[]>;
    addCustomer: (customer: CustomerInput) => Promise<void>;
    updateCustomer: (id: number, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;

    // Credit System
    transactions: CustomerTransaction[];
    loadTransactions: (customerId: number) => Promise<void>;
    makePayment: (customerId: number, amount: number) => Promise<void>;
    getDebtors: () => Promise<Customer[]>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
    customers: [],
    isLoading: false,
    transactions: [],

    loadCustomers: async () => {
        set({ isLoading: true });
        try {
            const customers = await CustomerRepo.getAll();
            set({ customers, isLoading: false });
        } catch (error) {
            console.error('Failed to load customers:', error);
            set({ isLoading: false });
        }
    },

    searchCustomers: async (query: string) => {
        if (!query) return [];
        return await CustomerRepo.search(query);
    },

    addCustomer: async (customer) => {
        set({ isLoading: true });
        try {
            await CustomerRepo.create(customer);
            await get().loadCustomers();
        } catch (error) {
            console.error('Failed to add customer:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateCustomer: async (id, customer) => {
        set({ isLoading: true });
        try {
            await CustomerRepo.update(id, customer);
            await get().loadCustomers();
        } catch (error) {
            console.error('Failed to update customer:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteCustomer: async (id) => {
        set({ isLoading: true });
        try {
            await CustomerRepo.delete(id);
            await get().loadCustomers();
        } catch (error) {
            console.error('Failed to delete customer:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    // Credit System Actions
    loadTransactions: async (customerId) => {
        set({ isLoading: true });
        try {
            const transactions = await CustomerRepo.getTransactions(customerId);
            set({ transactions, isLoading: false });
        } catch (error) {
            console.error('Failed to load transactions:', error);
            set({ isLoading: false });
        }
    },

    makePayment: async (customerId, amount) => {
        set({ isLoading: true });
        try {
            await CustomerRepo.addTransaction(customerId, 'payment', amount, undefined, undefined, 'Manual Payment');
            // Refresh customer to update debt
            await get().loadCustomers();
            // Refresh transactions if viewing this customer
            await get().loadTransactions(customerId);
        } catch (error) {
            console.error('Failed to make payment:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    getDebtors: async () => {
        return await CustomerRepo.getDebtors();
    }
}));
