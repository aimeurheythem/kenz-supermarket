// useKeyboardShortcuts.ts — F1–F12 keyboard shortcuts for POS actions
import { useEffect, useCallback } from 'react';

export interface POSShortcutHandlers {
    onTab1?: () => void;         // F1
    onTab2?: () => void;         // F2
    onTab3?: () => void;         // F3
    onTab4?: () => void;         // F4
    onTab5?: () => void;         // F5
    onTab6?: () => void;         // F6
    onVoid: () => void;          // F7
    onDiscount: () => void;      // F8
    onReprint: () => void;       // F9
    onDrawer: () => void;        // F10
    onPriceCheck: () => void;    // F11
    onReturn: () => void;        // F12
    onReport: () => void;
    onSettings: () => void;
    onEndShift: () => void;
    onGiftCard: () => void;
}

const KEY_MAP: Record<string, keyof POSShortcutHandlers> = {
    F1: 'onTab1',
    F2: 'onTab2',
    F3: 'onTab3',
    F4: 'onTab4',
    F5: 'onTab5',
    F6: 'onTab6',
    F7: 'onVoid',
    F8: 'onDiscount',
    F9: 'onReprint',
    F10: 'onDrawer',
    F11: 'onPriceCheck',
    F12: 'onReturn',
};

/**
 * Captures F1–F12 keys in capture phase and fires the corresponding POS action.
 * preventDefault blocks browser defaults (e.g., F5 refresh, F11 fullscreen).
 */
export function useKeyboardShortcuts(handlers: POSShortcutHandlers, enabled = true) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const handler = KEY_MAP[e.key];
            if (handler && handlers[handler]) {
                e.preventDefault();
                e.stopPropagation();
                handlers[handler]();
            }
        },
        [handlers],
    );

    useEffect(() => {
        if (!enabled) return;
        document.addEventListener('keydown', handleKeyDown, true); // capture phase
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [handleKeyDown, enabled]);
}
