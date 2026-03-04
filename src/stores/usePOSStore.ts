import { create } from 'zustand';
import type {
    Product,
    Customer,
    CartItem,
    HeldTransaction,
    ManualDiscount,
    PromotionApplicationResult,
} from '@/lib/types';

const MAX_HOLDS = 5;

interface POSStore {
    // Held transactions (session-scoped, max 5)
    heldTransactions: HeldTransaction[];

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
    holdTransaction: (
        cart: CartItem[],
        customer: Customer | null,
        promotionResult: PromotionApplicationResult | null,
        cartDiscount: ManualDiscount | null,
        ticketNumber: number,
        cashierId: number,
    ) => boolean;
    recallTransaction: (id: string) => HeldTransaction | null;
    removeHeld: (id: string) => void;
    getHoldCount: (cashierId: number) => number;

    setSelectedProduct: (product: Product | null) => void;

    appendKeypad: (digit: string) => void;
    clearKeypad: () => void;
    backspaceKeypad: () => void;
    setKeypadMode: (mode: 'product_code' | 'quantity' | 'price') => void;

    setReturnMode: (active: boolean) => void;
    setNextTicketNumber: (num: number) => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
    heldTransactions: [],
    selectedProduct: null,
    keypadValue: '',
    keypadMode: 'product_code',
    returnMode: false,
    nextTicketNumber: 1,

    holdTransaction: (cart, customer, promotionResult, cartDiscount, ticketNumber, cashierId) => {
        const { heldTransactions } = get();
        const cashierHolds = heldTransactions.filter((h) => h.cashierId === cashierId);
        if (cashierHolds.length >= MAX_HOLDS) return false;

        const held: HeldTransaction = {
            id: crypto.randomUUID(),
            ticketNumber,
            cart: [...cart],
            customer,
            promotionResult,
            cartDiscount,
            heldAt: new Date().toISOString(),
            cashierId,
        };

        set({ heldTransactions: [...heldTransactions, held] });
        return true;
    },

    recallTransaction: (id) => {
        const { heldTransactions } = get();
        const found = heldTransactions.find((h) => h.id === id);
        if (!found) return null;
        set({ heldTransactions: heldTransactions.filter((h) => h.id !== id) });
        return found;
    },

    removeHeld: (id) => {
        set({ heldTransactions: get().heldTransactions.filter((h) => h.id !== id) });
    },

    getHoldCount: (cashierId) => {
        return get().heldTransactions.filter((h) => h.cashierId === cashierId).length;
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
