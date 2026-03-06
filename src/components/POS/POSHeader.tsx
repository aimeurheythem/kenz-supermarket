import { Clock, ShoppingBag } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useTranslation } from 'react-i18next';

interface POSHeaderProps {
    storeName: string;
    cashierName: string;
    sessionActive: boolean;
    shiftStartTime?: string; // ISO timestamp of shift start
}

export default function POSHeader({ storeName, cashierName, sessionActive, shiftStartTime }: POSHeaderProps) {
    const { date, time } = useLiveClock();
    const { t } = useTranslation();

    const shiftStart = shiftStartTime
        ? new Date(shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <header className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-zinc-100 shrink-0">
            {/* Left: Store branding */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 rounded-xl">
                    <ShoppingBag size={16} strokeWidth={1.5} className="text-white" />
                </div>
                <div className="leading-tight">
                    <h1 className="text-sm font-bold tracking-tight text-zinc-900">{storeName || t('pos.store_name', 'Super Market')}</h1>
                    <span className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase">{t('pos.system', 'POS SYSTEM')}</span>
                </div>
            </div>

            {/* Center: Cashier info + shift */}
            <div className="flex items-center gap-4">
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

            {/* Right: Live clock */}
            <div className="flex items-center gap-2.5 text-zinc-500">
                <Clock size={14} strokeWidth={1.5} className="text-zinc-300" />
                <div className="text-right leading-tight">
                    <div className="text-xs font-semibold text-zinc-700 tabular-nums">{time}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">{date}</div>
                </div>
            </div>
        </header>
    );
}
