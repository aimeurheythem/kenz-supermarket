// ManagerPinDialog.tsx — PIN entry modal for manager authorization
import { useState, useRef, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import type { AuthorizableAction } from '@/lib/types';

interface ManagerPinDialogProps {
    isOpen: boolean;
    action: AuthorizableAction | null;
    onSubmit: (pin: string) => void;
    onCancel: () => void;
    isVerifying: boolean;
    error?: string;
}

const ACTION_LABELS: Record<string, string> = {
    void_sale: 'Void Sale',
    apply_discount: 'Apply Discount',
    process_return: 'Process Return',
    large_discount: 'Apply Large Discount',
    price_override: 'Override Price',
    open_drawer: 'Open Cash Drawer',
};

export default function ManagerPinDialog({
    isOpen,
    action,
    onSubmit,
    onCancel,
    isVerifying,
    error,
}: ManagerPinDialogProps) {
    const { t } = useTranslation();
    const [pin, setPin] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            // small delay to allow dialog animation
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length >= 4 && !isVerifying) {
            onSubmit(pin);
        }
    };

    const handleKeypadClick = (digit: string) => {
        if (pin.length < 6) {
            setPin((prev) => prev + digit);
        }
    };

    const handleBackspace = () => {
        setPin((prev) => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
    };

    const actionLabel = action ? (ACTION_LABELS[action] ?? action) : '';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Shield size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-base">
                                {t('pos.manager_auth', 'Manager Authorization')}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {t('pos.enter_pin_for', 'Enter manager PIN for:')} {actionLabel}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* PIN display */}
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-black ${
                                    i < pin.length
                                        ? 'border-zinc-900 bg-zinc-50'
                                        : 'border-zinc-200 bg-zinc-50'
                                }`}
                            >
                                {i < pin.length ? '●' : ''}
                            </div>
                        ))}
                    </div>

                    {/* Hidden input for keyboard input */}
                    <input
                        ref={inputRef}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="sr-only"
                        autoFocus
                        aria-label={t('pos.enter_pin_for', 'Enter manager PIN for:')}
                    />

                    {/* On-screen keypad */}
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="PIN keypad">
                        {['1','2','3','4','5','6','7','8','9','C','0','←'].map((key) => (
                            <button
                                key={key}
                                type="button"
                                aria-label={key === 'C' ? t('pos.clear', 'Clear') : key === '←' ? t('pos.backspace', 'Backspace') : key}
                                onClick={() => {
                                    if (key === 'C') handleClear();
                                    else if (key === '←') handleBackspace();
                                    else handleKeypadClick(key);
                                }}
                                className="h-12 rounded-lg bg-zinc-100 text-lg font-bold text-zinc-700 hover:bg-zinc-200 active:scale-95 transition-all"
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="text-sm text-red-600 text-center font-medium animate-pulse" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isVerifying}
                            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-all"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={pin.length < 4 || isVerifying}
                            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {t('pos.verifying', 'Verifying...')}
                                </>
                            ) : (
                                t('pos.authorize', 'Authorize')
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
