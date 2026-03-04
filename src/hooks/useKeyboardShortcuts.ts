// useKeyboardShortcuts.ts — F1–F12 keyboard shortcuts for POS actions
import { useEffect, useCallback } from 'react';

export interface POSShortcutHandlers {
    onHold: () => void;          // F1
    onRecall: () => void;        // F2
    onVoid: () => void;          // F3
    onDiscount: () => void;      // F4
    onReprint: () => void;       // F5
    onDrawer: () => void;        // F6
    onPriceCheck: () => void;    // F7
    onReturn: () => void;        // F8
    onReport: () => void;        // F9
    onSettings: () => void;      // F10
    onEndShift: () => void;      // F11
    onGiftCard: () => void;      // F12
}

const KEY_MAP: Record<string, keyof POSShortcutHandlers> = {
    F1: 'onHold',
    F2: 'onRecall',
    F3: 'onVoid',
    F4: 'onDiscount',
    F5: 'onReprint',
    F6: 'onDrawer',
    F7: 'onPriceCheck',
    F8: 'onReturn',
    F9: 'onReport',
    F10: 'onSettings',
    F11: 'onEndShift',
    F12: 'onGiftCard',
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
