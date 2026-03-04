// ActionButton.tsx — Individual action button for the shortcut grid
import type { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
    icon: LucideIcon;
    label: string;
    shortcutKey?: string;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
    disabled?: boolean;
    badge?: string | number;
}

const variantClasses: Record<string, string> = {
    default: 'bg-zinc-600 hover:bg-zinc-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
    warning: 'bg-amber-500 hover:bg-amber-600',
};

export default function ActionButton({
    icon: Icon,
    label,
    shortcutKey,
    onClick,
    variant = 'default',
    disabled = false,
    badge,
}: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={shortcutKey ? `${label} (${shortcutKey})` : label}
            className={`relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]}`}
        >
            {shortcutKey && (
                <span className="absolute top-1 right-1.5 text-[8px] font-bold opacity-50 leading-none">
                    {shortcutKey}
                </span>
            )}
            {badge != null && (
                <span className="absolute top-1 left-1.5 text-[9px] font-black bg-white/20 rounded px-1 leading-tight">
                    {badge}
                </span>
            )}
            <Icon size={18} />
            <span className="text-[10px] font-bold leading-none">{label}</span>
        </button>
    );
}
