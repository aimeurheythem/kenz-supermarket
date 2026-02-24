import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PromotionDeleteConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    promotionName: string;
}

export default function PromotionDeleteConfirm({ isOpen, onClose, onConfirm, promotionName }: PromotionDeleteConfirmProps) {
    const { t } = useTranslation();

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl focus:outline-none">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-black uppercase tracking-tight text-rose-600">
                            {t('promotions.delete.title', 'Delete Promotion')}
                        </Dialog.Title>
                        <button onClick={onClose} className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors">
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    <p className="text-sm text-zinc-600 mb-6">
                        {t('promotions.delete.confirm_message', 'Are you sure you want to delete')}{' '}
                        <strong className="text-black">"{promotionName}"</strong>?{' '}
                        {t('promotions.delete.irreversible', 'This action cannot be undone.')}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 rounded-[3rem] border-2 border-zinc-200 font-black uppercase tracking-widest text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                        >
                            {t('promotions.delete.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-[3rem] bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs transition-colors"
                        >
                            <Trash2 size={14} strokeWidth={2.5} />
                            {t('promotions.delete.confirm', 'Delete')}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
