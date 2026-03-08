import { Clock, LogOut } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useTranslation } from 'react-i18next';

interface POSHeaderProps {
    storeName: string;
    cashierName: string;
    sessionActive: boolean;
    shiftStartTime?: string; // ISO timestamp of shift start
    onEndShift?: () => void;
}

export default function POSHeader({ storeName, cashierName, sessionActive, shiftStartTime, onEndShift }: POSHeaderProps) {
    const { date, time } = useLiveClock();
    const { t } = useTranslation();

    const shiftStart = shiftStartTime
        ? new Date(shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <header className="flex items-stretch bg-white border-b border-zinc-100 shrink-0">
            {/* Left: Store branding */}
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5">
                <img src="/1.svg" alt="Logo" className="w-9 h-9 md:w-10 md:h-10" />
                <div className="leading-tight">
                    <h1 className="text-xs md:text-sm font-bold tracking-tight text-zinc-900">{storeName || t('pos.store_name', 'Super Market')}</h1>
                    <span className="text-[9px] md:text-[10px] text-zinc-400 font-medium tracking-widest uppercase">{t('pos.system', 'POS SYSTEM')}</span>
                </div>
            </div>

            {/* Center: Cashier info + shift */}
            <div className="hidden sm:flex items-center gap-2 md:gap-4 flex-1 justify-center">
                {sessionActive && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-4 ring-emerald-50" />
                            <span className="text-xs font-semibold text-zinc-600">{cashierName}</span>
                        </div>
                        {shiftStart && (
                            <span className="text-[10px] text-zinc-400 font-medium">
                                {t('pos.shift_since', 'Shift since {{time}}', { time: shiftStart })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Live clock + End Shift */}
            <div className="flex items-stretch ml-auto">
                <div className="flex items-center gap-2.5 text-zinc-500 px-4">
                    <Clock size={14} strokeWidth={1.5} className="text-zinc-300" />
                    <div className="text-right leading-tight">
                        <div className="text-xs font-semibold text-zinc-700 tabular-nums">{time}</div>
                        <div className="text-[10px] text-zinc-400 font-medium">{date}</div>
                    </div>
                </div>
                {onEndShift && (
                    <button
                        onClick={onEndShift}
                        className="flex items-center gap-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                        title={t('pos.action.end_shift', 'End Shift')}
                    >
                        <LogOut size={15} strokeWidth={1.5} />
                        <span className="hidden md:inline">{t('pos.action.end_shift', 'End Shift')}</span>
                    </button>
                )}
            </div>
        </header>
    );
}
