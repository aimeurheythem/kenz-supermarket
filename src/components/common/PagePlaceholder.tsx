interface PagePlaceholderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

export default function PagePlaceholder({ title, description, icon }: PagePlaceholderProps) {
    return (
        <div className="h-full flex items-center justify-center animate-fadeIn">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-[var(--radius-xl)] bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-md">{description}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                    <span className="text-xs text-[var(--color-text-muted)]">Coming soon</span>
                </div>
            </div>
        </div>
    );
}
