import { useState } from 'react';
import { LogOut, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarUserMenuProps {
    user: { full_name: string; role: string } | null;
    collapsed: boolean;
    onLogoutClick: () => void;
}

export default function SidebarUserMenu({ user, collapsed, onLogoutClick }: SidebarUserMenuProps) {
    const { t } = useTranslation();
    const { languages, currentLang, currentLangData, changeLanguage } = useLanguageSwitch();
    const [_isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [_isLanguagesOpen, setIsLanguagesOpen] = useState(false);

    const handleChangeLanguage = async (lang: string) => {
        setIsUserMenuOpen(false);
        setIsLanguagesOpen(false);
        await changeLanguage(lang);
    };

    return (
        <div className="p-4 border-t border-black/[0.04] relative">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            'group flex items-center p-2 rounded-2xl transition-all duration-300 w-full relative z-10 app-no-drag outline-none',
                            'text-black/60 hover:text-black',
                            collapsed ? 'justify-center' : 'gap-3 px-3 h-14',
                        )}
                    >
                        <Avatar className="w-10 h-10 rounded-xl group-hover:scale-105 transition-transform duration-300 border border-black/[0.05] bg-black/[0.02]">
                            <AvatarImage src="/default-avatar.png" alt={user?.full_name} className="object-cover" />
                            <AvatarFallback className="bg-black/[0.05] text-black/20">
                                <User size={18} />
                            </AvatarFallback>
                        </Avatar>
                        {!collapsed && (
                            <>
                                <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden text-left">
                                    <span className="text-[13px] font-bold text-black truncate leading-tight w-full">
                                        {user?.full_name}
                                    </span>
                                    <span className="text-[9px] text-black/30 font-bold uppercase tracking-[0.05em] mt-0.5 truncate w-full">
                                        {user?.role}
                                    </span>
                                </div>
                                <ChevronsUpDown size={14} className="text-black/20 shrink-0" />
                            </>
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    side="top"
                    align={collapsed ? 'center' : 'start'}
                    sideOffset={10}
                    className={cn(
                        'w-64 p-2 rounded-2xl bg-white border border-black/[0.05] shadow-xl shadow-black/5 animate-in slide-in-from-bottom-2 duration-300 z-[100]',
                        collapsed && 'ml-2',
                    )}
                >
                    {/* User Header in Menu */}
                    <div className="p-3 mb-2 flex items-center gap-3 rounded-xl border border-black/[0.03] bg-black/[0.01]">
                        <Avatar className="w-10 h-10 rounded-lg border border-black/[0.05] bg-black/[0.02]">
                            <AvatarImage src="/default-avatar.png" alt={user?.full_name} className="object-cover" />
                            <AvatarFallback className="bg-black/[0.05] text-black/20">
                                <User size={18} />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-bold text-black truncate leading-tight">
                                {user?.full_name}
                            </span>
                            <span className="text-[9px] text-black/30 font-bold uppercase tracking-[0.05em]">
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {/* Languages Submenu */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger
                                className={cn(
                                    'w-full flex items-center justify-between px-3 h-10 rounded-xl transition-all duration-200 group/lang outline-none focus:bg-black/[0.02] data-[state=open]:bg-black/[0.02] cursor-pointer',
                                    'text-black/40 hover:text-black data-[state=open]:text-black',
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-md bg-black/[0.04] flex items-center justify-center text-[9px] font-bold text-black/40 group-hover/lang:bg-black group-hover/lang:text-white transition-colors">
                                        {currentLangData.flag}
                                    </div>
                                    <span className="text-[13px] font-bold">{t('common.language') || 'Language'}</span>
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                                className="min-w-[150px] p-1 bg-white border border-black/[0.05] rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95"
                                sideOffset={8}
                            >
                                {languages.map((lang) => (
                                    <DropdownMenuItem
                                        key={lang.code}
                                        onClick={() => handleChangeLanguage(lang.code)}
                                        className={cn(
                                            'w-full flex items-center justify-between px-3 h-9 rounded-lg transition-all duration-200 font-bold cursor-pointer outline-none mb-0.5',
                                            currentLang === lang.code
                                                ? 'bg-black/[0.04] text-black'
                                                : 'text-black/30 hover:text-black focus:bg-black/[0.02]',
                                        )}
                                    >
                                        <span
                                            className="text-[11px] uppercase tracking-wider"
                                            style={{
                                                fontFamily: lang.code === 'ar' ? '"Cairo", sans-serif' : 'inherit',
                                            }}
                                        >
                                            {lang.label}
                                        </span>
                                        {currentLang === lang.code && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator className="bg-black/[0.03] mx-2" />

                        <DropdownMenuItem
                            onClick={onLogoutClick}
                            className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-black/40 hover:text-red-500 hover:bg-red-50 focus:bg-red-50 transition-all duration-200 font-medium text-sm cursor-pointer outline-none group/logout"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-50/50 text-red-500 flex items-center justify-center shrink-0 group-hover/logout:bg-red-500 group-hover/logout:text-white transition-colors">
                                <LogOut size={14} strokeWidth={2.5} />
                            </div>
                            <span className="text-[13px] font-bold group-hover/logout:text-red-500 transition-colors">
                                {t('sidebar.logout')}
                            </span>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
