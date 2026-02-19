import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    roles: string[];
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

interface SidebarNavGroupProps {
    group: NavGroup;
    collapsed: boolean;
    userRole: string;
}

export default function SidebarNavGroup({ group, collapsed, userRole }: SidebarNavGroupProps) {
    const location = useLocation();

    const filteredItems = group.items.filter((item) => !item.roles || item.roles.includes(userRole));
    if (filteredItems.length === 0) return null;

    return (
        <div className={cn(collapsed ? 'px-0' : 'px-4')}>
            {!collapsed && (
                <h3 className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em] mb-4 px-4">
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
                                isActive ? 'text-black' : 'text-black/50 hover:text-black',
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-indicator"
                                    className="absolute ltr:left-0 rtl:right-0 w-1 h-3.5 bg-black rounded-full z-20"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <div
                                className={cn(
                                    'w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300',
                                    isActive ? 'scale-100' : 'group-hover:scale-105',
                                )}
                            >
                                <item.icon
                                    size={17}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        'transition-colors duration-300',
                                        isActive ? 'text-black' : 'text-black/30 group-hover:text-black',
                                    )}
                                />
                            </div>

                            {!collapsed && (
                                <span className="relative z-10 text-[13px] font-semibold tracking-[-0.01em] whitespace-nowrap overflow-hidden transition-colors">
                                    {item.label}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}
