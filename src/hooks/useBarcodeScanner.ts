import { useEffect, useRef, useCallback } from 'react';

/**
 * useBarcodeScanner — Detects hardware barcode scanner input globally.
 *
 * Hardware scanners emulate a keyboard: they type characters very fast
 * (< 50ms between keystrokes) then send Enter. This hook detects that
 * pattern and fires `onScan` with the decoded barcode.
 *
 * Works even when an <input> is focused: it intercepts the rapid-fire
 * pattern and prevents it from polluting the input value.
 *
 * @param onScan  Called with the barcode string when a scan is detected
 * @param enabled Whether the scanner is active (default: true)
 */
export function useBarcodeScanner(
    onScan: (barcode: string) => void,
    enabled = true,
) {
    const buffer = useRef('');
    const lastKeyTime = useRef(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;

    // Characters that arrived within the rapid-fire window
    const pendingEvents = useRef<KeyboardEvent[]>([]);

    const clearBuffer = useCallback(() => {
        buffer.current = '';
        pendingEvents.current = [];
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const MAX_INTER_CHAR_MS = 60; // Hardware scanners send chars < 50ms apart
        const MIN_BARCODE_LENGTH = 3;  // Minimum valid barcode length

        const handleKeyDown = (e: KeyboardEvent) => {
            const now = performance.now();
            const gap = now - lastKeyTime.current;
            lastKeyTime.current = now;

            // Enter key = end of barcode sequence
            if (e.key === 'Enter') {
                if (buffer.current.length >= MIN_BARCODE_LENGTH) {
                    const barcode = buffer.current;

                    // Prevent Enter from submitting forms / triggering buttons
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    // If we were typing into an input, erase the scanner garbage
                    const target = e.target as HTMLElement;
                    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
                        const original = target.value;
                        // Remove the barcode chars that were typed into the input
                        if (original.endsWith(barcode)) {
                            target.value = original.slice(0, -barcode.length);
                            // Fire input event so React state syncs
                            target.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }

                    clearBuffer();
                    // Fire callback on next microtask so DOM cleanup completes first
                    queueMicrotask(() => onScanRef.current(barcode));
                    return;
                }
                // Buffer too short — not a barcode, let it through
                clearBuffer();
                return;
            }

            // Only accumulate printable single characters
            if (e.key.length !== 1) {
                clearBuffer();
                return;
            }

            // If gap is too large, this is human typing — reset
            if (gap > MAX_INTER_CHAR_MS && buffer.current.length > 0) {
                clearBuffer();
            }

            buffer.current += e.key;
            pendingEvents.current.push(e);

            // Safety timeout: if no more chars arrive, clear buffer
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(clearBuffer, MAX_INTER_CHAR_MS + 20);
        };

        // Use capture phase so we intercept before React/inputs
        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            clearBuffer();
        };
    }, [enabled, clearBuffer]);
}
