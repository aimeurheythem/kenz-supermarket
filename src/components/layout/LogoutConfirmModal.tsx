import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Portal from '@/components/common/Portal';

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => Promise<void>;
}

export default function LogoutConfirmModal({ isOpen, onClose, onLogout }: LogoutConfirmModalProps) {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-black mb-1">
                                    {t('sidebar.signout_title', 'Sign out?')}
                                </h3>
                                <p className="text-black/40 text-sm">
                                    {t(
                                        'sidebar.signout_desc',
                                        "You'll need to sign in again to access your account dashboard.",
                                    )}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-gray-50 text-black font-bold rounded-xl transition-all hover:bg-gray-100"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={async () => {
                                        await onLogout();
                                    }}
                                    className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl transition-all hover:bg-red-600"
                                >
                                    {t('sidebar.signout_confirm', 'Sign out')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </Portal>
            )}
        </AnimatePresence>
    );
}
