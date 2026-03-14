import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Lock, LogIn, Loader2, Wifi, WifiOff } from 'lucide-react';

interface POSLoginScreenProps {
  onLoginSuccess: (tokens: { access: string; refresh: string; user: any }) => void;
}

/**
 * POS Login Screen — authenticates against the backend API.
 * Requires internet for first login. After initial auth, cached credentials
 * allow offline PIN-based login.
 */
export default function POSLoginScreen({ onLoginSuccess }: POSLoginScreenProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track connectivity
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiUrl}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid credentials');
      }

      const data = await response.json();
      onLoginSuccess({
        access: data.access,
        refresh: data.refresh,
        user: data.user,
      });
    } catch (err: any) {
      if (!navigator.onLine) {
        setError('No internet connection. Online login required for first setup.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Kenz POS</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to start your shift</p>
        </div>

        {/* Connection indicator */}
        <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs ${
          isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {isOnline ? 'Connected' : 'Offline — internet required for login'}
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isOnline}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          First-time login requires internet. After that, use PIN for quick offline access.
        </p>
      </div>
    </div>
  );
}
