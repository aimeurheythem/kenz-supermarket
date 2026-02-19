import { useTranslation } from 'react-i18next';
import { Database, Download, Upload } from 'lucide-react';
import Button from '@/components/common/Button';

interface SystemTabProps {
    handleBackup: () => void;
    handleRestore: () => void;
}

export default function SystemTab({ handleBackup, handleRestore }: SystemTabProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Database size={20} className="text-red-500" />
                {t('settings.system_title')}
            </h2>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('settings.backup_title')}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{t('settings.backup_desc')}</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={handleBackup} icon={<Download size={16} />}>
                        {t('settings.backup_btn')}
                    </Button>
                    <Button variant="secondary" onClick={handleRestore} icon={<Upload size={16} />}>
                        {t('settings.restore_btn')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
