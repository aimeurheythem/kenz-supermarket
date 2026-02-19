import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function DatabaseInitialization({ error }: { error?: string | null }) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 font-['Cairo']"
        >
            <div className="relative">
                {/* Subtle Pulse Background */}
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-accent rounded-full blur-3xl -z-10"
                    style={{ margin: '-40px' }}
                />

                {/* Surgical Badge Drawing Animation */}
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-black"
                >
                    {/* Badge Outline */}
                    <motion.path
                        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            duration: 2.5,
                            ease: "easeInOut",
                        }}
                    />
                    {/* Checkmark */}
                    <motion.path
                        d="m9 12 2 2 4-4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            duration: 1.2,
                            delay: 2.2,
                            ease: "easeOut",
                        }}
                    />
                </svg>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-12 text-center space-y-3"
            >
                <h2 className="text-xl font-medium tracking-tight text-black">
                    {t('db_init.initializing')}
                </h2>
                <p className="text-sm text-black font-light max-w-xs mx-auto leading-relaxed">
                    {t('db_init.please_wait')}
                </p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 p-3 rounded-xl bg-red-50 border border-red-100/50"
                    >
                        <p className="text-xs text-red-600 font-medium">Error: {error}</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Bottom Version Sticker */}
            <div className="absolute bottom-12 flex flex-col items-center gap-2">
                <div className="h-[1px] w-8 bg-black/10" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-black/20 font-medium">
                    {t('db_init.version')}
                </span>
            </div>
        </motion.div>
    );
}
