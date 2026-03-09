import { Clock, LogOut, Grid3X3, ScanSearch, TrendingUp, SlidersHorizontal, Gift } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface POSHeaderProps {
    storeName: string;
    cashierName: string;
    sessionActive: boolean;
    shiftStartTime?: string; // ISO timestamp of shift start
    onEndShift?: () => void;
    onPriceCheck?: () => void;
    onReport?: () => void;
    onSettings?: () => void;
    onGiftCard?: () => void;
}

export default function POSHeader({
    storeName,
    cashierName,
    sessionActive,
    shiftStartTime,
    onEndShift,
    onPriceCheck,
    onReport,
    onSettings,
    onGiftCard,
}: POSHeaderProps) {
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

                {/* Dropdown Menu for secondary actions - Google Apps Style */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center px-8 h-full hover:bg-zinc-50 border-x border-zinc-100 transition-all group">
                            <Grid3X3 size={24} strokeWidth={1.5} className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[250px] p-4 bg-white border-zinc-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-md">
                        <div className="px-1 mb-4 flex justify-between items-center text-zinc-400">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('pos.header.quick_actions', 'Quick Actions')}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <DropdownMenuItem
                                onClick={onPriceCheck}
                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-sky-50 hover:bg-sky-100 transition-all border-0 focus:bg-sky-100 cursor-pointer group/item aspect-square outline-none"
                            >
                                <div className="text-sky-600 transition-all group-hover/item:scale-110">
                                    <ScanSearch size={32} strokeWidth={1.5} />
                                </div>
                                <span className="text-xs font-bold text-sky-900/80">
                                    {t('pos.action.price_check', 'Price Check')}
                                </span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={onReport}
                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all border-0 focus:bg-emerald-100 cursor-pointer group/item aspect-square outline-none"
                            >
                                <div className="text-emerald-600 transition-all group-hover/item:scale-110">
                                    <TrendingUp size={32} strokeWidth={1.5} />
                                </div>
                                <span className="text-xs font-bold text-emerald-900/80">
                                    {t('pos.action.report', 'Reports')}
                                </span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={onSettings}
                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all border-0 focus:bg-indigo-100 cursor-pointer group/item aspect-square outline-none"
                            >
                                <div className="text-indigo-600 transition-all group-hover/item:scale-110">
                                    <SlidersHorizontal size={32} strokeWidth={1.5} />
                                </div>
                                <span className="text-xs font-bold text-indigo-900/80">
                                    {t('pos.action.settings', 'Settings')}
                                </span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={onGiftCard}
                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all border-0 focus:bg-rose-100 cursor-pointer group/item aspect-square outline-none"
                            >
                                <div className="text-rose-600 transition-all group-hover/item:scale-110">
                                    <Gift size={32} strokeWidth={1.5} />
                                </div>
                                <span className="text-xs font-bold text-rose-900/80">
                                    {t('pos.action.gift', 'Gift Cards')}
                                </span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {onEndShift && (
                    <button
                        onClick={onEndShift}
                        className="flex items-center gap-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors border-l border-red-500"
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
