import React, { useState } from 'react';
import { ShieldCheck, Scale, Mail, Phone, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Terms() {
    const { t } = useTranslation();
    usePageTitle(t('terms.title', 'Terms & Conditions'));
    const [showContact, setShowContact] = useState(false);

    const sections = [
        {
            title: t('terms.sections.general.title', 'General Usage'),
            content: t(
                'terms.sections.general.content',
                'These terms govern your use of the SuperMarket Management System. By accessing the workstation, you agree to comply with our professional standards and data handling policies.',
            ),
        },
        {
            title: t('terms.sections.privacy.title', 'Data Privacy'),
            content: t(
                'terms.sections.privacy.content',
                'We take your data seriously. All transaction records and customer information are encrypted and handled in accordance with local data protection regulations.',
            ),
        },
        {
            title: t('terms.sections.license.title', 'Software License'),
            content: t(
                'terms.sections.license.content',
                'The software is provided "as is" for internal management purposes. Redistribution or modification of the source code without explicit permission is strictly prohibited.',
            ),
        },
    ];

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4 max-w-4xl mx-auto w-full">
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.15] rounded-[3rem]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                }}
            />

            <div className="relative z-10 space-y-12 w-full">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Scale size={20} className="text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                            {t('terms.version', 'Last Updated: Feb 2026')}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-black tracking-tighter uppercase">
                        {t('terms.title', 'Terms of Use')}
                    </h1>
                    <p className="text-zinc-500 text-lg font-medium">
                        {t('terms.subtitle', 'Please review our professional guidelines for using this workstation.')}
                    </p>
                </div>

                <div className="space-y-10">
                    {sections.map((section, idx) => (
                        <div
                            key={idx}
                            className="space-y-4 border-l-2 border-zinc-200 pl-8 py-2 hover:border-emerald-300 transition-colors"
                        >
                            <h3 className="text-xl font-bold text-black uppercase tracking-tight flex items-center gap-3">
                                <span className="text-emerald-500 text-sm font-black">0{idx + 1}.</span>
                                {section.title}
                            </h3>
                            <p className="text-zinc-500 leading-relaxed text-sm">{section.content}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border-2 border-black/5 p-8 rounded-[2rem] flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={32} className="text-zinc-400" />
                        </div>
                        <div>
                            <h4 className="text-black font-bold">
                                {t('terms.footer.title', 'Questions about these terms?')}
                            </h4>
                            <p className="text-zinc-500 text-sm">
                                {t('terms.footer.subtitle', 'Contact our legal and compliance department.')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowContact(true)}
                        className="px-6 py-3 bg-zinc-100 hover:bg-black text-black hover:text-white rounded-2xl font-bold text-sm transition-all active:scale-95 uppercase tracking-widest"
                    >
                        {t('terms.contact_us', 'Contact Us')}
                    </button>
                </div>
            </div>

            {/* Contact Dialog */}
            <Dialog open={showContact} onOpenChange={setShowContact}>
                <DialogContent className="sm:max-w-md rounded-[2rem] p-6 bg-white border border-zinc-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-black">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            {t('terms.contact_title', 'Contact Legal & Compliance')}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            {t(
                                'terms.contact_desc',
                                'Reach out to our team for questions about terms, privacy, or licensing.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                <Mail className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                        {t('help.contact.email_support', 'Email Support')}
                                    </p>
                                    <p className="text-sm font-bold text-blue-700">support@supermarket.dz</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                <Phone className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                        {t('help.contact.phone_support', 'Phone Support')}
                                    </p>
                                    <p className="text-sm font-bold text-emerald-700">+213 123 456 789</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                <MessageSquare className="w-5 h-5 text-purple-500" />
                                <div>
                                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                                        {t('help.contact.live_chat', 'Live Chat')}
                                    </p>
                                    <p className="text-sm font-bold text-purple-700">
                                        {t('terms.chat_hours', 'Available 9AM - 6PM')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowContact(false);
                                toast.info(t('terms.contact_toast', 'You can reach us via any of the channels above.'));
                            }}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all"
                        >
                            {t('terms.close', 'Close')}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
