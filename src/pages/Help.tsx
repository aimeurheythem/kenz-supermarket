import React from 'react';
import { HelpCircle, Mail, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Help() {
    const { t } = useTranslation();

    const contactMethods = [
        { icon: Mail, label: 'Email Support', value: 'support@supermarket.dz', color: 'text-blue-500' },
        { icon: Phone, label: 'Phone Support', value: '+213 123 456 789', color: 'text-emerald-500' },
        { icon: MessageSquare, label: 'Live Chat', value: 'Available 9AM - 6PM', color: 'text-purple-500' },
    ];

    return (
        <div className="h-full flex flex-col p-8 animate-fadeIn max-w-5xl mx-auto w-full space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                    {t('help.title', 'Help & Contact')}
                </h1>
                <p className="text-zinc-500 text-lg font-medium max-w-2xl">
                    {t('help.subtitle', 'Need assistance with your workstation? We are here to help you get the most out of your management system.')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contactMethods.map((method) => (
                    <div key={method.label} className="bg-neutral-800 border border-white/5 p-8 rounded-[32px] group hover:bg-neutral-800/80 transition-all duration-300">
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${method.color}`}>
                            <method.icon size={24} />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">{t(`help.contact.${method.label.toLowerCase().replace(' ', '_')}`, method.label)}</h3>
                        <p className="text-white font-bold text-lg">{method.value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    {t('help.faq.title', 'Common Questions')}
                </h2>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start justify-between p-6 bg-neutral-800/50 border border-white/5 rounded-[24px] group cursor-pointer hover:border-white/10 transition-all">
                            <div className="space-y-2">
                                <h4 className="text-white font-bold">{t(`help.faq.q${i}`, `Frequently asked question #${i}?`)}</h4>
                                <p className="text-zinc-500 text-sm">{t(`help.faq.a${i}`, 'Simple and clear answer to help user resolve their issue quickly.')}</p>
                            </div>
                            <ExternalLink size={16} className="text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
