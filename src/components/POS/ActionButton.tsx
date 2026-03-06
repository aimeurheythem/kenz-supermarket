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
        bg: 'bg-zinc-800 hover:bg-zinc-700',
        icon: 'text-white',
        text: 'text-white',
    },
    danger: {
        bg: 'bg-red-500 hover:bg-red-600',
        icon: 'text-white',
        text: 'text-white',
    },
    success: {
        bg: 'bg-emerald-500 hover:bg-emerald-600',
        icon: 'text-white',
        text: 'text-white',
    },
    warning: {
        bg: 'bg-amber-500 hover:bg-amber-600',
        icon: 'text-white',
        text: 'text-white',
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
            className={`relative flex items-center justify-center gap-2 lg:gap-3 w-full py-3 lg:py-4 xl:py-5 border-b border-white/10 text-sm lg:text-base xl:text-xl font-black uppercase tracking-wider transition-all duration-150 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${style.bg}`}
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
