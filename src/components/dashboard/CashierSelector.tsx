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
    onSelect: (user: User) => void;
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
                        "bg-black",
                        "text-md font-medium text-white",
                        "hover:bg-neutral-700 transition-all duration-200 outline-none",
                        "focus:ring-2 focus:ring-[var(--color-accent)]/20"
                    )}
                >
                    <div className="flex items-center justify-center">
                        <UserIcon size={12} className="text-white" />
                    </div>
                    <span>{selectedCashier ? selectedCashier.full_name : 'Select Cashier'}</span>
                    <ChevronDown size={14} className="text-white" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-41 rounded-[1rem] bg-neutral-800 border-neutral-700">
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Cashiers
                </div>
                {cashiers.map((cashier) => (
                    <DropdownMenuItem
                        key={cashier.id}
                        onClick={() => onSelect(cashier)}
                        className={cn(
                            "cursor-pointer text-white focus:bg-neutral-700",
                            "flex items-center justify-between"
                        )}
                    >
                        <span>{cashier.full_name}</span>
                        {selectedCashier?.id === cashier.id && (
                            <Check size={14} className="text-white" />
                        )}
                    </DropdownMenuItem>
                ))}
                {cashiers.length === 0 && (
                    <div className="px-2 py-3 text-sm text-neutral-500 text-center">
                        No cashiers found
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
