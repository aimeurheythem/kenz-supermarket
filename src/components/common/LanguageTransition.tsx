import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useEffect } from 'react';

export default function LanguageTransition() {
    const { t, i18n } = useTranslation();
    const { isLanguageSwitching } = useLayoutStore();

    // Inject translations dynamically to ensure they are available
    useEffect(() => {
        i18n.addResource('en', 'translation', 'system.switching_language', 'Switching Language System...');
        i18n.addResource('fr', 'translation', 'system.switching_language', 'Changement de langue du système...');
        i18n.addResource('ar', 'translation', 'system.switching_language', 'جاري تغيير لغة النظام...');
    }, [i18n]);

    const isArabic = i18n.language === 'ar';

    return (
        <AnimatePresence>
            {isLanguageSwitching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.1, opacity: 0, y: -10 }}
                        transition={{ duration: 0.5, ease: 'circOut' }}
                        className="flex flex-col items-center gap-10"
                        style={{ fontFamily: isArabic ? '"Cairo", sans-serif' : 'inherit' }}
                    >
                        {/* Surgical Badge Drawing Animation */}
                        <div className="relative flex items-center justify-center">
                            <svg
                                width="180"
                                height="180"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-black"
                            >
                                <motion.path
                                    d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: [0, 1, 1],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 5.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        times: [0, 0.8, 1],
                                    }}
                                />
                                <motion.path
                                    d="m9 12 2 2 4-4"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: [0, 0, 1, 1],
                                        opacity: [0, 0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 5.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        times: [0, 0.4, 0.9, 1],
                                    }}
                                />
                            </svg>

                            {/* Pulse background */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-black/[0.03]"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col items-center gap-4">
                            <h2 className="text-lg font-bold text-black uppercase tracking-[0.4em] text-center">
                                {t('system.switching_language')}
                            </h2>
                            <div className="flex gap-2">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.8, 1],
                                            opacity: [0.2, 1, 0.2],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.3,
                                            ease: 'easeInOut',
                                        }}
                                        className="w-1.5 h-1.5 rounded-full bg-black/40"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
