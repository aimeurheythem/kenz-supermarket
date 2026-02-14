import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export default function Credit() {
    const { t } = useTranslation();

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Icon Section */}
                <div className="relative inline-block">
                    <div className="w-32 h-32 bg-emerald-500/10 rounded-[40px] flex items-center justify-center animate-pulse">
                        <Wallet size={64} className="text-emerald-500" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-neutral-800 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
                        <Sparkles size={20} className="text-amber-500" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            {t('credit.status', 'Development in Progress')}
                        </span>
                    </div>

                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        {t('credit.title', 'Credit System')}
                        <span className="block text-emerald-500">{t('credit.coming_soon', 'Coming Soon')}</span>
                    </h1>

                    <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                        {t('credit.description', "We're building a powerful credit and debt management system to help you track customer balances and payments seamlessly.")}
                    </p>
                </div>

                {/* Progress Visualizer */}
                <div className="pt-8 flex flex-col items-center gap-4">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                        <div className="h-full bg-emerald-500 w-[65%] rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                        {t('credit.completion', '65% Completed')}
                    </span>
                </div>
            </div>
        </div>
    );
}
