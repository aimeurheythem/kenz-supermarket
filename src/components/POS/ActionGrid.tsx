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
    onVoid: () => void;
    onDiscount: () => void;
    onReprintReceipt: () => void;
    onOpenDrawer: () => void;
    onReturn: () => void;
    onEndShift: () => void;
}

export default function ActionGrid({
    onVoid,
    onDiscount,
    onReprintReceipt,
    onOpenDrawer,
    onReturn,
    onEndShift,
}: ActionGridProps) {
    const { t } = useTranslation();

    const actions = [
        { icon: Ban, label: t('pos.action.void', 'Void'), key: 'F7', onClick: onVoid, variant: 'danger' as const },
        { icon: RefreshCcw, label: t('pos.action.return', 'Return'), key: 'F12', onClick: onReturn, variant: 'warning' as const },
        { icon: Percent, label: t('pos.action.discount', 'Discount'), key: 'F8', onClick: onDiscount, variant: 'warning' as const },
        { icon: Printer, label: t('pos.action.reprint', 'Reprint'), key: 'F9', onClick: onReprintReceipt, variant: 'default' as const },
        { icon: Archive, label: t('pos.action.drawer', 'Drawer'), key: 'F10', onClick: onOpenDrawer, variant: 'default' as const, fullWidth: true },
    ];

    return (
        <div className="grid grid-cols-2 auto-rows-fr gap-2 p-2 2xl:gap-3 2xl:p-3 flex-1">
            {actions.map((action) => (
                <div key={action.key} className={`${action.fullWidth ? 'col-span-2' : ''} flex`}>
                    <ActionButton
                        icon={action.icon}
                        label={action.label}
                        shortcutKey={action.key}
                        onClick={action.onClick}
                        variant={action.variant}
                    />
                </div>
            ))}
        </div>
    );
}
