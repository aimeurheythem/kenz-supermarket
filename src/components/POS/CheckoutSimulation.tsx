import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import Portal from '@/components/common/Portal';

interface CheckoutSimulationProps {
    total: number;
    onComplete: () => void;
}

type Step = 'printing' | 'success';

export default function CheckoutSimulation({ total, onComplete }: CheckoutSimulationProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('printing');

    useEffect(() => {
        if (step === 'printing') {
            // Step 1: Printing (3s) -> Success
            const timer = setTimeout(() => {
                setStep('success');
            }, 3000);
            return () => clearTimeout(timer);
        } else if (step === 'success') {
            // Step 2: Success (3s) -> Complete/Reload
            const timer = setTimeout(() => {
                onComplete();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, onComplete]);

    return (
        <Portal>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 right-8 z-[9999] bg-white rounded-[2rem] shadow-2xl p-6 flex items-center gap-6 w-80 border border-zinc-100"
            >
                <div className="relative w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-full flex-shrink-0">
                    <AnimatePresence mode="wait">
                        {step === 'printing' ? (
                            <motion.svg
                                key="printing"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-black"
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Paper Outline */}
                                <motion.path
                                    d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                                {/* Lines */}
                                <motion.path
                                    d="M14 8H8M16 12H8M13 16H8"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, delay: 1, ease: "easeOut" }}
                                />
                            </motion.svg>
                        ) : (
                            <motion.svg
                                key="success"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-green-500"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <motion.path
                                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                />
                                <motion.path
                                    d="M22 4 12 14.01l-3-3"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                                />
                            </motion.svg>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -5, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 'printing' ? (
                                <>
                                    <h3 className="text-sm font-black text-black uppercase tracking-wider">
                                        {t('pos.simulation.printing')}
                                    </h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                        {t('pos.simulation.please_wait')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-sm font-black text-green-600 uppercase tracking-wider">
                                        {t('pos.simulation.payment_received')}
                                    </h3>
                                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mt-1">
                                        {t('pos.simulation.order_completed')}
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </Portal>
    );
}
