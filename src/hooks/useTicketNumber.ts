// useTicketNumber.ts — Peek at the next ticket number and format as zero-padded string
import { useState, useEffect, useCallback } from 'react';
import { SaleRepo } from '../../database/repositories/sale.repo';
import { usePOSStore } from '@/stores/usePOSStore';

/**
 * Hook that fetches the next ticket number from the database
 * and keeps the POS store in sync.
 * Returns the formatted ticket string (e.g., "042") and a refresh function.
 */
export function useTicketNumber() {
    const [ticketNumber, setTicketNumber] = useState(1);

    const refresh = useCallback(async () => {
        try {
            const next = await SaleRepo.getNextTicketNumber();
            setTicketNumber(next);
            usePOSStore.getState().setNextTicketNumber(next);
        } catch {
            // Fallback: keep current value
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const formatted = String(ticketNumber).padStart(3, '0');

    return { ticketNumber, formatted, refresh };
}
