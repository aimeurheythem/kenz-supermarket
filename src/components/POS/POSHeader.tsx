import { Clock, Store } from 'lucide-react';
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
        <header className="flex items-center justify-between px-4 py-2 bg-zinc-900 text-white shrink-0">
            {/* Left: Store branding */}
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-yellow-400 rounded-lg">
                    <Store size={18} className="text-zinc-900" />
                </div>
                <div className="leading-tight">
                    <h1 className="text-sm font-black tracking-tight uppercase">{storeName || t('pos.store_name', 'Super Market')}</h1>
                    <span className="text-[10px] text-zinc-400 font-bold tracking-[0.15em] uppercase">{t('pos.system', 'POS SYSTEM')}</span>
                </div>
            </div>

            {/* Center: Cashier info + shift */}
            <div className="flex items-center gap-3">
                {sessionActive && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-zinc-300">{cashierName}</span>
                        </div>
                        {shiftStart && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                                {t('pos.shift_since', 'Shift since {{time}}', { time: shiftStart })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Live clock */}
            <div className="flex items-center gap-2 text-zinc-300">
                <Clock size={14} className="text-zinc-500" />
                <div className="text-right leading-tight">
                    <div className="text-xs font-bold tabular-nums">{time}</div>
                    <div className="text-[10px] text-zinc-500 font-medium">{date}</div>
                </div>
            </div>
        </header>
    );
}
