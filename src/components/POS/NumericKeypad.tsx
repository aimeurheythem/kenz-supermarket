// NumericKeypad.tsx — On-screen numeric keypad for touchscreen product code entry
import { Delete, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface NumericKeypadProps {
    value: string;
    onDigit: (digit: string) => void;
    onBackspace: () => void;
    onClear: () => void;
    onConfirm: () => void;
}

const KEYS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '↵'],
] as const;

export default function NumericKeypad({
    value,
    onDigit,
    onBackspace,
    onClear,
    onConfirm,
}: NumericKeypadProps) {
    const { t } = useTranslation();

    const handleKey = (key: string) => {
        if (key === 'C') onClear();
        else if (key === '↵') onConfirm();
        else onDigit(key);
    };

    return (
        <div className="p-5">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                {t('pos.keypad', 'Keypad')}
            </div>

            {/* Display */}
            <div className="relative mb-4">
                <div className="w-full h-14 px-4 flex items-center justify-between rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className={`text-lg font-mono font-semibold tabular-nums ${value ? 'text-zinc-800' : 'text-zinc-300'}`}>
                        {value || t('pos.keypad_placeholder', 'Product code...')}
                    </span>
                    {value && (
                        <button
                            onClick={onBackspace}
                            className="p-2 rounded-xl text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
                            aria-label={t('pos.backspace', 'Backspace')}
                        >
                            <Delete size={20} strokeWidth={1.5} />
                        </button>
                    )}
                </div>
            </div>

            {/* Keypad grid */}
            <div className="grid grid-cols-3 gap-2.5" role="group" aria-label={t('pos.keypad', 'Keypad')}>
                {KEYS.flat().map((key) => {
                    const isConfirm = key === '↵';
                    const isClear = key === 'C';

                    return (
                        <motion.button
                            key={key}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleKey(key)}
                            className={`
                                h-14 rounded-2xl text-lg font-bold transition-all shadow-sm
                                ${isConfirm
                                    ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/20'
                                    : isClear
                                        ? 'bg-red-50 text-red-500 hover:bg-red-100 shadow-red-100/50'
                                        : 'bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-200 shadow-zinc-100/50'
                                }
                                active:scale-95 flex items-center justify-center
                            `}
                            aria-label={isConfirm ? t('pos.confirm', 'Confirm') : isClear ? t('pos.clear', 'Clear') : key}
                        >
                            {isConfirm ? (
                                <Check size={22} strokeWidth={2} />
                            ) : isClear ? (
                                <X size={22} strokeWidth={2} />
                            ) : (
                                key
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
