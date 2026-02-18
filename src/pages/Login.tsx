import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Eye, EyeOff, CheckSquare, Square, Users, Shield, Store, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CashierLoginModal from '@/components/auth/CashierLoginModal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Login() {
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCashierLogin, setShowCashierLogin] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const success = await login(username, password);
            if (success) {
                navigate(from, { replace: true });
            } else {
                setError(t('login.errors.invalid_credentials'));
            }
        } catch (err) {
            setError(t('login.errors.system_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCashierSuccess = () => {
        console.log('=== CASHIER LOGIN SUCCESS ===');
        console.log('Closing cashier modal and navigating to POS...');

        // Close modal immediately
        setShowCashierLogin(false);

        // Navigate immediately - don't wait
        console.log('Navigating to /pos...');
        navigate('/pos', { replace: true });
        console.log('Navigation called!');
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
            {/* LEFT SIDE - FORM */}
            <div className="w-full lg:w-[55%] relative z-10 flex flex-col justify-center px-12 sm:px-24 lg:px-32 xl:px-40 bg-white lg:[clip-path:polygon(0_0,100%_0,85%_100%,0%_100%)] [clip-path:none]">

                <div className="max-w-md w-full animate-fadeIn">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-extrabold text-[#1e293b] tracking-tight mb-3">
                            {t('login.title', 'Welcome Back')}
                        </h1>
                        <p className="text-[#94a3b8] text-lg font-normal">
                            {t('login.welcome', 'Sign in to access your account')}
                        </p>
                    </div>

                    {/* Login Mode Selector */}
                    <div className="flex gap-3 mb-8">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-orange-500 bg-orange-50 rounded-xl text-orange-700 font-semibold"
                        >
                            <Shield className="w-5 h-5" />
                            <span>Owner Login</span>
                        </button>
                        <button
                            onClick={() => setShowCashierLogin(true)}
                            className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                        >
                            <Users className="w-5 h-5" />
                            <span>Cashier Login</span>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Username Input */}
                        <div className="group relative border border-gray-200 rounded-lg p-3 transition-all duration-200 focus-within:border-orange-400 focus-within:shadow-[0_0_0_2px_rgba(251,146,60,0.1)]">
                            <label className="block text-[11px] font-bold text-[#14a3b8] uppercase tracking-wide mb-1" htmlFor="username">
                                {t('login.username', 'Username')}
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full text-[#334155] font-bold outline-none placeholder:text-gray-300 text-sm"
                                placeholder={t('login.email_placeholder', 'Enter username')}
                                style={{ fontWeight: 600 }}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="group relative border border-gray-200 rounded-lg p-3 transition-all duration-200 focus-within:border-orange-400 focus-within:shadow-[0_0_0_2px_rgba(251,146,60,0.1)]">
                            <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-wide mb-1" htmlFor="password">
                                {t('login.password', 'Password')}
                            </label>
                            <div className="flex items-center">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full text-[#334155] font-bold outline-none placeholder:text-gray-300 text-sm tracking-widest"
                                    placeholder={t('login.password_placeholder', 'Enter password')}
                                    style={{ fontWeight: 600 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative text-gray-300 group-hover:text-orange-400 transition-colors"
                                    onClick={(e) => { e.preventDefault(); setRememberMe(!rememberMe); }}>
                                    {rememberMe ? (
                                        <CheckSquare size={20} className="text-orange-500" />
                                    ) : (
                                        <Square size={20} />
                                    )}
                                </div>
                                <span className="text-[#475569] text-sm font-semibold select-none">{t('login.remember_me', 'Remember me')}</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-[#475569] text-sm font-bold hover:text-orange-500 transition-colors"
                            >
                                {t('login.forgot_password', 'Forgot password?')}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-500 text-sm font-medium animate-pulse">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-[180px] h-[50px] mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-sm tracking-wide rounded shadow-lg shadow-orange-200 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center uppercase"
                        >
                            {loading ? t('login.logging_in', 'Logging in...') : t('login.login_button', 'Login')}
                        </button>




                    </form>
                </div>
            </div>

            {/* RIGHT SIDE - VISUAL */}
            <div className="absolute top-0 right-0 w-[60%] h-full hidden lg:block"
                style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 40%, #1e3a5f 70%, #0f172a 100%)',
                }}>
                {/* Decorative grid overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                {/* Orange accent glow */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

                {/* Logo Overlay */}
                <div className="absolute top-1/2 left-[20%] transform -translate-y-1/2 flex items-center gap-4">
                    <div className="w-16 h-16 border-2 border-white transform rotate-45 flex items-center justify-center relative">
                        <div className="absolute w-full h-[1px] bg-white -rotate-45"></div>
                        <div className="absolute w-[1px] h-full bg-white -rotate-45"></div>
                    </div>
                    <h1 className="text-white text-6xl font-black tracking-tight font-sans">
                        Spark<span className="text-orange-400">POS</span>
                    </h1>
                </div>

                {/* Feature highlights */}
                <div className="absolute bottom-20 left-[20%] space-y-4">
                    <div className="flex items-center gap-3 text-white/90">
                        <Store className="w-6 h-6" />
                        <span className="text-lg font-semibold">Multi-Cashier Support</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                        <Shield className="w-6 h-6" />
                        <span className="text-lg font-semibold">Role-Based Access</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                        <Users className="w-6 h-6" />
                        <span className="text-lg font-semibold">Shift Tracking</span>
                    </div>
                </div>
            </div>

            {/* Cashier Login Modal */}
            <CashierLoginModal
                isOpen={showCashierLogin}
                onClose={() => setShowCashierLogin(false)}
                onSuccess={handleCashierSuccess}
            />

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-orange-500" />
                            {t('login.forgot_password', 'Forgot password?')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('login.forgot_password_desc', 'Password reset is handled by the system administrator.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-orange-800">
                                {t('login.forgot_password_steps_title', 'To reset your password:')}
                            </p>
                            <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
                                <li>{t('login.forgot_step_1', 'Contact the store owner or system administrator')}</li>
                                <li>{t('login.forgot_step_2', 'They can reset your password from the Users management page')}</li>
                                <li>{t('login.forgot_step_3', 'Log in with the new password provided')}</li>
                            </ol>
                        </div>
                        <p className="text-xs text-gray-500">
                            {t('login.forgot_password_note', 'For security reasons, passwords can only be reset by an administrator with owner-level access.')}
                        </p>
                        <button
                            onClick={() => {
                                setShowForgotPassword(false);
                                toast.info(t('login.forgot_password_toast', 'Please contact your administrator to reset your password.'));
                            }}
                            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-sm rounded-xl transition-all"
                        >
                            {t('common.understood', 'Understood')}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
