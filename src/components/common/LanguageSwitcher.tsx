import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';

interface LanguageSwitcherProps {
    collapsed?: boolean;
}

export default function LanguageSwitcher({ collapsed = false }: LanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { languages, currentLang, currentLangData, changeLanguage } = useLanguageSwitch();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChangeLanguage = async (lang: string) => {
        setIsOpen(false);
        await changeLanguage(lang);
    };

    return (
        <div className="relative w-full" ref={menuRef}>
            {/* Language Selection Menu */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute bottom-full left-0 right-0 mb-2 bg-secondary border border-default rounded-lg p-2 animate-scaleIn z-50 overflow-hidden',
                        collapsed && 'w-[160px] left-0',
                    )}
                >
                    <div className="flex flex-col gap-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleChangeLanguage(lang.code)}
                                className={cn(
                                    'flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 group/item app-no-drag',
                                    currentLang === lang.code
                                        ? 'bg-primary text-text-primary border border-default'
                                        : 'text-muted hover:bg-tertiary hover:text-text-primary',
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-heading font-medium">{lang.flag}</span>
                                    <span
                                        className="text-sm font-primary"
                                        style={{ fontFamily: lang.code === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                                    >
                                        {lang.label}
                                    </span>
                                </div>
                                {currentLang === lang.code && <Check size={14} className="text-accent" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-primary font-medium w-full app-no-drag transition-all duration-200',
                    isOpen
                        ? 'bg-primary border border-default text-text-primary'
                        : 'bg-primary border border-default text-muted hover:bg-secondary hover:text-text-primary',
                    collapsed && 'justify-center px-0',
                )}
            >
                <div className="relative shrink-0 text-muted">
                    <Globe size={18} />
                </div>
                {!collapsed && (
                    <>
                        <span
                            className="flex-1 text-left animate-fadeIn"
                            style={{ fontFamily: currentLang === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                        >
                            {currentLangData.label}
                        </span>
                        <ChevronUp
                            size={14}
                            className={cn('transition-transform duration-200 text-muted', isOpen && 'rotate-180')}
                        />
                    </>
                )}
            </button>
        </div>
    );
}
