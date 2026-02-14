import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Suppliers from './pages/Suppliers';
import StockControl from './pages/StockControl';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Credit from './pages/Credit';
import Help from './pages/Help';
import Terms from './pages/Terms';

import { useAuthStore } from './stores/useAuthStore';
import CashierLoginModal from './components/auth/CashierLoginModal';

// Protected route wrapper
function RequireAuth({ children, requireAdmin = false }: { children: React.ReactElement; requireAdmin?: boolean }) {
    const { isAuthenticated, user, currentSession, logout } = useAuthStore();
    const location = useLocation();

    // Clear corrupted session data
    if (currentSession && !currentSession.session) {
        console.error('Corrupted session data detected, logging out');
        logout();
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if route requires admin/manager permissions
    if (requireAdmin && user?.role === 'cashier') {
        return <Navigate to="/pos" replace />;
    }

    return children;
}

// Permission-based route wrapper
function RequirePermission({ children, permission }: { children: React.ReactElement; permission: import('./stores/useAuthStore').Permission }) {
    const { isAuthenticated, hasPermission } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!hasPermission(permission)) {
        return <Navigate to="/pos" replace />;
    }

    return children;
}

export default function App() {
    const { i18n } = useTranslation();
    const { isAuthenticated, user, currentSession, logout } = useAuthStore();
    const [showCashierLogin, setShowCashierLogin] = useState(false);

    useEffect(() => {
        const dir = i18n.language.startsWith('ar') ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    // Reset cashier login modal state when not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            setShowCashierLogin(false);
        }
    }, [isAuthenticated]);

    // Check if cashier needs to login to a session
    useEffect(() => {
        // Clear corrupted session data
        if (currentSession && !currentSession.session) {
            console.log('Clearing corrupted session data');
            logout();
            return;
        }
        
        // Only show cashier login modal if:
        // 1. User is authenticated
        // 2. User is a cashier
        // 3. No active session
        // 4. Not currently on the login page (to avoid conflict with Login.tsx modal)
        const isLoginPage = window.location.hash === '#/login' || window.location.pathname === '/login';
        
        if (isAuthenticated && user?.role === 'cashier' && !currentSession && !isLoginPage) {
            console.log('Showing cashier session modal from App.tsx');
            setShowCashierLogin(true);
        } else if (isLoginPage) {
            // Close the App.tsx modal if we're on login page
            setShowCashierLogin(false);
        }
    }, [isAuthenticated, user, currentSession, logout]);

    // Get default route based on role
    const getDefaultRoute = () => {
        if (!isAuthenticated) return '/login';
        if (user?.role === 'cashier') return '/pos';
        return '/';
    };

    return (
        <>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    path="/*"
                    element={
                        <RequireAuth>
                            <AppShell>
                                <Routes>
                                    {/* Cashier-only routes */}
                                    <Route 
                                        path="/pos" 
                                        element={
                                            <RequirePermission permission="use_pos">
                                                <POS />
                                            </RequirePermission>
                                        } 
                                    />

                                    {/* Admin/Manager routes */}
                                    <Route 
                                        path="/" 
                                        element={
                                            <RequirePermission permission="view_dashboard">
                                                <Dashboard />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/inventory" 
                                        element={
                                            <RequirePermission permission="view_inventory">
                                                <Inventory />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/stock" 
                                        element={
                                            <RequirePermission permission="view_inventory">
                                                <StockControl />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/suppliers" 
                                        element={
                                            <RequirePermission permission="view_suppliers">
                                                <Suppliers />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/purchases" 
                                        element={
                                            <RequirePermission permission="view_suppliers">
                                                <Purchases />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/reports" 
                                        element={
                                            <RequirePermission permission="view_reports">
                                                <Reports />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/users" 
                                        element={
                                            <RequirePermission permission="view_users">
                                                <Users />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/credit" 
                                        element={
                                            <RequirePermission permission="view_reports">
                                                <Credit />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route 
                                        path="/settings" 
                                        element={
                                            <RequirePermission permission="view_settings">
                                                <Settings />
                                            </RequirePermission>
                                        } 
                                    />
                                    <Route path="/help" element={<Help />} />
                                    <Route path="/terms" element={<Terms />} />
                                    
                                    {/* Default redirect */}
                                    <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
                                </Routes>
                            </AppShell>
                        </RequireAuth>
                    }
                />
            </Routes>

            {/* Cashier Login Modal - for existing logged-in cashiers without session */}
            <CashierLoginModal
                isOpen={showCashierLogin}
                onClose={() => {
                    // If user closes without logging in, log them out
                    if (!currentSession) {
                        logout();
                    }
                    setShowCashierLogin(false);
                }}
                onSuccess={() => {
                    setShowCashierLogin(false);
                    // Navigate to POS after successful session creation
                    console.log('Session created from App.tsx modal, navigating to POS...');
                }}
            />
        </>
    );
}
