import { LogOut, ChevronsUpDown, User, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const { languages, currentLang, currentLangData, changeLanguage } = useLanguageSwitch();

    return (
        <div className="p-4">
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

                <DropdownMenuContent side="right" align="center" sideOffset={-5} className="w-56 p-2 mb-8 bg-secondary border-black/10">
                    <div className="px-2 py-1.5">
                        <div className="flex items-center gap-3 p-2 rounded-full border bg-white">
                            <Avatar className="w-9 h-9 rounded-full">
                                <AvatarImage src="/default-avatar.png" alt={user?.full_name} />
                                <AvatarFallback className="bg-zinc-200 text-zinc-500">
                                    <User size={16} />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">{user?.full_name}</span>
                                <span className="text-xs text-zinc-500 uppercase">{user?.role}</span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="px-2 py-2 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{currentLangData.flag}</span>
                                <span className="text-sm">{t('common.language')}</span>
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {languages.map((lang) => (
                                <DropdownMenuItem
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className="cursor-pointer"
                                >
                                    <span className="mr-2">{lang.label}</span>
                                    {currentLang === lang.code && <span>✓</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer px-2 py-2">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('sidebar.settings')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigate('/security')} className="cursor-pointer px-2 py-2">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>{t('sidebar.security')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={onLogoutClick}
                        className="cursor-pointer px-2 py-2 text-red-600 focus:text-red-600"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('sidebar.logout')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
