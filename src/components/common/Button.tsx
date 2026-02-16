import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps {
    children: ReactNode;
    onClick?: ((e: React.MouseEvent<HTMLButtonElement>) => void) | (() => void);
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    icon?: ReactNode;
}

const variants = {
    primary: 'bg-accent text-accent-text border-accent hover:bg-accent-hover',
    secondary: 'bg-primary text-secondary border-default hover:bg-secondary hover:border-hover',
    danger: 'bg-danger text-white border-danger hover:bg-red-700',
    ghost: 'text-muted hover:text-secondary hover:bg-tertiary border-transparent',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
};

export default function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    className,
    icon,
}: ButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
                'transition-all duration-150 cursor-pointer',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-[0.98]',
                'border',
                variants[variant],
                sizes[size],
                className
            )}
        >
            {icon}
            {children}
        </button>
    );
}
