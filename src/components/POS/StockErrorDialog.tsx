import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface StockErrorDialogProps {
    error: { productName: string; available: number } | null;
    onClose: () => void;
}

export default function StockErrorDialog({ error, onClose }: StockErrorDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={!!error} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[320px] border-0 p-8 bg-white rounded-[2.5rem] shadow-none overflow-hidden">
                {/* Minimal Grid Background */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                    }}
                />

                <DialogHeader className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.3em]">
                            {t('pos.inventory.title', 'Inventory')}
                        </span>
                    </div>

                    <DialogTitle className="text-xl font-black text-black tracking-tighter uppercase leading-tight">
                        {t('pos.inventory.low_stock')}
                    </DialogTitle>

                    <DialogDescription className="text-black/60 text-[12px] font-medium tracking-tight leading-relaxed">
                        {t('pos.inventory.only_units_available', {
                            count: error?.available,
                            name: error?.productName,
                        })}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-8 relative z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.98] hover:bg-zinc-800"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
