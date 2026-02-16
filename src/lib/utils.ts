import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import i18n from '@/i18n';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

import { useSettingsStore } from '@/stores/useSettingsStore';

export function formatCurrency(amount: number) {
    const settings = useSettingsStore.getState().settings;
    const symbol = settings['currency.symbol'] || 'DZD';
    const position = settings['currency.position'] || 'suffix';

    // Format number with spaces for thousands
    const formattedNumber = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    if (position === 'prefix') {
        return `${symbol} ${formattedNumber}`;
    }
    return `${formattedNumber} ${symbol}`;
}

export function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat(i18n.language, {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date))
}
