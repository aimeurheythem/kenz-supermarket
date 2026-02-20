/**
 * Unit Tests — useAuthStore
 *
 * Covers:
 *  - login() — sets user + isAuthenticated on success, error on failure
 *  - loginCashier() — PIN-based auth
 *  - logout() — clears state, closes session
 *  - hasPermission() — role-based permission checks
 *  - isLoading toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import type { User } from '@/lib/types';

// ── Mock Repos (vi.hoisted so they're available in vi.mock factories) ─

const { mockUserRepo, mockCashierSessionRepo } = vi.hoisted(() => ({
    mockUserRepo: {
        authenticate: vi.fn(),
        authenticateWithPin: vi.fn(),
        update: vi.fn(),
        updatePassword: vi.fn(),
    },
    mockCashierSessionRepo: {
        startSession: vi.fn(),
        closeSession: vi.fn(),
    },
}));

vi.mock('../../database', () => ({
    UserRepo: mockUserRepo,
    CashierSessionRepo: mockCashierSessionRepo,
}));

import { useAuthStore } from '../stores/useAuthStore';

// ── Fixtures ─────────────────────────────────────────────────────────

const ADMIN_USER: User = {
    id: 1,
    username: 'admin',
    full_name: 'Admin User',
    role: 'admin',
    is_active: 1,
    pin_code: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    last_login: null,
};

const CASHIER_USER: User = {
    ...ADMIN_USER,
    id: 2,
    username: 'cashier1',
    full_name: 'Cashier One',
    role: 'cashier',
};

const MANAGER_USER: User = {
    ...ADMIN_USER,
    id: 3,
    username: 'manager1',
    full_name: 'Manager One',
    role: 'manager',
};

// ── Tests ────────────────────────────────────────────────────────────

describe('useAuthStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            currentSession: null,
            isLoading: false,
            error: null,
        });
    });

    // ─── login() ─────────────────────────────────────────────────

    describe('login()', () => {
        it('sets user and isAuthenticated on success', async () => {
            mockUserRepo.authenticate.mockResolvedValueOnce(ADMIN_USER);

            let result: boolean | undefined;
            await act(async () => {
                result = await useAuthStore.getState().login('admin', 'password123');
            });

            expect(result).toBe(true);
            expect(useAuthStore.getState().user).toEqual(ADMIN_USER);
            expect(useAuthStore.getState().isAuthenticated).toBe(true);
        });

        it('sets error when credentials are wrong', async () => {
            mockUserRepo.authenticate.mockResolvedValueOnce(null);

            let result: boolean | undefined;
            await act(async () => {
                result = await useAuthStore.getState().login('admin', 'wrong');
            });

            expect(result).toBe(false);
            expect(useAuthStore.getState().user).toBeNull();
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
            expect(useAuthStore.getState().error).toBe('Invalid username or password');
        });

        it('sets error when repo throws', async () => {
            mockUserRepo.authenticate.mockRejectedValueOnce(new Error('DB unavailable'));

            let result: boolean | undefined;
            await act(async () => {
                result = await useAuthStore.getState().login('admin', 'pass');
            });

            expect(result).toBe(false);
            expect(useAuthStore.getState().error).toBe('DB unavailable');
        });

        it('toggles isLoading during login', async () => {
            let loadingDuringAuth = false;
            mockUserRepo.authenticate.mockImplementationOnce(() => {
                loadingDuringAuth = useAuthStore.getState().isLoading;
                return Promise.resolve(ADMIN_USER);
            });

            await act(async () => {
                await useAuthStore.getState().login('admin', 'pass');
            });

            expect(loadingDuringAuth).toBe(true);
            expect(useAuthStore.getState().isLoading).toBe(false);
        });

        it('resets isLoading on failure', async () => {
            mockUserRepo.authenticate.mockRejectedValueOnce(new Error('fail'));

            await act(async () => {
                await useAuthStore.getState().login('admin', 'pass');
            });

            expect(useAuthStore.getState().isLoading).toBe(false);
        });

        it('clears currentSession on successful login', async () => {
            useAuthStore.setState({
                currentSession: { session: { id: 5 } as any, openingCash: 100 },
            });
            mockUserRepo.authenticate.mockResolvedValueOnce(ADMIN_USER);

            await act(async () => {
                await useAuthStore.getState().login('admin', 'pass');
            });

            expect(useAuthStore.getState().currentSession).toBeNull();
        });
    });

    // ─── loginCashier() ──────────────────────────────────────────

    describe('loginCashier()', () => {
        it('sets user and isAuthenticated on correct PIN', async () => {
            mockUserRepo.authenticateWithPin.mockResolvedValueOnce(CASHIER_USER);

            let result: boolean | undefined;
            await act(async () => {
                result = await useAuthStore.getState().loginCashier(2, '1234');
            });

            expect(result).toBe(true);
            expect(useAuthStore.getState().user).toEqual(CASHIER_USER);
            expect(useAuthStore.getState().isAuthenticated).toBe(true);
        });

        it('sets error on wrong PIN', async () => {
            mockUserRepo.authenticateWithPin.mockResolvedValueOnce(null);

            let result: boolean | undefined;
            await act(async () => {
                result = await useAuthStore.getState().loginCashier(2, '0000');
            });

            expect(result).toBe(false);
            expect(useAuthStore.getState().error).toBe('Invalid PIN code');
        });

        it('toggles isLoading', async () => {
            let loadingDuring = false;
            mockUserRepo.authenticateWithPin.mockImplementationOnce(() => {
                loadingDuring = useAuthStore.getState().isLoading;
                return Promise.resolve(CASHIER_USER);
            });

            await act(async () => {
                await useAuthStore.getState().loginCashier(2, '1234');
            });

            expect(loadingDuring).toBe(true);
            expect(useAuthStore.getState().isLoading).toBe(false);
        });
    });

    // ─── logout() ────────────────────────────────────────────────

    describe('logout()', () => {
        it('clears user state', async () => {
            useAuthStore.setState({
                user: ADMIN_USER,
                isAuthenticated: true,
                error: 'stale error',
            });

            await act(async () => {
                await useAuthStore.getState().logout();
            });

            expect(useAuthStore.getState().user).toBeNull();
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
            expect(useAuthStore.getState().error).toBeNull();
        });

        it('closes active session before clearing state', async () => {
            const mockSession = { id: 7, cashier_id: 2 } as any;
            useAuthStore.setState({
                user: CASHIER_USER,
                isAuthenticated: true,
                currentSession: { session: mockSession, openingCash: 100 },
            });

            await act(async () => {
                await useAuthStore.getState().logout();
            });

            expect(mockCashierSessionRepo.closeSession).toHaveBeenCalledWith({
                session_id: 7,
                closing_cash: 0,
                notes: 'Auto-closed on logout',
            });
            expect(useAuthStore.getState().currentSession).toBeNull();
        });

        it('works even with no active session', async () => {
            useAuthStore.setState({
                user: ADMIN_USER,
                isAuthenticated: true,
                currentSession: null,
            });

            await act(async () => {
                await useAuthStore.getState().logout();
            });

            expect(mockCashierSessionRepo.closeSession).not.toHaveBeenCalled();
            expect(useAuthStore.getState().user).toBeNull();
        });
    });

    // ─── hasPermission() ─────────────────────────────────────────

    describe('hasPermission()', () => {
        it('admin has all permissions', () => {
            useAuthStore.setState({ user: ADMIN_USER });

            expect(useAuthStore.getState().hasPermission('view_dashboard')).toBe(true);
            expect(useAuthStore.getState().hasPermission('edit_settings')).toBe(true);
            expect(useAuthStore.getState().hasPermission('use_pos')).toBe(true);
            expect(useAuthStore.getState().hasPermission('process_refunds')).toBe(true);
        });

        it('cashier only has use_pos', () => {
            useAuthStore.setState({ user: CASHIER_USER });

            expect(useAuthStore.getState().hasPermission('use_pos')).toBe(true);
            expect(useAuthStore.getState().hasPermission('view_dashboard')).toBe(false);
            expect(useAuthStore.getState().hasPermission('edit_settings')).toBe(false);
            expect(useAuthStore.getState().hasPermission('view_reports')).toBe(false);
        });

        it('manager has limited permissions', () => {
            useAuthStore.setState({ user: MANAGER_USER });

            expect(useAuthStore.getState().hasPermission('view_dashboard')).toBe(true);
            expect(useAuthStore.getState().hasPermission('view_reports')).toBe(true);
            expect(useAuthStore.getState().hasPermission('use_pos')).toBe(true);
            expect(useAuthStore.getState().hasPermission('edit_settings')).toBe(false);
            expect(useAuthStore.getState().hasPermission('edit_users')).toBe(false);
        });

        it('returns false when no user is logged in', () => {
            useAuthStore.setState({ user: null });

            expect(useAuthStore.getState().hasPermission('use_pos')).toBe(false);
        });
    });

    // ─── clearError() ────────────────────────────────────────────

    describe('clearError()', () => {
        it('resets error to null', () => {
            useAuthStore.setState({ error: 'some error' });

            act(() => {
                useAuthStore.getState().clearError();
            });

            expect(useAuthStore.getState().error).toBeNull();
        });
    });

    // ─── getUserRole / getCurrentSessionId ───────────────────────

    describe('getters', () => {
        it('getUserRole returns role of current user', () => {
            useAuthStore.setState({ user: ADMIN_USER });
            expect(useAuthStore.getState().getUserRole()).toBe('admin');
        });

        it('getUserRole returns null when no user', () => {
            useAuthStore.setState({ user: null });
            expect(useAuthStore.getState().getUserRole()).toBeNull();
        });

        it('getCurrentSessionId returns session id', () => {
            useAuthStore.setState({
                currentSession: { session: { id: 42 } as any, openingCash: 100 },
            });
            expect(useAuthStore.getState().getCurrentSessionId()).toBe(42);
        });

        it('getCurrentSessionId returns null with no session', () => {
            useAuthStore.setState({ currentSession: null });
            expect(useAuthStore.getState().getCurrentSessionId()).toBeNull();
        });
    });
});
