import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Button from "@/components/common/Button"
import { Trash2, AlertCircle } from "lucide-react"
import { useTranslation } from 'react-i18next'

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    itemName?: string;
}

export function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Deletion",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    itemName
}: DeleteConfirmModalProps) {
    const { t } = useTranslation();
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[400px]">
                <DialogHeader className="pt-4 px-4">
                    <div className="flex items-center gap-3">
                        <Trash2 className="text-red-500 shrink-0" size={24} strokeWidth={2} />
                        <DialogTitle className="text-xl font-black text-black uppercase tracking-tight">
                            {title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-500 font-medium leading-relaxed mt-2">
                        {description}
                        {itemName && (
                            <span className="block mt-2 font-bold text-black bg-zinc-50 py-1 px-3 rounded-lg border border-black/5 whitespace-nowrap overflow-hidden text-ellipsis">
                                {itemName}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-center w-full px-4 pb-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 rounded-2xl h-12 text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all font-bold uppercase text-xs tracking-widest"
                    >
                        {t('inventory.delete_modal.cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 rounded-2xl h-12 bg-red-500 hover:bg-red-600 text-white transition-all font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-500/20 border-none"
                    >
                        {t('inventory.delete_modal.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
