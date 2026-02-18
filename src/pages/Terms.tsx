import React, { useState } from 'react';
import { ShieldCheck, Scale, FileText, Mail, Phone, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Terms() {
    const { t } = useTranslation();
    const [showContact, setShowContact] = useState(false);

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
                <h1 className="text-4xl font-black text-[var(--color-text-primary)] tracking-tighter uppercase">
                    {t('terms.title', 'Terms of Use')}
                </h1>
                <p className="text-[var(--color-text-muted)] text-lg font-medium">
                    {t('terms.subtitle', 'Please review our professional guidelines for using this workstation.')}
                </p>
            </div>

            <div className="space-y-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4 border-l-2 border-[var(--color-border)] pl-8 py-2 hover:border-emerald-500/30 transition-colors">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] uppercase tracking-tight flex items-center gap-3">
                            <span className="text-emerald-500 text-sm font-black">0{idx + 1}.</span>
                            {section.title}
                        </h3>
                        <p className="text-[var(--color-text-muted)] leading-relaxed text-sm">
                            {section.content}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[32px] flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={32} className="text-[var(--color-text-muted)]" />
                    </div>
                    <div>
                        <h4 className="text-[var(--color-text-primary)] font-bold">{t('terms.footer.title', 'Questions about these terms?')}</h4>
                        <p className="text-[var(--color-text-muted)] text-sm">{t('terms.footer.subtitle', 'Contact our legal and compliance department.')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowContact(true)}
                    className="px-6 py-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-2xl font-bold text-sm transition-all active:scale-95 uppercase tracking-widest"
                >
                    {t('common.contact', 'Contact Us')}
                </button>
            </div>

            {/* Contact Dialog */}
            <Dialog open={showContact} onOpenChange={setShowContact}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            {t('terms.contact_title', 'Contact Legal & Compliance')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('terms.contact_desc', 'Reach out to our team for questions about terms, privacy, or licensing.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                <Mail className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">{t('help.contact.email_support', 'Email Support')}</p>
                                    <p className="text-sm font-bold text-blue-700">support@supermarket.dz</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                <Phone className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">{t('help.contact.phone_support', 'Phone Support')}</p>
                                    <p className="text-sm font-bold text-emerald-700">+213 123 456 789</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                <MessageSquare className="w-5 h-5 text-purple-500" />
                                <div>
                                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">{t('help.contact.live_chat', 'Live Chat')}</p>
                                    <p className="text-sm font-bold text-purple-700">{t('terms.chat_hours', 'Available 9AM - 6PM')}</p>
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
                            {t('common.close', 'Close')}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
