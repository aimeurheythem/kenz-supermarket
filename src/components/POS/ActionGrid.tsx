// ActionGrid.tsx — 4×3 grid of POS action shortcut buttons
import {
    CirclePause,
    History,
    Ban,
    Percent,
    Printer,
    Archive,
    ScanSearch,
    RefreshCcw,
    TrendingUp,
    SlidersHorizontal,
    Power,
    Gift,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ActionButton from './ActionButton';

interface ActionGridProps {
    holdCount: number;
    maxHolds: number;
    onHold: () => void;
    onRecall: () => void;
    onVoid: () => void;
    onDiscount: () => void;
    onReprintReceipt: () => void;
    onOpenDrawer: () => void;
    onPriceCheck: () => void;
    onReturn: () => void;
    onDailyReport: () => void;
    onSettings: () => void;
    onEndShift: () => void;
    onGiftCard: () => void;
}

export default function ActionGrid({
    holdCount,
    maxHolds,
    onHold,
    onRecall,
    onVoid,
    onDiscount,
    onReprintReceipt,
    onOpenDrawer,
    onPriceCheck,
    onReturn,
    onDailyReport,
    onSettings,
    onEndShift,
    onGiftCard,
}: ActionGridProps) {
    const { t } = useTranslation();

    const actions = [
        { icon: CirclePause, label: t('pos.action.hold', 'Hold'), key: 'F1', onClick: onHold, variant: 'default' as const, badge: `${holdCount}/${maxHolds}` },
        { icon: History, label: t('pos.action.recall', 'Recall'), key: 'F2', onClick: onRecall, variant: 'default' as const },
        { icon: Ban, label: t('pos.action.void', 'Void'), key: 'F3', onClick: onVoid, variant: 'danger' as const },
        { icon: Percent, label: t('pos.action.discount', 'Discount'), key: 'F4', onClick: onDiscount, variant: 'warning' as const },
        { icon: Printer, label: t('pos.action.reprint', 'Reprint'), key: 'F5', onClick: onReprintReceipt, variant: 'default' as const },
        { icon: Archive, label: t('pos.action.drawer', 'Drawer'), key: 'F6', onClick: onOpenDrawer, variant: 'default' as const },
        { icon: ScanSearch, label: t('pos.action.price_check', 'Price'), key: 'F7', onClick: onPriceCheck, variant: 'default' as const },
        { icon: RefreshCcw, label: t('pos.action.return', 'Return'), key: 'F8', onClick: onReturn, variant: 'warning' as const },
        { icon: TrendingUp, label: t('pos.action.report', 'Report'), key: 'F9', onClick: onDailyReport, variant: 'default' as const },
        { icon: SlidersHorizontal, label: t('pos.action.settings', 'Settings'), key: 'F10', onClick: onSettings, variant: 'default' as const },
        { icon: Gift, label: t('pos.action.gift', 'Gift Card'), key: 'F11', onClick: onGiftCard, variant: 'default' as const },
        { icon: Power, label: t('pos.action.end_shift', 'End Shift'), key: 'F12', onClick: onEndShift, variant: 'danger' as const },
    ];

    return (
        <div className="grid grid-cols-1">
            {actions.map((action) => (
                <ActionButton
                    key={action.key}
                    icon={action.icon}
                    label={action.label}
                    shortcutKey={action.key}
                    onClick={action.onClick}
                    variant={action.variant}
                    badge={action.badge}
                />
            ))}
        </div>
    );
}
