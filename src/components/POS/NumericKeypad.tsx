// NumericKeypad.tsx — On-screen numeric keypad for touchscreen product code entry
import { Delete, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NumericKeypadProps {
    value: string;
    onDigit: (digit: string) => void;
    onBackspace: () => void;
    onClear: () => void;
    onConfirm: () => void;
}

export default function NumericKeypad({
    value,
    onDigit,
    onBackspace,
    onClear,
    onConfirm,
}: NumericKeypadProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-zinc-50">
            {/* Display row */}
            <div className="flex items-center h-16 lg:h-20 border-b border-zinc-200">
                <span className={`flex-1 px-4 text-lg lg:text-2xl font-mono font-bold tabular-nums truncate ${value ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {value || t('pos.keypad_placeholder', 'Code...')}
                </span>
                {value && (
                    <button
                        onClick={onBackspace}
                        className="h-full px-6 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors border-l border-zinc-200"
                        aria-label={t('pos.backspace', 'Backspace')}
                    >
                        <Delete size={16} strokeWidth={1.5} />
                    </button>
                )}
            </div>

            {/* Keys — flat full-width rows */}
            <div className="grid grid-cols-4 grid-rows-4" role="group" aria-label={t('pos.keypad', 'Keypad')}>
                {/* Row 1: 7 8 9 C */}
                {['7', '8', '9'].map((k) => (
                    <button key={k} onClick={() => onDigit(k)} className="h-16 lg:h-20 text-xl lg:text-2xl font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-b border-r border-zinc-200 transition-colors active:bg-zinc-200">{k}</button>
                ))}
                <button onClick={onClear} className="h-16 lg:h-20 text-xl lg:text-2xl font-black text-red-500 hover:text-red-600 hover:bg-red-50 border-b border-zinc-200 transition-colors active:bg-red-100" aria-label={t('pos.clear', 'Clear')}>
                    <X size={24} strokeWidth={2.5} className="mx-auto" />
                </button>

                {/* Row 2: 4 5 6 (confirm spans 3 rows) */}
                {['4', '5', '6'].map((k) => (
                    <button key={k} onClick={() => onDigit(k)} className="h-16 lg:h-20 text-xl lg:text-2xl font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-b border-r border-zinc-200 transition-colors active:bg-zinc-200">{k}</button>
                ))}
                <button onClick={onConfirm} className="row-span-3 text-xl lg:text-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white transition-colors active:bg-emerald-700" aria-label={t('pos.confirm', 'Confirm')}>
                    <Check size={32} strokeWidth={3} className="mx-auto" />
                </button>

                {/* Row 3: 1 2 3 */}
                {['1', '2', '3'].map((k) => (
                    <button key={k} onClick={() => onDigit(k)} className="h-16 lg:h-20 text-xl lg:text-2xl font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-b border-r border-zinc-200 transition-colors active:bg-zinc-200">{k}</button>
                ))}

                {/* Row 4: 00 0 . */}
                <button onClick={() => onDigit('00')} className="h-16 lg:h-20 text-xl lg:text-2xl font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-r border-zinc-200 transition-colors active:bg-zinc-200">00</button>
                <button onClick={() => onDigit('0')} className="h-16 lg:h-20 text-xl lg:text-2xl font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-r border-zinc-200 transition-colors active:bg-zinc-200">0</button>
                <button onClick={() => onDigit('.')} className="h-16 lg:h-20 text-xl lg:text-2xl font-black text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-r border-zinc-200 transition-colors active:bg-zinc-200">.</button>
            </div>
        </div>
    );
}
