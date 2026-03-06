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

const variantStyles: Record<string, { bg: string; icon: string; text: string }> = {
    default: {
        bg: 'bg-zinc-50 hover:bg-zinc-100 border border-zinc-150',
        icon: 'text-zinc-500',
        text: 'text-zinc-600',
    },
    danger: {
        bg: 'bg-red-50 hover:bg-red-100 border border-red-100',
        icon: 'text-red-400',
        text: 'text-red-600',
    },
    success: {
        bg: 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-100',
        icon: 'text-emerald-400',
        text: 'text-emerald-600',
    },
    warning: {
        bg: 'bg-amber-50 hover:bg-amber-100 border border-amber-100',
        icon: 'text-amber-400',
        text: 'text-amber-600',
    },
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
    const style = variantStyles[variant] ?? variantStyles.default;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={shortcutKey ? `${label} (${shortcutKey})` : label}
            className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-150 active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed ${style.bg}`}
        >
            {shortcutKey && (
                <span className="absolute top-1.5 right-2 text-[8px] font-medium text-zinc-300 leading-none">
                    {shortcutKey}
                </span>
            )}
            {badge != null && (
                <span className="absolute top-1.5 left-2 text-[8px] font-semibold text-zinc-400 bg-zinc-100 rounded-full px-1.5 py-0.5 leading-none">
                    {badge}
                </span>
            )}
            <Icon size={18} strokeWidth={1.5} className={style.icon} />
            <span className={`text-[10px] font-semibold leading-none ${style.text}`}>{label}</span>
        </button>
    );
}
