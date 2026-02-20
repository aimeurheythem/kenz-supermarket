import { useEffect } from 'react';

const APP_NAME = 'SuperMarket Pro';

/**
 * Sets document.title to `<pageTitle> — SuperMarket Pro` while
 * the component is mounted, and restores the base title on unmount.
 */
export function usePageTitle(pageTitle?: string) {
    useEffect(() => {
        const prev = document.title;
        document.title = pageTitle ? `${pageTitle} — ${APP_NAME}` : APP_NAME;
        return () => {
            document.title = prev;
        };
    }, [pageTitle]);
}
