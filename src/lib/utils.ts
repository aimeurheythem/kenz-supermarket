import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import i18n from '@/i18n';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
    const isArabic = i18n.language === 'ar';
    if (isArabic) {
        return new Intl.NumberFormat('ar-DZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' دج';
    }
    return new Intl.NumberFormat("fr-DZ", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 2,
    }).format(amount)
}

export function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date))
}
