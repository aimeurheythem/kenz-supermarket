import { create } from 'zustand';
import type {
    Product,
    Customer,
    CartItem,
    CartTab,
    ManualDiscount,
    PromotionApplicationResult,
} from '@/lib/types';

const INITIAL_TABS: Record<string, CartTab> = {
    'tab-1': { id: 'tab-1', name: 'Tab 1', cart: [], customer: null, promotionResult: null, cartDiscount: null },
    'tab-2': { id: 'tab-2', name: 'Tab 2', cart: [], customer: null, promotionResult: null, cartDiscount: null },
    'tab-3': { id: 'tab-3', name: 'Tab 3', cart: [], customer: null, promotionResult: null, cartDiscount: null },
    'tab-4': { id: 'tab-4', name: 'Tab 4', cart: [], customer: null, promotionResult: null, cartDiscount: null },
    'tab-5': { id: 'tab-5', name: 'Tab 5', cart: [], customer: null, promotionResult: null, cartDiscount: null },
    'tab-6': { id: 'tab-6', name: 'Tab 6', cart: [], customer: null, promotionResult: null, cartDiscount: null },
};

interface POSStore {
    // Active tabs
    tabs: Record<string, CartTab>;
    activeTabId: string;

    // Product detail card
    selectedProduct: Product | null;

    // Numeric keypad
    keypadValue: string;
    keypadMode: 'product_code' | 'quantity' | 'price';

    // Return mode
    returnMode: boolean;

    // Next ticket number preview
    nextTicketNumber: number;

    // Actions
    switchTab: (
        tabId: string,
        currentCartState: Omit<CartTab, 'id' | 'name'>
    ) => CartTab | null;
    clearTab: (tabId: string) => void;

    setSelectedProduct: (product: Product | null) => void;

    appendKeypad: (digit: string) => void;
    clearKeypad: () => void;
    backspaceKeypad: () => void;
    setKeypadMode: (mode: 'product_code' | 'quantity' | 'price') => void;

    setReturnMode: (active: boolean) => void;
    setNextTicketNumber: (num: number) => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
    tabs: INITIAL_TABS,
    activeTabId: 'tab-1',
    selectedProduct: null,
    keypadValue: '',
    keypadMode: 'product_code',
    returnMode: false,
    nextTicketNumber: 1,

    switchTab: (tabId, currentCartState) => {
        const { tabs, activeTabId } = get();
        if (tabId === activeTabId) return null; // No change

        // Save current state to the active tab
        const updatedTabs = {
            ...tabs,
            [activeTabId]: {
                ...tabs[activeTabId],
                cart: [...currentCartState.cart],
                customer: currentCartState.customer,
                promotionResult: currentCartState.promotionResult,
                cartDiscount: currentCartState.cartDiscount,
            },
        };

        set({
            tabs: updatedTabs,
            activeTabId: tabId,
        });

        // Return the required state for the newly activated tab
        return updatedTabs[tabId];
    },

    clearTab: (tabId) => {
        const { tabs } = get();
        set({
            tabs: {
                ...tabs,
                [tabId]: { id: tabId, name: tabs[tabId].name, cart: [], customer: null, promotionResult: null, cartDiscount: null },
            },
        });
    },

    setSelectedProduct: (product) => set({ selectedProduct: product }),

    appendKeypad: (digit) => {
        const { keypadValue } = get();
        if (keypadValue.length >= 20) return; // guard
        set({ keypadValue: keypadValue + digit });
    },

    clearKeypad: () => set({ keypadValue: '' }),

    backspaceKeypad: () => {
        const { keypadValue } = get();
        set({ keypadValue: keypadValue.slice(0, -1) });
    },

    setKeypadMode: (mode) => set({ keypadMode: mode, keypadValue: '' }),

    setReturnMode: (active) => set({ returnMode: active }),
    setNextTicketNumber: (num) => set({ nextTicketNumber: num }),
}));
