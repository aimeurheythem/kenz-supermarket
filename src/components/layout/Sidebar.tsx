import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    ClipboardList,
    Truck,
    ScanBarcode,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Wallet,
    HelpCircle,
    Scale,
    ChevronUp,
    ChevronsUpDown,
    User,
    Languages,
    DollarSign,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import Portal from '../common/Portal';

export default function Sidebar() {
    const { t, i18n } = useTranslation();
    const { isSidebarCollapsed: collapsed } = useLayoutStore();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLanguagesOpen, setIsLanguagesOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const setLanguageSwitching = useLayoutStore(state => state.setLanguageSwitching);

    const languages = [
        { code: 'en', label: 'English', flag: 'EN' },
        { code: 'fr', label: 'Français', flag: 'FR' },
        { code: 'ar', label: 'العربية', flag: 'AR' }
    ];

    const changeLanguage = async (lang: string) => {
        if (i18n.language.split('-')[0] === lang) {
            setIsLanguagesOpen(false);
            return;
        }

        setLanguageSwitching(true);
        setIsUserMenuOpen(false);
        setIsLanguagesOpen(false);

        await new Promise(resolve => setTimeout(resolve, 2800));
        i18n.changeLanguage(lang);
        await new Promise(resolve => setTimeout(resolve, 2200));

        setLanguageSwitching(false);
    };

    const currentLang = i18n.language.split('-')[0];
    const currentLangData = languages.find(l => l.code === currentLang) || languages[0];

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const menuGroups = [
        {
            title: t('sidebar.general') || "General",
            items: [
                { label: t('sidebar.dashboard'), path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
            ]
        },
        {
            title: t('sidebar.operations') || "Operations",
            items: [
                { label: t('sidebar.pos_sales'), path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
                { label: t('sidebar.inventory'), path: '/inventory', icon: Package, roles: ['admin', 'manager'] },
                { label: t('sidebar.barcodes'), path: '/barcodes', icon: ScanBarcode, roles: ['admin', 'manager'] },
                { label: t('sidebar.stock_control'), path: '/stock', icon: ClipboardList, roles: ['admin', 'manager'] },
            ]
        },
        {
            title: t('sidebar.supply_chain') || "Supply Chain",
            items: [
                { label: t('sidebar.suppliers'), path: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
                { label: t('sidebar.purchases'), path: '/purchases', icon: ScanBarcode, roles: ['admin', 'manager'] },
                { label: t('sidebar.credit'), path: '/credit', icon: Wallet, roles: ['admin', 'manager'] },
                { label: t('sidebar.expenses'), path: '/expenses', icon: DollarSign, roles: ['admin', 'manager'] },
            ]
        },
        {
            title: t('sidebar.management') || "Management",
            items: [
                { label: t('sidebar.reports'), path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
                { label: t('sidebar.transactions'), path: '/transactions', icon: ClipboardList, roles: ['admin', 'manager'] },
                { label: t('sidebar.audit_logs'), path: '/audit-logs', icon: ShieldCheck, roles: ['admin'] },
                { label: t('sidebar.customers'), path: '/customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
                { label: t('sidebar.users'), path: '/users', icon: Users, roles: ['admin'] },
                { label: t('sidebar.settings'), path: '/settings', icon: Settings, roles: ['admin'] },
            ]
        },
    ];

    const supportGroup = {
        title: t('sidebar.support') || "Support",
        items: [
            { label: t('sidebar.help'), path: '/help', icon: HelpCircle, roles: ['admin', 'manager', 'cashier'] },
            { label: t('sidebar.terms'), path: '/terms', icon: Scale, roles: ['admin', 'manager', 'cashier'] },
        ]
    };

    return (
        <aside
            className={cn(
                'h-full flex flex-col z-40 bg-secondary transition-all duration-300 ease-in-out shrink-0 app-drag-region relative',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo Section */}
            <div className={cn(
                "h-24 flex items-center transition-all duration-300",
                collapsed ? "justify-center px-0" : "px-6"
            )}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
                        <img
                            src="/kenzy-dash-logo-light.svg"
                            alt="Logo"
                            className="w-5 h-5 invert"
                        />
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <span
                                className="text-sm font-bold tracking-tight text-black leading-tight"
                            >
                                Kenzy
                            </span>
                            <span
                                className="text-[10px] uppercase tracking-[0.2em] text-black/30 font-medium"
                            >
                                Dashboard
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className={cn(
                "flex-1 overflow-y-auto py-4 space-y-8 custom-scrollbar scrollbar-hide flex flex-col",
                collapsed && "justify-center"
            )}>
                {menuGroups.map((group) => {
                    const filteredItems = group.items.filter(item => !item.roles || item.roles.includes(user?.role || ''));
                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={group.title} className={cn(collapsed ? "px-0" : "px-4")}>
                            {!collapsed && (
                                <h3
                                    className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em] mb-4 px-4"
                                >
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {filteredItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                'group relative flex items-center h-10 transition-all duration-300 app-no-drag rounded-xl',
                                                collapsed ? 'justify-center mx-2' : 'px-4 gap-3 mx-2',
                                                isActive ? 'text-black' : 'text-black/50 hover:text-black'
                                            )}
                                        >
                                            {/* Surgical Line Indicator */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-indicator"
                                                    className="absolute ltr:left-0 rtl:right-0 w-1 h-3.5 bg-black rounded-full z-20"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}

                                            <div className={cn(
                                                "w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300",
                                                isActive ? "scale-100" : "group-hover:scale-105"
                                            )}>
                                                <item.icon
                                                    size={17}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={cn(
                                                        "transition-colors duration-300",
                                                        isActive ? "text-black" : "text-black/30 group-hover:text-black"
                                                    )}
                                                />
                                            </div>

                                            {!collapsed && (
                                                <span
                                                    className="relative z-10 text-[13px] font-semibold tracking-[-0.01em] whitespace-nowrap overflow-hidden transition-colors"
                                                >
                                                    {item.label}
                                                </span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Support Section - Moved to Bottom */}
            <div className="mt-auto pb-4">
                <div key={supportGroup.title} className={cn(collapsed ? "px-0" : "px-4")}>
                    {!collapsed && (
                        <h3
                            className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em] mb-4 px-4"
                        >
                            {supportGroup.title}
                        </h3>
                    )}
                    <div className="space-y-1">
                        {supportGroup.items.filter(item => !item.roles || item.roles.includes(user?.role || '')).map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        'group relative flex items-center h-10 transition-all duration-300 app-no-drag rounded-xl',
                                        collapsed ? 'justify-center mx-2' : 'px-4 gap-3 mx-2',
                                        isActive ? 'text-black' : 'text-black/50 hover:text-black'
                                    )}
                                >
                                    {/* Surgical Line Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-indicator"
                                            className="absolute ltr:left-0 rtl:right-0 w-1 h-3.5 bg-black rounded-full z-20"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}

                                    <div className={cn(
                                        "w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300",
                                        isActive ? "scale-100" : "group-hover:scale-105"
                                    )}>
                                        <item.icon
                                            size={17}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={cn(
                                                "transition-colors duration-300",
                                                isActive ? "text-black" : "text-black/30 group-hover:text-black"
                                            )}
                                        />
                                    </div>

                                    {!collapsed && (
                                        <span
                                            className="relative z-10 text-[13px] font-semibold tracking-[-0.01em] whitespace-nowrap overflow-hidden transition-colors"
                                        >
                                            {item.label}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sidebar Footer - Consolidated User Pill with Shadcn Dropdown */}
            <div className="p-4 border-t border-black/[0.04] relative">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                "group flex items-center p-2 rounded-2xl transition-all duration-300 w-full relative z-10 app-no-drag outline-none",
                                "text-black/60 hover:text-black",
                                collapsed ? "justify-center" : "gap-3 px-3 h-14"
                            )}
                        >
                            <Avatar className="w-10 h-10 rounded-xl group-hover:scale-105 transition-transform duration-300 border border-black/[0.05] bg-black/[0.02]">
                                <AvatarImage
                                    src="/default-avatar.png"
                                    alt={user?.full_name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-black/[0.05] text-black/20">
                                    <User size={18} />
                                </AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <>
                                    <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden text-left">
                                        <span
                                            className="text-[13px] font-bold text-black truncate leading-tight w-full"
                                        >
                                            {user?.full_name}
                                        </span>
                                        <span
                                            className="text-[9px] text-black/30 font-bold uppercase tracking-[0.05em] mt-0.5 truncate w-full"
                                        >
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
                        align={collapsed ? "center" : "start"}
                        sideOffset={10}
                        className={cn(
                            "w-64 p-2 rounded-2xl bg-white border border-black/[0.05] shadow-xl shadow-black/5 animate-in slide-in-from-bottom-2 duration-300 z-[100]",
                            collapsed && "ml-2"
                        )}
                    >
                        {/* User Header in Menu */}
                        <div className="p-3 mb-2 flex items-center gap-3 rounded-xl border border-black/[0.03] bg-black/[0.01]">
                            <Avatar className="w-10 h-10 rounded-lg border border-black/[0.05] bg-black/[0.02]">
                                <AvatarImage
                                    src="/default-avatar.png"
                                    alt={user?.full_name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-black/[0.05] text-black/20">
                                    <User size={18} />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span
                                    className="text-[14px] font-bold text-black truncate leading-tight"
                                >
                                    {user?.full_name}
                                </span>
                                <span
                                    className="text-[9px] text-black/30 font-bold uppercase tracking-[0.05em]"
                                >
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {/* Languages Submenu */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 h-10 rounded-xl transition-all duration-200 group/lang outline-none focus:bg-black/[0.02] data-[state=open]:bg-black/[0.02] cursor-pointer",
                                        "text-black/40 hover:text-black data-[state=open]:text-black"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-5 h-5 rounded-md bg-black/[0.04] flex items-center justify-center text-[9px] font-bold text-black/40 group-hover/lang:bg-black group-hover/lang:text-white transition-colors">
                                            {currentLangData.flag}
                                        </div>
                                        <span
                                            className="text-[13px] font-bold"
                                        >
                                            {t('common.language') || "Language"}
                                        </span>
                                    </div>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                    className="min-w-[150px] p-1 bg-white border border-black/[0.05] rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95"
                                    sideOffset={8}
                                >
                                    {languages.map((lang) => (
                                        <DropdownMenuItem
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 h-9 rounded-lg transition-all duration-200 font-bold cursor-pointer outline-none mb-0.5",
                                                currentLang === lang.code ? "bg-black/[0.04] text-black" : "text-black/30 hover:text-black focus:bg-black/[0.02]"
                                            )}
                                        >
                                            <span
                                                className="text-[11px] uppercase tracking-wider"
                                                style={{ fontFamily: lang.code === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                                            >
                                                {lang.label}
                                            </span>
                                            {currentLang === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator className="bg-black/[0.03] mx-2" />

                            <DropdownMenuItem
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-black/40 hover:text-red-500 hover:bg-red-50 focus:bg-red-50 transition-all duration-200 font-medium text-sm cursor-pointer outline-none group/logout"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-50/50 text-red-500 flex items-center justify-center shrink-0 group-hover/logout:bg-red-500 group-hover/logout:text-white transition-colors">
                                    <LogOut size={14} strokeWidth={2.5} />
                                </div>
                                <span
                                    className="text-[13px] font-bold group-hover/logout:text-red-500 transition-colors"
                                >
                                    {t('sidebar.logout')}
                                </span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Logout Modal */}
            <AnimatePresence>
                {isLogoutModalOpen && (
                    <Portal>
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setIsLogoutModalOpen(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-bold text-black mb-1">
                                        {t('sidebar.signout_title', 'Sign out?')}
                                    </h3>
                                    <p className="text-black/40 text-sm">
                                        {t('sidebar.signout_desc', "You'll need to sign in again to access your account dashboard.")}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsLogoutModalOpen(false)}
                                        className="flex-1 py-2.5 bg-gray-50 text-black font-bold rounded-xl transition-all hover:bg-gray-100"
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await logout();
                                        }}
                                        className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl transition-all hover:bg-red-600"
                                    >
                                        {t('sidebar.signout_confirm', 'Sign out')}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>
        </aside>
    );
}
