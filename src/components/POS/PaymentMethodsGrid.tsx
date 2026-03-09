import ActionButton from './ActionButton';
import { Banknote, CreditCard, Smartphone, UserMinus, PlusSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentMethodsGridProps {
    onPayCash: () => void;
    onPayCard: () => void;
    onPayMobile: () => void;
    onPayDebt: () => void;
    onSplitPayment: () => void;
    isProcessing: boolean;
}

export default function PaymentMethodsGrid({
    onPayCash,
    onPayCard,
    onPayMobile,
    onPayDebt,
    onSplitPayment,
    isProcessing
}: PaymentMethodsGridProps) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 auto-rows-fr gap-2 p-2 2xl:gap-3 2xl:p-3 flex-1 h-full">
            <div className="flex">
                <ActionButton
                    icon={Banknote}
                    label={t('pos.payment.cash', 'Cash')}
                    onClick={onPayCash}
                    variant="success"
                    disabled={isProcessing}
                />
            </div>
            <div className="flex">
                <ActionButton
                    icon={CreditCard}
                    label={t('pos.payment.card', 'Card')}
                    onClick={onPayCard}
                    variant="default"
                    disabled={isProcessing}
                />
            </div>
            <div className="flex">
                <ActionButton
                    icon={Smartphone}
                    label={t('pos.payment.mobile', 'Mobile')}
                    onClick={onPayMobile}
                    variant="default"
                    disabled={isProcessing}
                />
            </div>
            <div className="flex">
                <ActionButton
                    icon={UserMinus}
                    label={t('pos.payment.debt', 'Debt')}
                    onClick={onPayDebt}
                    variant="warning"
                    disabled={isProcessing}
                />
            </div>
            <div className="col-span-2 flex">
                <ActionButton
                    icon={PlusSquare}
                    label={t('pos.split_payment', 'Split Payment')}
                    onClick={onSplitPayment}
                    variant="default"
                    disabled={isProcessing}
                />
            </div>
        </div>
    );
}
