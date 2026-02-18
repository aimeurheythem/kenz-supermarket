import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/common/Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'warning',
    loading = false,
}: ConfirmDialogProps) {
    const iconColor = variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-amber-500' : 'text-zinc-500';
    const btnClass = variant === 'danger'
        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-none'
        : variant === 'warning'
            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 border-none'
            : 'bg-zinc-900 hover:bg-zinc-800 text-white border-none';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-[400px]">
                <DialogHeader className="pt-4 px-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`${iconColor} shrink-0`} size={24} strokeWidth={2} />
                        <DialogTitle className="text-xl font-black text-black uppercase tracking-tight">
                            {title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-500 font-medium leading-relaxed mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-center w-full px-4 pb-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-2xl h-12 text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all font-bold uppercase text-xs tracking-widest"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                        }}
                        disabled={loading}
                        className={`flex-1 rounded-2xl h-12 transition-all font-bold uppercase text-xs tracking-widest ${btnClass}`}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
