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

    // Keypad actions
    onDigit?: (digit: string) => void;
    onBackspace?: () => void;
    onClear?: () => void;
    onConfirm?: () => void;

    // Arrow keys for quantity control & navigation
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onDelete?: () => void;
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
 * Captures keys in capture phase and fires the corresponding POS action.
 * preventDefault blocks browser defaults (e.g., F5 refresh, F11 fullscreen).
 */
export function useKeyboardShortcuts(handlers: POSShortcutHandlers, enabled = true) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Ignore if typing in an input/textarea
            const target = e.target as HTMLElement;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
                return;
            }

            // 1. Check Function Keys (F1-F12)
            const handler = KEY_MAP[e.key];
            if (handler && handlers[handler]) {
                e.preventDefault();
                e.stopPropagation();
                (handlers[handler] as () => void)();
                return;
            }

            // 2. Handle Numeric Keypad / Top Row Numbers
            if (/^[0-9.]$/.test(e.key)) {
                if (handlers.onDigit) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onDigit(e.key);
                }
                return;
            }

            // 3. Handle Control Keys
            if (e.key === 'Backspace') {
                if (handlers.onBackspace) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onBackspace();
                }
                return;
            }

            if (e.key === 'Enter') {
                if (handlers.onConfirm) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onConfirm();
                }
                return;
            }

            if (e.key === 'Escape') {
                if (handlers.onClear) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onClear();
                }
                return;
            }

            // 4. Handle Arrow Keys (Quantity Control)
            if (e.key === 'ArrowUp') {
                if (handlers.onArrowUp) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onArrowUp();
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                if (handlers.onArrowDown) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onArrowDown();
                }
                return;
            }

            if (e.key === 'ArrowLeft') {
                if (handlers.onArrowLeft) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onArrowLeft();
                }
                return;
            }

            if (e.key === 'ArrowRight') {
                if (handlers.onArrowRight) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onArrowRight();
                }
                return;
            }

            if (e.key === 'Delete') {
                if (handlers.onDelete) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlers.onDelete();
                }
                return;
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
