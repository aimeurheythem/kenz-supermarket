// POS.tsx — Orchestrator — delegates to POSLayout for the new 3-column grid
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/hooks/usePageTitle';
import POSLayout from '@/components/POS/POSLayout';

export default function POS() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.pos_sales'));

    return <POSLayout />;
}
