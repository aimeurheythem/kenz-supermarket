import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from '@/i18n';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { useSettingsStore } from '@/stores/useSettingsStore';

// Map i18n language codes to Intl locale strings
function getIntlLocale(): string {
    switch (i18n.language) {
        case 'ar':
            return 'ar-DZ';
        case 'fr':
            return 'fr-FR';
        default:
            return 'en-US';
    }
}

/**
 * Get the currency symbol based on settings + current language.
 * Settings take priority; falls back to locale-aware default.
 */
export function getCurrencySymbol(): string {
    const settings = useSettingsStore.getState().settings;
    const stored = settings['currency.symbol'];
    if (stored) return stored;
    return i18n.language === 'ar' ? 'د.ج' : 'DZ';
}

export function formatCurrency(amount: number, includeSymbol = true) {
    const settings = useSettingsStore.getState().settings;
    const symbol = getCurrencySymbol();
    const position = settings['currency.position'] || 'suffix';

    const formattedNumber = new Intl.NumberFormat(getIntlLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    if (!includeSymbol) return formattedNumber;

    if (position === 'prefix') {
        return `${symbol} ${formattedNumber}`;
    }
    return `${formattedNumber} ${symbol}`;
}

export function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat(i18n.language, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
}

// ============================================
// PASSWORD & PIN VALIDATION
// ============================================

export function validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one digit' };
    }
    return { valid: true, message: '' };
}

export function validatePin(pin: string): { valid: boolean; message: string } {
    if (pin.length < 4 || pin.length > 6) {
        return { valid: false, message: 'PIN must be 4-6 digits' };
    }
    if (!/^\d+$/.test(pin)) {
        return { valid: false, message: 'PIN must contain only digits' };
    }
    return { valid: true, message: '' };
}
