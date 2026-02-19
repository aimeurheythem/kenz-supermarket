import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
    return (
        <div className={cn('relative', className)}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    'w-full pl-9 pr-4 py-2 rounded-lg',
                    'bg-primary border border-default',
                    'text-sm text-primary placeholder:text-placeholder',
                    'focus:outline-none focus:border-focus',
                    'transition-all duration-150',
                )}
            />
        </div>
    );
}
