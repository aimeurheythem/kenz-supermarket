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
        bg: 'bg-zinc-900 hover:bg-zinc-800',
        icon: 'text-zinc-400',
        text: 'text-white',
    },
    danger: {
        bg: 'bg-red-950/80 hover:bg-red-900/80',
        icon: 'text-red-400',
        text: 'text-red-100',
    },
    success: {
        bg: 'bg-emerald-600 hover:bg-emerald-500',
        icon: 'text-emerald-200',
        text: 'text-white',
    },
    warning: {
        bg: 'bg-amber-950/80 hover:bg-amber-900/80',
        icon: 'text-amber-400',
        text: 'text-amber-100',
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
            className={`relative flex items-center justify-center gap-2 lg:gap-3 w-full flex-1 min-h-0 border-b border-white/[0.06] text-sm lg:text-base xl:text-lg font-black uppercase tracking-wider transition-all duration-150 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${style.bg}`}
        >
            {badge != null && (
                <span className="absolute top-1.5 left-2 lg:left-3 text-[9px] lg:text-[10px] font-semibold text-white/70 bg-white/20 rounded-full px-1.5 lg:px-2 py-0.5 leading-none">
                    {badge}
                </span>
            )}
            <Icon size={18} strokeWidth={1.5} className={`lg:hidden ${style.icon}`} />
            <Icon size={22} strokeWidth={1.5} className={`hidden lg:block ${style.icon}`} />
            <span className={style.text}>{label}</span>
            {shortcutKey && (
                <span className="absolute right-2 lg:right-3 text-[9px] lg:text-[10px] font-medium text-white/40 leading-none">
                    {shortcutKey}
                </span>
            )}
        </button>
    );
}
