import type { Permission } from '@/stores/useAuthStore';

export const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', permission: 'view_dashboard' as Permission },
    { path: '/pos', label: 'POS', icon: 'ShoppingCart', permission: 'use_pos' as Permission },
    { path: '/inventory', label: 'Inventory', icon: 'Package', permission: 'view_inventory' as Permission },
    { path: '/promotions', label: 'Promotions', icon: 'Tag', permission: 'view_promotions' as Permission },
    { path: '/stock', label: 'Stock Control', icon: 'ClipboardList', permission: 'view_inventory' as Permission },
    { path: '/suppliers', label: 'Suppliers', icon: 'Truck', permission: 'view_suppliers' as Permission },
    { path: '/purchases', label: 'Purchases', icon: 'FileText', permission: 'view_suppliers' as Permission },
    { path: '/reports', label: 'Reports', icon: 'BarChart3', permission: 'view_reports' as Permission },
    { path: '/users', label: 'Users', icon: 'Users', permission: 'view_users' as Permission },
    { path: '/credit', label: 'Credit', icon: 'CreditCard', permission: 'view_reports' as Permission },
    { path: '/settings', label: 'Settings', icon: 'Settings', permission: 'view_settings' as Permission },
    { path: '/help', label: 'Help', icon: 'HelpCircle', permission: null },
];
