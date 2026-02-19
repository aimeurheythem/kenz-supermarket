import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

/**
 * Reactive hook for currency formatting.
 * Re-renders when language or settings change.
 */
export function useFormatCurrency() {
    const { i18n } = useTranslation();
    const settings = useSettingsStore((s) => s.settings);

    // Force dependency on reactive values so the component re-renders
    const _lang = i18n.language;
    const _symbol = settings['currency.symbol'];
    const _position = settings['currency.position'];

    const format = useCallback(
        (amount: number, includeSymbol = true) => formatCurrency(amount, includeSymbol),
        [], // _lang, _symbol, _position trigger re-renders but aren't used inside the callback
    );

    const symbol = getCurrencySymbol();

    return { formatCurrency: format, currencySymbol: symbol };
}
