import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="w-full py-6 mt-auto bg-primary">
            <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-1">
                    <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
                </div>

                <div className="flex items-center gap-6">
                    <a href="#" className="text-black transition-colors flex items-center gap-1.5 group">
                        <ShieldCheck size={14} />
                        {t('footer.privacy')}
                    </a>
                    <a href="#" className="text-black transition-colors">
                        {t('footer.terms')}
                    </a>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 text-black">
                        <span>{t('footer.status')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
