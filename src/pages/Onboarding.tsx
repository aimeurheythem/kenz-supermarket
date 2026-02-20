import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Store, User, Settings as SettingsIcon, Check, ArrowRight, Globe } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore } from '@/stores/useUserStore';
import { cn, validatePassword, validateEmail } from '@/lib/utils';

// Step definitions
const STEPS = [
    { id: 'welcome', title: 'onboarding.step_welcome', icon: Globe },
    { id: 'store', title: 'onboarding.step_store', icon: Store },
    { id: 'admin', title: 'onboarding.step_admin', icon: User },
    { id: 'preferences', title: 'onboarding.step_preferences', icon: SettingsIcon },
];

export default function Onboarding() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { updateSettings } = useSettingsStore();
    const { login } = useAuthStore();
    const { addUser, hasAnyUsers } = useUserStore();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [direction, setDirection] = useState(0); // For slide animation direction

    // Form State
    const [formData, setFormData] = useState({
        // Store Info
        storeName: '',
        storePhone: '',
        storeEmail: '',
        storeAddress: '',

        // Admin Account
        adminName: '',
        adminUsername: '',
        adminPassword: '',
        adminConfirmPassword: '',

        // Preferences
        currencySymbol: 'DZ',
        currencyPosition: 'suffix', // prefix or suffix
        taxRate: '0',
        taxName: 'Tax',
    });

    // Check if we should be here
    useEffect(() => {
        const checkUsers = async () => {
            const has = await hasAnyUsers();
            if (has) {
                navigate('/login', { replace: true });
            }
        };
        checkUsers();
    }, [navigate, hasAnyUsers]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // 1. Create Admin User
            await addUser({
                username: formData.adminUsername,
                password: formData.adminPassword,
                full_name: formData.adminName,
                role: 'admin',
            });

            // 2. Save Settings
            await updateSettings({
                'store.name': formData.storeName,
                'store.phone': formData.storePhone,
                'store.email': formData.storeEmail,
                'store.address': formData.storeAddress,
                'currency.symbol': formData.currencySymbol,
                'currency.position': formData.currencyPosition,
                'tax.name': formData.taxName,
                'tax.rate': formData.taxRate,
            });

            // 3. Login
            const success = await login(formData.adminUsername, formData.adminPassword);

            if (success) {
                // Navigate home — App.tsx re-checks hasAnyUsers via isAuthenticated dep
                navigate('/');
            }
        } catch (error) {
            console.error('Setup failed:', error);
            toast.error(t('onboarding.setup_failed'));
        } finally {
            setLoading(false);
        }
    };

    const setLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    // Step Validation
    const isStepValid = () => {
        switch (currentStep) {
            case 0:
                return true; // Language selection is always valid (has defaults)
            case 1:
                return formData.storeName.length > 0 && validateEmail(formData.storeEmail, t).valid;
            case 2:
                return (
                    formData.adminName.length > 0 &&
                    formData.adminUsername.length > 0 &&
                    validatePassword(formData.adminPassword, t).valid &&
                    formData.adminPassword === formData.adminConfirmPassword
                );
            case 3:
                return true; // Defaults provided
            default:
                return false;
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-black selection:text-white">
            {/* Top Bar - Progress */}
            <div className="w-full h-16 px-8 flex items-center justify-between border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white rotate-45" />
                    </div>
                    <span className="font-bold tracking-tight text-lg">{t('onboarding.app_name')}</span>
                </div>

                <div className="flex items-center gap-2">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                                    idx === currentStep
                                        ? 'bg-black text-white scale-110'
                                        : idx < currentStep
                                          ? 'bg-zinc-100 text-zinc-400'
                                          : 'bg-white border border-zinc-200 text-zinc-300',
                                )}
                            >
                                {idx < currentStep ? <Check size={14} /> : idx + 1}
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        'w-8 h-[2px] mx-2 transition-colors duration-300',
                                        idx < currentStep ? 'bg-zinc-200' : 'bg-zinc-100',
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        className="w-full max-w-lg"
                    >
                        {/* STEP 1: WELCOME & LANGUAGE */}
                        {currentStep === 0 && (
                            <div className="space-y-8 text-center">
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-extrabold tracking-tight">
                                        {t('onboarding.welcome_title')}
                                    </h1>
                                    <p className="text-zinc-500 text-lg">{t('onboarding.welcome_subtitle')}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4">
                                    {[
                                        { code: 'en', label: 'English', flag: '🇺🇸' },
                                        { code: 'fr', label: 'Français', flag: '🇫🇷' },
                                        { code: 'ar', label: 'العربية', flag: '🇲🇦' },
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setLanguage(lang.code)}
                                            className={cn(
                                                'flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105',
                                                i18n.language.startsWith(lang.code)
                                                    ? 'border-black bg-zinc-50 shadow-lg'
                                                    : 'border-zinc-100 bg-white hover:border-zinc-200',
                                            )}
                                        >
                                            <span className="text-3xl">{lang.flag}</span>
                                            <span className="font-bold">{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: STORE INFO */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold mb-2">{t('onboarding.store_title')}</h2>
                                    <p className="text-zinc-500">{t('onboarding.store_subtitle')}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5 ml-1">
                                            {t('onboarding.label_store_name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.storeName}
                                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                            className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium"
                                            placeholder={t('onboarding.placeholder_store_name')}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_phone')}
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.storePhone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, storePhone: e.target.value })
                                                }
                                                className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium"
                                                placeholder={t('onboarding.placeholder_phone')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_email')}
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.storeEmail}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, storeEmail: e.target.value })
                                                }
                                                className={cn(
                                                    'w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium',
                                                    formData.storeEmail &&
                                                        !validateEmail(formData.storeEmail, t).valid &&
                                                        'border-red-500 focus:border-red-500',
                                                )}
                                                placeholder={t('onboarding.placeholder_email')}
                                            />
                                            {formData.storeEmail && !validateEmail(formData.storeEmail, t).valid && (
                                                <p className="text-xs text-red-500 mt-1 ml-1">
                                                    {validateEmail(formData.storeEmail, t).message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5 ml-1">
                                            {t('onboarding.label_address')}
                                        </label>
                                        <textarea
                                            value={formData.storeAddress}
                                            onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                                            className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium resize-none h-24"
                                            placeholder={t('onboarding.placeholder_address')}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: ADMIN ACCOUNT */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold mb-2">{t('onboarding.admin_title')}</h2>
                                    <p className="text-zinc-500">{t('onboarding.admin_subtitle')}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5 ml-1">
                                            {t('onboarding.label_full_name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                            className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium"
                                            placeholder={t('onboarding.placeholder_full_name')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5 ml-1">
                                            {t('onboarding.label_username')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.adminUsername}
                                            onChange={(e) =>
                                                setFormData({ ...formData, adminUsername: e.target.value })
                                            }
                                            className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium"
                                            placeholder={t('onboarding.placeholder_username')}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_password')}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.adminPassword}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, adminPassword: e.target.value })
                                                }
                                                className={cn(
                                                    'w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium',
                                                    formData.adminPassword &&
                                                        !validatePassword(formData.adminPassword, t).valid &&
                                                        'border-red-500 focus:border-red-500',
                                                )}
                                                placeholder={t('onboarding.placeholder_password')}
                                            />
                                            {formData.adminPassword &&
                                                !validatePassword(formData.adminPassword, t).valid && (
                                                    <p className="text-xs text-red-500 mt-1 ml-1">
                                                        {validatePassword(formData.adminPassword, t).message}
                                                    </p>
                                                )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_confirm')}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.adminConfirmPassword}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, adminConfirmPassword: e.target.value })
                                                }
                                                className={cn(
                                                    'w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium',
                                                    formData.adminConfirmPassword &&
                                                        formData.adminPassword !== formData.adminConfirmPassword &&
                                                        'border-red-500 focus:border-red-500',
                                                )}
                                                placeholder={t('onboarding.placeholder_confirm')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PREFERENCES */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold mb-2">{t('onboarding.preferences_title')}</h2>
                                    <p className="text-zinc-500">{t('onboarding.preferences_subtitle')}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_currency_symbol')}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.currencySymbol}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, currencySymbol: e.target.value })
                                                }
                                                className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium"
                                                placeholder="DZ"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_position')}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2 h-[58px]">
                                                <button
                                                    onClick={() =>
                                                        setFormData({ ...formData, currencyPosition: 'prefix' })
                                                    }
                                                    className={cn(
                                                        'rounded-xl text-sm font-bold transition-all',
                                                        formData.currencyPosition === 'prefix'
                                                            ? 'bg-black text-white'
                                                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
                                                    )}
                                                >
                                                    DZ 100
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setFormData({ ...formData, currencyPosition: 'suffix' })
                                                    }
                                                    className={cn(
                                                        'rounded-xl text-sm font-bold transition-all',
                                                        formData.currencyPosition === 'suffix'
                                                            ? 'bg-black text-white'
                                                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
                                                    )}
                                                >
                                                    100 DZ
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_tax_name')}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.taxName}
                                                onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                                                className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium"
                                                placeholder="Tax"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 ml-1">
                                                {t('onboarding.label_tax_rate')}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={formData.taxRate}
                                                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                                className="w-full p-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black outline-none transition-all font-medium"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Bar - Actions */}
            <div className="w-full p-8 flex items-center justify-between border-t border-zinc-100 bg-white sticky bottom-0 z-50">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0 || loading}
                    className={cn(
                        'px-6 py-3 rounded-xl font-bold text-zinc-500 hover:text-black hover:bg-zinc-50 transition-all disabled:opacity-0',
                    )}
                >
                    {t('onboarding.back')}
                </button>

                <button
                    onClick={handleNext}
                    disabled={!isStepValid() || loading}
                    className={cn(
                        'flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-black text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-black/20',
                    )}
                >
                    {loading ? (
                        <span>{t('onboarding.setting_up')}</span>
                    ) : (
                        <>
                            <span>
                                {currentStep === STEPS.length - 1 ? t('onboarding.finish') : t('onboarding.continue')}
                            </span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
