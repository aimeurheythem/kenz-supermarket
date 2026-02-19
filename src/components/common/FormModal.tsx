import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;
    icon?: ReactNode;
}

export function FormModal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    maxWidth = 'max-w-2xl',
    icon,
}: FormModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn('flex flex-col max-h-[90vh] p-0 overflow-hidden', maxWidth)}>
                {/* Header */}
                <DialogHeader className="p-8 pb-4 flex flex-col items-start gap-4">
                    <div className="flex items-center gap-4 w-full">
                        {icon && (
                            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                                {icon}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-black text-black uppercase tracking-tight truncate">
                                {title}
                            </DialogTitle>
                            {description && (
                                <DialogDescription className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-1">
                                    {description}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 pt-2 custom-scrollbar">{children}</div>

                {/* Footer */}
                {footer && <div className="p-8 pt-0">{footer}</div>}
            </DialogContent>
        </Dialog>
    );
}
