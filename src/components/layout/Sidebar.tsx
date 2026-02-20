import { useState } from 'react';
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
    Wallet,
    HelpCircle,
    Scale,
    DollarSign,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { motion } from 'framer-motion';
import SidebarNavGroup from '@/components/layout/SidebarNavGroup';
import SidebarUserMenu from '@/components/layout/SidebarUserMenu';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import type { NavGroup } from '@/components/layout/SidebarNavGroup';

export default function Sidebar() {
    const { t } = useTranslation();
    const { isSidebarCollapsed: collapsed } = useLayoutStore();
    const { user, logout } = useAuthStore();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const menuGroups: NavGroup[] = [
        {
            title: t('sidebar.general') || 'General',
            items: [
                {
                    label: t('sidebar.dashboard'),
                    path: '/',
                    icon: LayoutDashboard,
                    roles: ['admin', 'manager', 'cashier'],
                },
            ],
        },
        {
            title: t('sidebar.operations') || 'Operations',
            items: [
                {
                    label: t('sidebar.pos_sales'),
                    path: '/pos',
                    icon: ShoppingCart,
                    roles: ['admin', 'manager', 'cashier'],
                },
                { label: t('sidebar.inventory'), path: '/inventory', icon: Package, roles: ['admin', 'manager'] },
                { label: t('sidebar.barcodes'), path: '/barcodes', icon: ScanBarcode, roles: ['admin', 'manager'] },
                { label: t('sidebar.stock_control'), path: '/stock', icon: ClipboardList, roles: ['admin', 'manager'] },
            ],
        },
        {
            title: t('sidebar.supply_chain') || 'Supply Chain',
            items: [
                { label: t('sidebar.suppliers'), path: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
                { label: t('sidebar.purchases'), path: '/purchases', icon: ScanBarcode, roles: ['admin', 'manager'] },
                { label: t('sidebar.credit'), path: '/credit', icon: Wallet, roles: ['admin', 'manager'] },
                { label: t('sidebar.expenses'), path: '/expenses', icon: DollarSign, roles: ['admin', 'manager'] },
            ],
        },
        {
            title: t('sidebar.management') || 'Management',
            items: [
                { label: t('sidebar.reports'), path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
                {
                    label: t('sidebar.transactions'),
                    path: '/transactions',
                    icon: ClipboardList,
                    roles: ['admin', 'manager'],
                },
                { label: t('sidebar.audit_logs'), path: '/audit-logs', icon: ShieldCheck, roles: ['admin'] },
                {
                    label: t('sidebar.customers'),
                    path: '/customers',
                    icon: Users,
                    roles: ['admin', 'manager', 'cashier'],
                },
                { label: t('sidebar.users'), path: '/users', icon: Users, roles: ['admin'] },
            ],
        },
    ];

    const supportGroup: NavGroup = {
        title: t('sidebar.support') || 'Support',
        items: [
            { label: t('sidebar.help'), path: '/help', icon: HelpCircle, roles: ['admin', 'manager', 'cashier'] },
            { label: t('sidebar.terms'), path: '/terms', icon: Scale, roles: ['admin', 'manager', 'cashier'] },
        ],
    };

    return (
        <aside
            className={cn(
                'h-full flex flex-col z-40 bg-secondary transition-all duration-300 ease-in-out shrink-0 app-drag-region relative',
                collapsed ? 'w-20' : 'w-64',
            )}
        >
            {/* Logo Section */}
            <div
                className={cn(
                    'h-24 flex items-center transition-all duration-300',
                    collapsed ? 'justify-center px-0' : 'px-6',
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
                        <img src="/kenzy-dash-logo-light.svg" alt="SuperMarket Pro" className="w-5 h-5 invert" />
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <span className="text-sm font-bold tracking-tight text-black leading-tight">
                                SuperMarket Pro
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-black/30 font-medium">
                                Dashboard
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav
                className={cn(
                    'flex-1 overflow-y-auto py-4 space-y-8 custom-scrollbar scrollbar-hide flex flex-col',
                    collapsed && 'justify-center',
                )}
            >
                {menuGroups.map((group) => (
                    <SidebarNavGroup
                        key={group.title}
                        group={group}
                        collapsed={collapsed}
                        userRole={user?.role || ''}
                    />
                ))}
            </nav>

            {/* Support Section */}
            <div className="mt-auto pb-4">
                <SidebarNavGroup group={supportGroup} collapsed={collapsed} userRole={user?.role || ''} />
            </div>

            {/* User Menu */}
            <SidebarUserMenu user={user} collapsed={collapsed} onLogoutClick={() => setIsLogoutModalOpen(true)} />

            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onLogout={logout}
            />
        </aside>
    );
}
