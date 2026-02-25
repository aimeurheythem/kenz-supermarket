import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';

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
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'warning',
    loading = false,
}: ConfirmDialogProps) {
    const titleColor = variant === 'danger' ? 'text-rose-600' : variant === 'warning' ? 'text-amber-500' : 'text-zinc-800';
    const btnClass = variant === 'danger'
        ? 'bg-rose-500 hover:bg-rose-600'
        : variant === 'warning'
            ? 'bg-amber-500 hover:bg-amber-600'
            : 'bg-zinc-900 hover:bg-zinc-800';

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl focus:outline-none">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className={`text-xl font-black uppercase tracking-tight ${titleColor}`}>
                            {title}
                        </Dialog.Title>
                        <button onClick={onClose} disabled={loading} className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50">
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    <p className="text-sm text-zinc-600 mb-6 flex flex-col gap-2">
                        {description}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 h-12 rounded-[3rem] border-2 border-zinc-200 font-black uppercase tracking-widest text-xs text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => onConfirm()}
                            disabled={loading}
                            className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-[3rem] text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 ${btnClass}`}
                        >
                            {loading ? '...' : confirmLabel}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
