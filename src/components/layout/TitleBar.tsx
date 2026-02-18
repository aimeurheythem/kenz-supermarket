import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Minus, Square, X, Copy, PanelLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useTranslation } from 'react-i18next';

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const { isSidebarCollapsed: collapsed, toggleSidebar } = useLayoutStore();
    const location = useLocation();
    const { t } = useTranslation();

    const getBreadcrumbs = () => {
        const path = location.pathname;
        const breadcrumbs = [{ label: t('sidebar.dashboard'), path: '/' }];

        if (path === '/') return breadcrumbs;

        const pathMap: Record<string, string> = {
            '/inventory': t('sidebar.inventory'),
            '/pos': t('sidebar.pos_sales'),
            '/stock': t('sidebar.stock_control'),
            '/suppliers': t('sidebar.suppliers'),
            '/purchases': t('sidebar.purchases'),
            '/reports': t('sidebar.reports'),
            '/users': t('sidebar.users'),
            '/settings': t('sidebar.settings'),
            '/barcodes': t('sidebar.barcodes'),
            '/credit': t('sidebar.credit'),
            '/expenses': t('sidebar.expenses'),
            '/transactions': t('sidebar.transactions'),
            '/audit-logs': t('sidebar.audit_logs'),
            '/customers': t('sidebar.customers'),
            '/help': t('sidebar.help'),
            '/terms': t('sidebar.terms'),
            '/onboarding': t('sidebar.onboarding'),
        };

        if (pathMap[path]) {
            breadcrumbs.push({ label: pathMap[path], path });
        }

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    useEffect(() => {
        window.electronAPI?.isMaximized().then(setIsMaximized);
        window.electronAPI?.onMaximizedChange(setIsMaximized);
    }, []);

    const isElectron = !!window.electronAPI;

    return (
        <header
            className={cn(
                'h-16 flex items-center justify-between px-8 select-none',
                isElectron && 'app-drag-region'
            )}
        >
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-md text-muted hover:text-text-primary hover:bg-tertiary transition-all app-no-drag active:scale-95"
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <PanelLeft size={16} className={cn('transition-colors', !collapsed && 'text-accent')} />
                </button>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 ltr:ml-2 rtl:mr-2 overflow-hidden whitespace-nowrap">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.path} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight size={12} className="text-muted shrink-0" />}
                            <span className={cn(
                                "text-sm font-primary font-medium tracking-tight transition-colors",
                                index === breadcrumbs.length - 1 ? "text-text-primary" : "text-muted"
                            )}>
                                {crumb.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1" />

            {isElectron && (
                <div className="fixed top-0 ltr:right-0 rtl:left-0 h-10 flex items-center gap-0.5 px-3 z-[9999] app-no-drag pointer-events-auto">
                    {/* Minimize */}
                    <button
                        onClick={() => window.electronAPI?.minimizeWindow()}
                        className="group flex items-center justify-center w-10 min-h-full hover:bg-black/[0.08] active:bg-black/[0.12] transition-colors duration-200"
                        title="Minimize"
                    >
                        <Minus size={15} strokeWidth={2} className="text-black/40 group-hover:text-black transition-colors" />
                    </button>

                    {/* Maximize/Restore */}
                    <button
                        onClick={() => window.electronAPI?.maximizeWindow()}
                        className="group flex items-center justify-center w-10 min-h-full hover:bg-black/[0.08] active:bg-black/[0.12] transition-colors duration-200"
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        {isMaximized ? (
                            <Copy size={13} strokeWidth={2} className="text-black/40 group-hover:text-black transition-colors" />
                        ) : (
                            <Square size={13} strokeWidth={2} className="text-black/40 group-hover:text-black transition-colors" />
                        )}
                    </button>

                    {/* Close */}
                    <button
                        onClick={() => window.electronAPI?.closeWindow()}
                        className="group flex items-center justify-center w-11 min-h-full hover:bg-[#E81123] active:bg-[#AC0F1C] transition-colors duration-200"
                        title="Close"
                    >
                        <X size={16} strokeWidth={2} className="text-black/40 group-hover:text-white transition-colors" />
                    </button>
                </div>
            )}
        </header>
    );
}
