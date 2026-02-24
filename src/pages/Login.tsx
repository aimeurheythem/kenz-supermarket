import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShaderBackground } from '@/components/modern-background';
import { useAuthStore } from '@/stores/useAuthStore';
import {
    Eye,
    EyeOff,
    Users,
    Shield,
    ShoppingCart,
    KeyRound,
    ChevronDown,
    ArrowLeft,
    Delete,
    Minus,
    Square,
    X,
    Copy,
} from 'lucide-react';
import { useElectron } from '@/hooks/useElectron';
import { useTranslation } from 'react-i18next';
import { UserRepo } from '../../database';
import type { User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

type Tab = 'owner' | 'cashier';
type CashierStep = 'select' | 'pin' | 'cash';

// ─────────────────────────────────────────────
// Shared NumPad — works for PIN (masked dots)
//               and cash (decimal number)
// ─────────────────────────────────────────────
type NumPadMode = 'pin' | 'cash';

function NumPad({
    value,
    onChange,
    mode,
    maxLen = 8,
}: {
    value: string;
    onChange: (v: string) => void;
    mode: NumPadMode;
    maxLen?: number;
}) {
    const press = (key: string) => {
        if (key === '⌫') {
            onChange(value.slice(0, -1));
            return;
        }
        if (key === '.' && mode === 'cash') {
            if (value.includes('.')) return;
            onChange((value || '0') + '.');
            return;
        }
        if (mode === 'pin' && value.length >= maxLen) return;
        // For cash, limit decimal places to 2
        if (mode === 'cash' && value.includes('.') && value.split('.')[1]?.length >= 2) return;
        onChange(value + key);
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', mode === 'cash' ? '.' : '', '0', '⌫'];

    // PIN display: dots
    const pinDots = Array.from({ length: maxLen }, (_, i) => (
        <div
            key={i}
            className="w-3 h-3 rounded-full transition-all duration-150"
            style={{
                background: i < value.length ? 'var(--text-primary)' : 'var(--border-default)',
                transform: i < value.length ? 'scale(1.15)' : 'scale(1)',
            }}
        />
    ));

    return (
        <div className="space-y-3">
            {/* Value display */}
            {mode === 'pin' ? (
                <div className="flex items-center justify-center gap-2.5 py-3">{pinDots}</div>
            ) : (
                <div
                    className="text-center py-3 text-2xl font-bold tracking-tight rounded-lg"
                    style={{
                        fontFamily: 'var(--font-mono)',
                        color: value ? 'var(--text-primary)' : 'var(--text-placeholder)',
                        background: 'var(--bg-secondary)',
                        minHeight: '52px',
                    }}
                >
                    {value || '0.00'}
                </div>
            )}

            {/* Numpad grid */}
            <div className="grid grid-cols-3 gap-2">
                {keys.map((k) => {
                    if (k === '') {
                        return <div key="empty" />;
                    }
                    const isBackspace = k === '⌫';
                    return (
                        <button
                            key={k}
                            type="button"
                            onClick={() => press(k)}
                            className="flex items-center justify-center h-12 rounded-xl text-base font-semibold transition-all duration-100 active:scale-95 select-none"
                            style={{
                                background: isBackspace ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                color: isBackspace ? 'var(--text-muted)' : 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isBackspace
                                    ? 'var(--border-default)'
                                    : 'var(--accent-light)';
                                e.currentTarget.style.borderColor = 'var(--accent)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isBackspace
                                    ? 'var(--bg-tertiary)'
                                    : 'var(--bg-secondary)';
                                e.currentTarget.style.borderColor = 'var(--border-default)';
                            }}
                        >
                            {isBackspace ? <Delete size={16} /> : k}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Testimonial data & card
// ─────────────────────────────────────────────
const TESTIMONIALS_ROW1 = [
    { name: 'Amira S.', role: 'Store Owner', quote: 'Kenz changed the way we run our shop entirely.' },
    { name: 'Youssef B.', role: 'Head Cashier', quote: 'PIN login makes every shift seamless.' },
    { name: 'Nour H.', role: 'Supervisor', quote: 'Live reports give us the edge we always needed.' },
    { name: 'Omar T.', role: 'Cashier', quote: 'Barcode scanning is instant. Queues are gone.' },
    { name: 'Rania D.', role: 'Manager', quote: 'Cleanest POS I have ever touched.' },
];
const TESTIMONIALS_ROW2 = [
    { name: 'Karim F.', role: 'Shop Owner', quote: 'Customer credit tracking finally makes sense.' },
    { name: 'Leila A.', role: 'Cashier', quote: 'Opening cash every morning takes seconds now.' },
    { name: 'Hassan M.', role: 'Owner', quote: 'Multi-user roles removed all confusion.' },
    { name: 'Wassim C.', role: 'Inventory Lead', quote: 'Stock alerts saved us from running out.' },
    { name: 'Yasmine R.', role: 'Manager', quote: 'The audit trail gave us full accountability.' },
];

function TestimonialCard({ name, role, quote }: { name: string; role: string; quote: string }) {
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return (
        <div
            className="flex-shrink-0 flex flex-col gap-5 w-[220px] rounded-[3rem] px-5.5 py-3.5 select-none"
            style={{ background: 'rgba(15, 23, 42, 0.1)' }}
        >
            <p className="text-slate-700 text-xs leading-relaxed">&ldquo;{quote}&rdquo;</p>
            <div className="flex items-center gap-2 mt-1">
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'var(--accent)', color: '#0f172a' }}
                >
                    {initials}
                </div>
                <div>
                    <p className="text-slate-800 text-[11px] font-semibold leading-none">{name}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{role}</p>
                </div>
            </div>
        </div>
    );
}

export default function Login() {
    const { login, loginCashier, startCashierSession } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';
    // Admins/managers should never be sent to /pos (that's cashier-only)
    const ownerFrom = from === '/pos' ? '/' : from;
    const { t } = useTranslation();
    const electron = useElectron();

    // window maximized state (for rounded corners + controls)
    const [isMaximized, setIsMaximized] = useState(false);
    useEffect(() => {
        electron.isMaximized().then(setIsMaximized);
        electron.onMaximizedChange(setIsMaximized);
    }, []);
    useEffect(() => {
        document.documentElement.classList.toggle('maximized', isMaximized);
    }, [isMaximized]);

    // owner form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [ownerError, setOwnerError] = useState('');
    const [ownerLoading, setOwnerLoading] = useState(false);

    // tabs
    const [tab, setTab] = useState<Tab>('owner');

    // cashier form
    const [cashiers, setCashiers] = useState<User[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<User | null>(null);
    const [cashierStep, setCashierStep] = useState<CashierStep>('select');
    const [pinCode, setPinCode] = useState('');
    const [openingCash, setOpeningCash] = useState('');
    const [cashierError, setCashierError] = useState('');
    const [cashierLoading, setCashierLoading] = useState(false);

    // forgot password dialog
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // load cashiers when switching to cashier tab
    useEffect(() => {
        if (tab === 'cashier' && cashiers.length === 0) {
            UserRepo.getActiveCashiers()
                .then(setCashiers)
                .catch(() => setCashierError('Failed to load cashiers'));
        }
    }, [tab, cashiers.length]);

    const switchTab = (next: Tab) => {
        setTab(next);
        // reset cashier state on every switch
        setSelectedCashier(null);
        setCashierStep('select');
        setPinCode('');
        setOpeningCash('');
        setCashierError('');
        setOwnerError('');
    };

    // owner login
    const handleOwnerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setOwnerError('');
        setOwnerLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                navigate(ownerFrom, { replace: true });
            } else {
                setOwnerError(t('login.errors.invalid_credentials'));
            }
        } catch {
            setOwnerError(t('login.errors.system_error'));
        } finally {
            setOwnerLoading(false);
        }
    };

    // cashier: PIN verify
    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCashier) return;
        setCashierLoading(true);
        setCashierError('');
        const ok = await loginCashier(selectedCashier.id, pinCode);
        setCashierLoading(false);
        if (ok) {
            setCashierStep('cash');
        } else {
            setCashierError(t('login.errors.invalid_pin', 'Invalid PIN code'));
        }
    };

    // cashier: opening cash + start session
    const handleCashSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCashier) return;
        const cash = parseFloat(openingCash);
        if (isNaN(cash) || cash < 0) {
            setCashierError(t('login.errors.invalid_amount', 'Please enter a valid amount'));
            return;
        }
        setCashierLoading(true);
        setCashierError('');
        try {
            const session = await startCashierSession(selectedCashier.id, cash);
            if (session && session.id && session.login_time) {
                navigate('/pos', { replace: true });
            } else {
                setCashierError(t('login.errors.session_failed', 'Failed to start session. Please try again.'));
            }
        } catch (err) {
            setCashierError(err instanceof Error ? err.message : t('login.errors.unknown', 'Unknown error'));
        } finally {
            setCashierLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden relative" style={{ fontFamily: 'var(--font-primary)' }}>

            {/* Window Controls */}
            {electron.isElectron && (
                <div className="fixed top-0 ltr:right-0 rtl:left-0 h-10 flex items-center gap-0.5 px-3 z-[10000]">
                    <button
                        onClick={() => electron.minimize()}
                        className="group flex items-center justify-center w-10 min-h-full hover:bg-black/[0.08] active:bg-black/[0.12] transition-colors duration-200"
                        title="Minimize"
                    >
                        <Minus
                            size={15}
                            strokeWidth={2}
                            className="text-black/40 group-hover:text-black transition-colors"
                        />
                    </button>
                    <button
                        onClick={() => electron.maximize()}
                        className="group flex items-center justify-center w-10 min-h-full hover:bg-black/[0.08] active:bg-black/[0.12] transition-colors duration-200"
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        {isMaximized ? (
                            <Copy
                                size={13}
                                strokeWidth={2}
                                className="text-black/40 group-hover:text-black transition-colors"
                            />
                        ) : (
                            <Square
                                size={13}
                                strokeWidth={2}
                                className="text-black/40 group-hover:text-black transition-colors"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => electron.close()}
                        className="group flex items-center justify-center w-11 min-h-full hover:bg-[#E81123] active:bg-[#AC0F1C] transition-colors duration-200"
                        title="Close"
                    >
                        <X
                            size={16}
                            strokeWidth={2}
                            className="text-black/40 group-hover:text-white transition-colors"
                        />
                    </button>
                </div>
            )}
            {/* LEFT PANEL */}
            {/* ── LEFT PANEL ── */}
            <div className="hidden lg:flex lg:w-[38%] xl:w-[36%] flex-col relative overflow-hidden m-1.5 rounded-[1.5rem]">
                {/* Decorative SVG Elements */}
                <img
                    src="/element1-nobg.svg"
                    alt=""
                    aria-hidden="true"
                    className="absolute -top-[15%] -right-[15%] w-[65%] pointer-events-none select-none"
                    style={{ opacity: 0.15, filter: 'blur(0.5px)' }}
                />
                <img
                    src="/element2-nobg.svg"
                    alt=""
                    aria-hidden="true"
                    className="absolute -bottom-[10%] -left-[15%] w-[60%] pointer-events-none select-none"
                    style={{ opacity: 0.12, filter: 'blur(0.5px)' }}
                />

                {/* Branding */}
                <div className="relative z-10 flex flex-col items-start pt-12 pb-6 px-10 text-left gap-1">
                    <img src="/1.svg" alt="Kenzy Pro" className="w-40 h-40" />
                    <div className="-mt-2">
                        <h1 className="text-slate-800 text-2xl font-bold tracking-tight leading-tight">Kenzy</h1>
                        <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mt-0">Pro</p>
                    </div>
                </div>

                {/* Testimonials marquee */}
                <div className="relative z-10 flex-1 flex flex-col justify-center gap-3 overflow-hidden py-4" dir="ltr">
                    {/* Row 1 — scrolls left */}
                    <div
                        className="w-full overflow-hidden"
                        style={{
                            maskImage:
                                'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
                        }}
                    >
                        <div
                            className="flex gap-3"
                            style={{ animation: 'marquee-left 32s linear infinite', width: 'max-content' }}
                        >
                            {[...TESTIMONIALS_ROW1, ...TESTIMONIALS_ROW1].map((t, i) => (
                                <TestimonialCard key={i} {...t} />
                            ))}
                        </div>
                    </div>
                    {/* Row 2 — scrolls right */}
                    <div
                        className="w-full overflow-hidden"
                        style={{
                            maskImage:
                                'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
                        }}
                    >
                        <div
                            className="flex gap-3"
                            style={{ animation: 'marquee-right 28s linear infinite', width: 'max-content' }}
                        >
                            {[...TESTIMONIALS_ROW2, ...TESTIMONIALS_ROW2].map((t, i) => (
                                <TestimonialCard key={i} {...t} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 px-10 pb-8 text-center">
                    <p className="text-slate-400 text-xs">© {new Date().getFullYear()} Kenzy Pro</p>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div
                className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10"
                style={{ background: 'transparent' }}
            >
                {/* Mobile logo */}
                <div className="lg:hidden flex flex-col items-center gap-0 mb-8">
                    <img src="/1.svg" alt="Kenzy Pro" className="w-16 h-16" />
                    <p className="font-bold text-base mt-1" style={{ color: 'var(--text-primary)' }}>
                        Kenzy Pro
                    </p>
                </div>

                {/* Card */}
                <div
                    className="w-full rounded-2xl p-8"
                    style={{
                        maxWidth: tab === 'cashier' && cashierStep !== 'select' ? '360px' : '360px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255,255,255,0.5)',
                    }}
                >
                    {/* Heading */}
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        {t('login.welcome', 'Welcome back')}
                    </p>
                    <h2
                        className="text-2xl font-bold leading-tight mb-7"
                        style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                    >
                        {t('login.title', 'Log into your Account')}
                    </h2>

                    {/* Tab switcher */}
                    <div className="flex rounded-lg p-1 mb-7 gap-1" style={{ background: 'var(--bg-secondary)' }}>
                        <button
                            type="button"
                            onClick={() => switchTab('owner')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all duration-150"
                            style={
                                tab === 'owner'
                                    ? {
                                          background: '#ffffff',
                                          color: 'var(--text-primary)',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                      }
                                    : { color: 'var(--text-muted)' }
                            }
                        >
                            <Shield className="w-3.5 h-3.5" />
                            {t('login.owner', 'Owner')}
                        </button>
                        <button
                            type="button"
                            onClick={() => switchTab('cashier')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all duration-150"
                            style={
                                tab === 'cashier'
                                    ? {
                                          background: '#ffffff',
                                          color: 'var(--text-primary)',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                      }
                                    : { color: 'var(--text-muted)' }
                            }
                        >
                            <Users className="w-3.5 h-3.5" />
                            {t('login.cashier', 'Cashier')}
                        </button>
                    </div>

                    {/* OWNER FORM */}
                    {tab === 'owner' && (
                        <form onSubmit={handleOwnerSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-xs font-semibold mb-1.5"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {t('login.username', 'Username')}
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    placeholder={t('login.email_placeholder', 'Enter your username')}
                                    required
                                    className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all duration-150"
                                    style={{
                                        border: '1px solid var(--border-default)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'var(--font-primary)',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(250,204,21,0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-default)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-semibold"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {t('login.password', 'Password')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-xs font-medium transition-colors"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                    >
                                        {t('login.forgot_password', 'Forgot password?')}
                                    </button>
                                </div>
                                <div
                                    className="flex items-center rounded-lg px-3.5 transition-all duration-150"
                                    style={{ border: '1px solid var(--border-default)', background: 'var(--bg-input)' }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(250,204,21,0.15)';
                                    }}
                                    onBlur={(e) => {
                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                            e.currentTarget.style.borderColor = 'var(--border-default)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        placeholder={t('login.password_placeholder', 'Enter your password')}
                                        required
                                        className="flex-1 py-2.5 text-sm outline-none bg-transparent no-inner-ring"
                                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="flex-shrink-0 p-1 transition-colors"
                                        style={{ color: 'var(--text-placeholder)' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-placeholder)')}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            {ownerError && (
                                <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                                    {ownerError}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={ownerLoading}
                                className="w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-150 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: 'var(--accent)',
                                    color: '#0f172a',
                                    boxShadow: '0 2px 8px rgba(250,204,21,0.3)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!ownerLoading) e.currentTarget.style.background = 'var(--accent-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--accent)';
                                }}
                            >
                                {ownerLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8H4z"
                                            />
                                        </svg>
                                        {t('login.logging_in', 'Signing in...')}
                                    </span>
                                ) : (
                                    t('login.login_button', 'Log In')
                                )}
                            </button>
                        </form>
                    )}

                    {/* CASHIER FORM */}
                    {tab === 'cashier' && (
                        <div className="space-y-5">
                            {/* Step: select cashier */}
                            {cashierStep === 'select' && (
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-1.5"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {t('login.select_name', 'Select your name')}
                                        </label>
                                        <div className="space-y-2">
                                            {cashiers.length === 0 ? (
                                                <p
                                                    className="text-xs py-4 text-center"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {t('login.no_cashiers', 'No cashiers found')}
                                                </p>
                                            ) : (
                                                cashiers.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCashier(c);
                                                            setCashierStep('pin');
                                                            setCashierError('');
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 text-left"
                                                        style={{
                                                            border: '1px solid var(--border-default)',
                                                            background: 'var(--bg-input)',
                                                            color: 'var(--text-primary)',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = 'var(--accent)';
                                                            e.currentTarget.style.background = 'var(--accent-light)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = 'var(--border-default)';
                                                            e.currentTarget.style.background = 'var(--bg-input)';
                                                        }}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                                            style={{
                                                                background: 'var(--bg-secondary)',
                                                                color: 'var(--text-primary)',
                                                            }}
                                                        >
                                                            {c.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p
                                                                className="font-semibold text-sm"
                                                                style={{ color: 'var(--text-primary)' }}
                                                            >
                                                                {c.full_name}
                                                            </p>
                                                            <p
                                                                className="text-xs"
                                                                style={{ color: 'var(--text-muted)' }}
                                                            >
                                                                @{c.username}
                                                            </p>
                                                        </div>
                                                        <ChevronDown
                                                            className="w-4 h-4 ml-auto -rotate-90 flex-shrink-0"
                                                            style={{ color: 'var(--text-placeholder)' }}
                                                        />
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    {cashierError && (
                                        <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                                            {cashierError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step: PIN */}
                            {cashierStep === 'pin' && selectedCashier && (
                                <form onSubmit={handlePinSubmit} className="space-y-4">
                                    {/* selected cashier pill */}
                                    <div
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                                        style={{ background: 'var(--bg-secondary)' }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{ background: 'var(--accent)', color: '#0f172a' }}
                                        >
                                            {selectedCashier.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-sm font-semibold truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {selectedCashier.full_name}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCashier(null);
                                                setCashierStep('select');
                                                setCashierError('');
                                                setPinCode('');
                                            }}
                                            className="text-xs flex items-center gap-1 transition-colors flex-shrink-0"
                                            style={{ color: 'var(--text-muted)' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                        >
                                            <ArrowLeft size={13} /> {t('login.change', 'Change')}
                                        </button>
                                    </div>
                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {t('login.pin_code', 'PIN Code')}
                                        </label>
                                        <NumPad
                                            value={pinCode}
                                            onChange={setPinCode}
                                            mode="pin"
                                            maxLen={selectedCashier.pin_length ?? 4}
                                        />
                                    </div>
                                    {cashierError && (
                                        <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                                            {cashierError}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={cashierLoading || pinCode.length === 0}
                                        className="w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                            background: 'var(--accent)',
                                            color: '#0f172a',
                                            boxShadow: '0 2px 8px rgba(250,204,21,0.3)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!cashierLoading)
                                                e.currentTarget.style.background = 'var(--accent-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--accent)';
                                        }}
                                    >
                                        {cashierLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8v8H4z"
                                                    />
                                                </svg>
                                                {t('login.verifying', 'Verifying...')}
                                            </span>
                                        ) : (
                                            t('login.verify_pin', 'Verify PIN')
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Step: opening cash */}
                            {cashierStep === 'cash' && selectedCashier && (
                                <form onSubmit={handleCashSubmit} className="space-y-4">
                                    {/* cashier chip */}
                                    <div
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                                        style={{ background: 'var(--bg-secondary)' }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{ background: 'var(--accent)', color: '#0f172a' }}
                                        >
                                            {selectedCashier.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {selectedCashier.full_name}
                                        </p>
                                        <div className="ml-auto w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                    </div>
                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {t('login.opening_cash', 'Opening Cash Amount')}
                                        </label>
                                        <NumPad value={openingCash} onChange={setOpeningCash} mode="cash" />
                                    </div>
                                    {cashierError && (
                                        <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                                            {cashierError}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={cashierLoading || !openingCash}
                                        className="w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                            background: 'var(--accent)',
                                            color: '#0f172a',
                                            boxShadow: '0 2px 8px rgba(250,204,21,0.3)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!cashierLoading)
                                                e.currentTarget.style.background = 'var(--accent-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--accent)';
                                        }}
                                    >
                                        {cashierLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8v8H4z"
                                                    />
                                                </svg>
                                                {t('login.opening_session', 'Opening session...')}
                                            </span>
                                        ) : (
                                            t('login.open_session', 'Open Session & Go to POS')
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                <p className="mt-8 text-xs" style={{ color: 'var(--text-placeholder)' }}>
                    © {new Date().getFullYear()} Kenzy Pro &nbsp;·&nbsp; v{APP_VERSION}
                </p>
            </div>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                            {t('login.forgot_password', 'Forgot password?')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('login.forgot_password_desc', 'Password reset is handled by the system administrator.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div
                            className="rounded-xl p-4 space-y-2"
                            style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)' }}
                        >
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {t('login.forgot_password_steps_title', 'To reset your password:')}
                            </p>
                            <ol
                                className="text-sm space-y-1 list-decimal list-inside"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <li>{t('login.forgot_step_1', 'Contact the store owner or system administrator')}</li>
                                <li>
                                    {t(
                                        'login.forgot_step_2',
                                        'They can reset your password from the Users management page',
                                    )}
                                </li>
                                <li>{t('login.forgot_step_3', 'Log in with the new password provided')}</li>
                            </ol>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {t(
                                'login.forgot_password_note',
                                'For security reasons, passwords can only be reset by an administrator with owner-level access.',
                            )}
                        </p>
                        <button
                            onClick={() => {
                                setShowForgotPassword(false);
                                toast.info(
                                    t(
                                        'login.forgot_password_toast',
                                        'Please contact your administrator to reset your password.',
                                    ),
                                );
                            }}
                            className="w-full py-2.5 rounded-lg text-sm font-bold transition-all"
                            style={{ background: 'var(--accent)', color: '#0f172a' }}
                        >
                            {t('common.understood', 'Understood')}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
