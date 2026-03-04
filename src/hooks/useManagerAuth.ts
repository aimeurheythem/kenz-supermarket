// useManagerAuth.ts — Hook wrapping useAuthorizationStore for component-level authorization
import { useCallback } from 'react';
import { useAuthorizationStore } from '@/stores/useAuthorizationStore';
import type { AuthorizableAction, AuthorizationResult } from '@/lib/types';

/**
 * Hook for manager PIN authorization.
 * Usage: const { requestAuth } = useManagerAuth();
 *        const result = await requestAuth('void_sale');
 *        if (result.authorized) { ... }
 */
export function useManagerAuth() {
    const requestAuthStore = useAuthorizationStore((s) => s.requestAuth);

    const requestAuth = useCallback(
        async (action: AuthorizableAction): Promise<AuthorizationResult> => {
            return requestAuthStore(action);
        },
        [requestAuthStore],
    );

    return { requestAuth };
}
