import { useState, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Portal from './Portal';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                ref={overlayRef}
                onClick={(e) => {
                    if (e.target === overlayRef.current) onClose();
                }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-fadeIn"
            >
                <div
                    className={cn(
                        'w-full bg-primary border border-default rounded-xl',
                        'animate-scaleIn',
                        maxWidth
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-default">
                        <h2 className="text-base font-semibold text-primary">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md text-muted hover:text-secondary hover:bg-tertiary transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </Portal>
    );
}
