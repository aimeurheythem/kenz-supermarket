import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { useUserStore } from '@/stores/useUserStore';
import { Check, ChevronDown, User as UserIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CashierSelectorProps {
    selectedCashier: User | null;
    onSelect: (user: User | null) => void;
}

export default function CashierSelector({ selectedCashier, onSelect }: CashierSelectorProps) {
    const { users, loadUsers } = useUserStore();

    useEffect(() => {
        loadUsers();
    }, []);

    const cashiers = users.filter((u) => u.role === 'cashier' && u.is_active);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 px-3.5 py-3 rounded-md",
                        "bg-[var(--color-bg-card)]",
                        "text-md font-medium text-[var(--color-text-primary)]",
                        "hover:bg-[var(--color-bg-hover)] transition-all duration-200 outline-none",
                        "focus:ring-2 focus:ring-[var(--color-accent)]/20"
                    )}
                >
                    <div className="flex items-center justify-center">
                        <UserIcon size={12} className="text-[var(--color-text-muted)]" />
                    </div>
                    <span>{selectedCashier ? selectedCashier.full_name : 'Select Cashier'}</span>
                    <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-41 rounded-[1rem] bg-[var(--color-bg-card)] border-[var(--color-border)]">
                <div className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Cashiers
                </div>
                <DropdownMenuItem
                    onClick={() => onSelect(null)}
                    className={cn(
                        "cursor-pointer text-[var(--color-text-primary)] focus:bg-[var(--color-bg-hover)]",
                        "flex items-center justify-between"
                    )}
                >
                    <span>All Cashiers</span>
                    {selectedCashier === null && (
                        <Check size={14} className="text-accent" />
                    )}
                </DropdownMenuItem>
                {cashiers.map((cashier) => (
                    <DropdownMenuItem
                        key={cashier.id}
                        onClick={() => onSelect(cashier)}
                        className={cn(
                            "cursor-pointer text-[var(--color-text-primary)] focus:bg-[var(--color-bg-hover)]",
                            "flex items-center justify-between"
                        )}
                    >
                        <span>{cashier.full_name}</span>
                        {selectedCashier?.id === cashier.id && (
                            <Check size={14} className="text-accent" />
                        )}
                    </DropdownMenuItem>
                ))}
                {cashiers.length === 0 && (
                    <div className="px-2 py-3 text-sm text-[var(--color-text-muted)] text-center">
                        No cashiers found
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
