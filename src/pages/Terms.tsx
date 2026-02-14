import React from 'react';
import { ShieldCheck, Scale, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Terms() {
    const { t } = useTranslation();

    const sections = [
        {
            title: t('terms.sections.general.title', 'General Usage'),
            content: t('terms.sections.general.content', 'These terms govern your use of the SuperMarket Management System. By accessing the workstation, you agree to comply with our professional standards and data handling policies.')
        },
        {
            title: t('terms.sections.privacy.title', 'Data Privacy'),
            content: t('terms.sections.privacy.content', 'We take your data seriously. All transaction records and customer information are encrypted and handled in accordance with local data protection regulations.')
        },
        {
            title: t('terms.sections.license.title', 'Software License'),
            content: t('terms.sections.license.content', 'The software is provided "as is" for internal management purposes. Redistribution or modification of the source code without explicit permission is strictly prohibited.')
        }
    ];

    return (
        <div className="h-full flex flex-col p-8 animate-fadeIn max-w-4xl mx-auto w-full space-y-12">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Scale size={20} className="text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                        {t('terms.version', 'Last Updated: Feb 2026')}
                    </span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                    {t('terms.title', 'Terms of Use')}
                </h1>
                <p className="text-zinc-500 text-lg font-medium">
                    {t('terms.subtitle', 'Please review our professional guidelines for using this workstation.')}
                </p>
            </div>

            <div className="space-y-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4 border-l-2 border-white/5 pl-8 py-2 hover:border-emerald-500/30 transition-colors">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <span className="text-emerald-500 text-sm font-black">0{idx + 1}.</span>
                            {section.title}
                        </h3>
                        <p className="text-zinc-500 leading-relaxed text-sm">
                            {section.content}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-neutral-800 border border-white/5 p-8 rounded-[32px] flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={32} className="text-zinc-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold">{t('terms.footer.title', 'Questions about these terms?')}</h4>
                        <p className="text-zinc-500 text-sm">{t('terms.footer.subtitle', 'Contact our legal and compliance department.')}</p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 uppercase tracking-widest">
                    {t('common.contact', 'Contact Us')}
                </button>
            </div>
        </div>
    );
}
