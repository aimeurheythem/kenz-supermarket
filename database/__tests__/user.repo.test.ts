/**
 * Unit Tests — UserRepo
 *
 * Covers:
 *  - create()        → password & PIN are hashed via bcrypt
 *  - authenticate()  → correct password returns user, wrong password returns null
 *  - authenticateWithPin() → correct PIN returns user, wrong PIN returns null
 *  - updatePassword() → verifies old password, hashes new one
 *  - getAll/getById   → never return sensitive fields
 *
 * Note: `get()` from ../db is mocked independently from `query()`.
 * Repo methods using `get()` (getById, _getByUsernameFull, _getByIdFull, hasAnyUsers)
 * must be mocked via `mockGet`, NOT `mockQuery`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '../../src/lib/types';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('$2b$12$mockedHashValue'),
        compare: vi.fn().mockResolvedValue(true),
    },
}));

vi.mock('../db', () => ({
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
    executeNoSave: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    lastInsertId: vi.fn().mockResolvedValue(1),
    triggerSave: vi.fn(),
}));

import bcrypt from 'bcryptjs';
import { query, execute, get, lastInsertId } from '../db';
import { UserRepo } from '../repositories/user.repo';

const mockQuery = vi.mocked(query);
const mockExecute = vi.mocked(execute);
const mockGet = vi.mocked(get);
const mockLastInsertId = vi.mocked(lastInsertId);
const mockBcryptHash = vi.mocked(bcrypt.hash);
const mockBcryptCompare = vi.mocked(bcrypt.compare);

// ── Fixtures ─────────────────────────────────────────────────────────

const SAFE_USER: User = {
    id: 1,
    username: 'admin',
    full_name: 'Admin User',
    role: 'admin',
    is_active: 1,
    has_pin: 1,
    pin_length: 4,
    last_login: null,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
};

const FULL_USER = {
    ...SAFE_USER,
    password_hash: '$2b$12$existingBcryptHash',
    pin_code: '$2b$12$existingPinHash',
};

// ── Tests ────────────────────────────────────────────────────────────

describe('UserRepo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── create() ────────────────────────────────────────────────

    describe('create()', () => {
        it('hashes the password with bcrypt', async () => {
            mockGet.mockResolvedValueOnce(SAFE_USER as never); // getById after insert

            await UserRepo.create({
                username: 'newuser',
                full_name: 'New User',
                role: 'cashier',
                password: 'SecurePass1',
            });

            expect(mockBcryptHash).toHaveBeenCalledWith('SecurePass1', 12);
        });

        it('hashes the PIN with bcrypt when provided', async () => {
            mockGet.mockResolvedValueOnce(SAFE_USER as never);

            await UserRepo.create({
                username: 'cashier1',
                full_name: 'Cashier One',
                role: 'cashier',
                password: 'Pass1234',
                pin_code: '1234',
            });

            expect(mockBcryptHash).toHaveBeenCalledTimes(2);
            expect(mockBcryptHash).toHaveBeenCalledWith('Pass1234', 12);
            expect(mockBcryptHash).toHaveBeenCalledWith('1234', 12);
        });

        it('inserts user with hashed credentials and returns safe user', async () => {
            mockGet.mockResolvedValueOnce(SAFE_USER as never);
            mockLastInsertId.mockResolvedValueOnce(1);

            const result = await UserRepo.create({
                username: 'admin',
                full_name: 'Admin User',
                role: 'admin',
                password: 'Secret123',
            });

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                expect.arrayContaining(['admin', '$2b$12$mockedHashValue']),
            );
            expect(result).toBeDefined();
            expect(result).not.toHaveProperty('password_hash');
            expect(result).not.toHaveProperty('pin_code');
        });

        it('stores pin_length alongside hashed PIN', async () => {
            mockGet.mockResolvedValueOnce(SAFE_USER as never);

            await UserRepo.create({
                username: 'cashier2',
                full_name: 'Cashier Two',
                role: 'cashier',
                password: 'Pass1234',
                pin_code: '123456',
            });

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                expect.arrayContaining([6]),
            );
        });
    });

    // ─── authenticate() ──────────────────────────────────────────

    describe('authenticate()', () => {
        it('returns user on correct password', async () => {
            // _getByUsernameFull → get() → mockGet
            mockGet.mockResolvedValueOnce(FULL_USER as never);
            mockBcryptCompare.mockResolvedValueOnce(true as never);

            const result = await UserRepo.authenticate('admin', 'CorrectPassword');

            expect(mockBcryptCompare).toHaveBeenCalledWith('CorrectPassword', '$2b$12$existingBcryptHash');
            expect(result).toBeDefined();
            expect(result!.id).toBe(1);
            expect(result).not.toHaveProperty('password_hash');
            expect(result).not.toHaveProperty('pin_code');
        });

        it('returns null on wrong password', async () => {
            mockGet.mockResolvedValueOnce(FULL_USER as never);
            mockBcryptCompare.mockResolvedValueOnce(false as never);

            const result = await UserRepo.authenticate('admin', 'WrongPassword');

            expect(result).toBeNull();
        });

        it('returns null for non-existent user', async () => {
            // get() returns undefined by default → user not found
            const result = await UserRepo.authenticate('ghost', 'AnyPass');

            expect(result).toBeNull();
        });

        it('returns null for inactive user', async () => {
            mockGet.mockResolvedValueOnce({ ...FULL_USER, is_active: 0 } as never);

            const result = await UserRepo.authenticate('admin', 'CorrectPassword');

            expect(result).toBeNull();
            expect(mockBcryptCompare).not.toHaveBeenCalled();
        });

        it('updates last_login on successful auth', async () => {
            mockGet.mockResolvedValueOnce(FULL_USER as never);
            mockBcryptCompare.mockResolvedValueOnce(true as never);

            await UserRepo.authenticate('admin', 'CorrectPassword');

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET last_login'),
                expect.arrayContaining([1]),
            );
        });
    });

    // ─── authenticateWithPin() ───────────────────────────────────

    describe('authenticateWithPin()', () => {
        it('returns user on correct PIN', async () => {
            // _getByIdFull → get() → mockGet
            mockGet.mockResolvedValueOnce(FULL_USER as never);
            mockBcryptCompare.mockResolvedValueOnce(true as never);

            const result = await UserRepo.authenticateWithPin(1, '1234');

            expect(mockBcryptCompare).toHaveBeenCalledWith('1234', '$2b$12$existingPinHash');
            expect(result).toBeDefined();
            expect(result!.id).toBe(1);
            expect(result).not.toHaveProperty('password_hash');
            expect(result).not.toHaveProperty('pin_code');
        });

        it('returns null on wrong PIN', async () => {
            mockGet.mockResolvedValueOnce(FULL_USER as never);
            mockBcryptCompare.mockResolvedValueOnce(false as never);

            const result = await UserRepo.authenticateWithPin(1, '9999');

            expect(result).toBeNull();
        });

        it('returns null if user has no PIN set', async () => {
            mockGet.mockResolvedValueOnce({ ...FULL_USER, pin_code: null } as never);

            const result = await UserRepo.authenticateWithPin(1, '1234');

            expect(result).toBeNull();
            expect(mockBcryptCompare).not.toHaveBeenCalled();
        });

        it('returns null for inactive user', async () => {
            mockGet.mockResolvedValueOnce({ ...FULL_USER, is_active: 0 } as never);

            const result = await UserRepo.authenticateWithPin(1, '1234');

            expect(result).toBeNull();
        });

        it('returns null for non-existent user', async () => {
            // get() returns undefined by default
            const result = await UserRepo.authenticateWithPin(999, '1234');

            expect(result).toBeNull();
        });

        it('auto-migrates plaintext PIN to bcrypt on success', async () => {
            const legacyPinUser = { ...FULL_USER, pin_code: '1234' };
            mockGet.mockResolvedValueOnce(legacyPinUser as never);

            const result = await UserRepo.authenticateWithPin(1, '1234');

            expect(result).toBeDefined();
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET pin_code'),
                expect.arrayContaining(['$2b$12$mockedHashValue', 1]),
            );
        });

        it('updates last_login on successful PIN auth', async () => {
            mockGet.mockResolvedValueOnce(FULL_USER as never);
            mockBcryptCompare.mockResolvedValueOnce(true as never);

            await UserRepo.authenticateWithPin(1, '1234');

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET last_login'),
                expect.arrayContaining([1]),
            );
        });
    });

    // ─── updatePassword() ────────────────────────────────────────

    describe('updatePassword()', () => {
        it('returns true and updates hash when current password is correct', async () => {
            mockGet.mockResolvedValueOnce(FULL_USER as never); // _getByIdFull → get()
            mockBcryptCompare.mockResolvedValueOnce(true as never);

            const result = await UserRepo.updatePassword(1, 'OldPassword', 'NewPassword');

            expect(result).toBe(true);
            expect(mockBcryptHash).toHaveBeenCalledWith('NewPassword', 12);
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET password_hash'),
                expect.arrayContaining(['$2b$12$mockedHashValue', 1]),
            );
        });

        it('returns false when current password is wrong', async () => {
            mockGet.mockResolvedValueOnce(FULL_USER as never);
            mockBcryptCompare.mockResolvedValueOnce(false as never);

            const result = await UserRepo.updatePassword(1, 'WrongOld', 'NewPass');

            expect(result).toBe(false);
            expect(mockBcryptHash).not.toHaveBeenCalled();
        });

        it('returns false when user does not exist', async () => {
            // get() returns undefined by default
            const result = await UserRepo.updatePassword(999, 'Any', 'New');

            expect(result).toBe(false);
        });
    });

    // ─── getAll / getById — safe columns ─────────────────────────

    describe('getAll()', () => {
        it('queries with safe columns (no password_hash or pin_code)', async () => {
            mockQuery.mockResolvedValueOnce([SAFE_USER]);

            await UserRepo.getAll();

            const sql = mockQuery.mock.calls[0][0] as string;
            expect(sql).not.toContain('password_hash');
            expect(sql).toContain('id');
            expect(sql).toContain('username');
            expect(sql).toContain('full_name');
        });
    });

    describe('getById()', () => {
        it('queries with safe columns', async () => {
            mockGet.mockResolvedValueOnce(SAFE_USER as never); // getById → get()

            await UserRepo.getById(1);

            // get() is called, check its SQL argument
            const sql = mockGet.mock.calls[0][0] as string;
            expect(sql).not.toContain('password_hash');
        });
    });

    // ─── hasAnyUsers() ───────────────────────────────────────────

    describe('hasAnyUsers()', () => {
        it('returns true when count > 0', async () => {
            mockGet.mockResolvedValueOnce({ count: 3 } as never); // get()

            const result = await UserRepo.hasAnyUsers();

            expect(result).toBe(true);
        });

        it('returns false when count = 0', async () => {
            mockGet.mockResolvedValueOnce({ count: 0 } as never);

            const result = await UserRepo.hasAnyUsers();

            expect(result).toBe(false);
        });
    });
});
