import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/stores/useLayoutStore';

export const languages = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'ar', label: 'العربية', flag: 'AR' },
] as const;

export function useLanguageSwitch() {
    const { i18n } = useTranslation();
    const setLanguageSwitching = useLayoutStore((state) => state.setLanguageSwitching);

    const currentLang = i18n.language.split('-')[0];
    const currentLangData = languages.find((l) => l.code === currentLang) || languages[0];

    const changeLanguage = useCallback(
        async (lang: string) => {
            if (currentLang === lang) return;

            setLanguageSwitching(true);

            await new Promise((resolve) => setTimeout(resolve, 800));
            i18n.changeLanguage(lang);
            await new Promise((resolve) => setTimeout(resolve, 4300));

            setLanguageSwitching(false);
        },
        [currentLang, i18n, setLanguageSwitching],
    );

    return { languages, currentLang, currentLangData, changeLanguage };
}
