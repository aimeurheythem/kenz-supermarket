import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePromotionStore } from '@/stores/usePromotionStore';
import Button from '@/components/common/Button';
import GeneralInfoSection from './form-sections/GeneralInfoSection';
import PriceDiscountSection from './form-sections/PriceDiscountSection';
import QuantityDiscountSection from './form-sections/QuantityDiscountSection';
import PackDiscountSection from './form-sections/PackDiscountSection';
import type {
    Promotion,
    PromotionType,
    PromotionStatus,
    PriceDiscountConfig,
    QuantityDiscountConfig,
    PackDiscountConfig,
    PromotionConfig,
} from '@/lib/types';

interface PromotionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    promotion?: Promotion | null;
}

// ── Default Config per Type ────────────────────────────────────────────────

const DEFAULT_PRICE_CONFIG: PriceDiscountConfig = { discount_type: 'percentage', discount_value: 0, max_discount: null };
const DEFAULT_QTY_CONFIG: QuantityDiscountConfig = { buy_quantity: 1, free_quantity: 1 };
const DEFAULT_PACK_CONFIG: PackDiscountConfig = { bundle_price: 0 };

function defaultConfigForType(type: PromotionType): PromotionConfig {
    if (type === 'price_discount') return { ...DEFAULT_PRICE_CONFIG };
    if (type === 'quantity_discount') return { ...DEFAULT_QTY_CONFIG };
    return { ...DEFAULT_PACK_CONFIG };
}

// ── Form State ─────────────────────────────────────────────────────────────

interface FormState {
    name: string;
    type: PromotionType;
    status: PromotionStatus;
    start_date: string;
    end_date: string;
    product_ids: number[];
    config: PromotionConfig;
}

interface FormErrors {
    name?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
    product_ids?: string;
    discount_type?: string;
    discount_value?: string;
    max_discount?: string;
    buy_quantity?: string;
    free_quantity?: string;
    bundle_price?: string;
}

function getInitialState(promotion?: Promotion | null): FormState {
    if (!promotion) {
        return {
            name: '',
            type: 'price_discount',
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            product_ids: [],
            config: { ...DEFAULT_PRICE_CONFIG },
        };
    }

    let config: PromotionConfig;
    try {
        config = typeof promotion.config === 'string'
            ? JSON.parse(promotion.config)
            : (promotion.config as unknown as PromotionConfig);
    } catch {
        config = defaultConfigForType(promotion.type);
    }

    return {
        name: promotion.name,
        type: promotion.type,
        status: promotion.status,
        start_date: promotion.start_date,
        end_date: promotion.end_date || '',
        product_ids: promotion.products?.map((p) => p.product_id) ?? [],
        config,
    };
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateForm(state: FormState): FormErrors {
    const errors: FormErrors = {};

    // General
    if (!state.name.trim()) errors.name = 'Name is required';
    else if (state.name.length > 200) errors.name = 'Name must be 200 characters or less';

    if (!state.start_date) errors.start_date = 'Start date is required';
    if (!state.end_date) errors.end_date = 'End date is required';
    else if (state.start_date && state.end_date <= state.start_date)
        errors.end_date = 'End date must be after start date';
    // Products
    if (state.type === 'pack_discount') {
        if (state.product_ids.length < 2) errors.product_ids = 'At least 2 products required for a bundle';
    } else {
        if (state.product_ids.length === 0) errors.product_ids = 'Exactly 1 product is required';
        else if (state.product_ids.length > 1) errors.product_ids = 'Exactly 1 product required for this type';
    }

    // Type-specific
    if (state.type === 'price_discount') {
        const cfg = state.config as PriceDiscountConfig;
        if (!cfg.discount_type) errors.discount_type = 'Discount type required';
        if (!cfg.discount_value || cfg.discount_value <= 0) errors.discount_value = 'Discount value must be > 0';
        else if (cfg.discount_type === 'percentage' && cfg.discount_value > 100)
            errors.discount_value = 'Percentage cannot exceed 100';
        if (cfg.max_discount !== null && cfg.max_discount !== undefined && cfg.max_discount <= 0)
            errors.max_discount = 'Max discount must be > 0';
    }

    if (state.type === 'quantity_discount') {
        const cfg = state.config as QuantityDiscountConfig;
        if (!cfg.buy_quantity || cfg.buy_quantity < 1) errors.buy_quantity = 'Buy quantity must be ≥ 1';
        if (!cfg.free_quantity || cfg.free_quantity < 1) errors.free_quantity = 'Free quantity must be ≥ 1';
    }

    if (state.type === 'pack_discount') {
        const cfg = state.config as PackDiscountConfig;
        if (!cfg.bundle_price || cfg.bundle_price <= 0) errors.bundle_price = 'Bundle price must be > 0';
    }

    return errors;
}

export default function PromotionFormModal({ isOpen, onClose, promotion }: PromotionFormModalProps) {
    const { t } = useTranslation();
    const { addPromotion, updatePromotion } = usePromotionStore();
    const isEditMode = !!promotion;

    const [form, setForm] = useState<FormState>(() => getInitialState(promotion));
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    useEffect(() => {
        if (isOpen) {
            setForm(getInitialState(promotion));
            setErrors({});
            setStep(1);
        }
    }, [isOpen, promotion]);

    const updateForm = (partial: Partial<FormState>) => {
        setForm((prev) => ({ ...prev, ...partial }));
        const clearedKeys = Object.keys(partial) as (keyof FormState)[];
        if (clearedKeys.some((k) => k in errors)) {
            setErrors((prev) => {
                const next = { ...prev };
                clearedKeys.forEach((k) => delete next[k as keyof FormErrors]);
                return next;
            });
        }
    };

    const handleTypeChange = (type: PromotionType) => {
        setForm((prev) => ({
            ...prev,
            type,
            product_ids: [],
            config: defaultConfigForType(type),
        }));
        setErrors({});
    };

    const handleNext = () => {
        const step1Errors: FormErrors = {};
        if (!form.name.trim()) step1Errors.name = 'Name is required';
        else if (form.name.length > 200) step1Errors.name = 'Name must be 200 characters or less';

        if (!form.start_date) step1Errors.start_date = 'Start date is required';
        if (!form.end_date) step1Errors.end_date = 'End date is required';
        else if (form.start_date && form.end_date <= form.start_date)
            step1Errors.end_date = 'End date must be after start date';

        if (Object.keys(step1Errors).length > 0) {
            setErrors(step1Errors);
        } else {
            setErrors({});
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditMode && promotion) {
                await updatePromotion(promotion.id, {
                    name: form.name,
                    status: form.status,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    product_ids: form.product_ids,
                    config: form.config,
                });
            } else {
                await addPromotion({
                    name: form.name,
                    type: form.type,
                    status: form.status,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    product_ids: form.product_ids,
                    config: form.config,
                });
            }
            onClose();
        } catch (err) {
            toast.error((err as Error).message ?? 'Failed to save promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeProps = {
        price_discount: {
            values: { product_ids: form.product_ids, config: form.config as PriceDiscountConfig },
            errors: { product_ids: errors.product_ids, discount_type: errors.discount_type, discount_value: errors.discount_value, max_discount: errors.max_discount },
            onChange: (partial: { product_ids?: number[]; config?: PriceDiscountConfig }) => updateForm(partial as Partial<FormState>),
        },
        quantity_discount: {
            values: { product_ids: form.product_ids, config: form.config as QuantityDiscountConfig },
            errors: { product_ids: errors.product_ids, buy_quantity: errors.buy_quantity, free_quantity: errors.free_quantity },
            onChange: (partial: { product_ids?: number[]; config?: QuantityDiscountConfig }) => updateForm(partial as Partial<FormState>),
        },
        pack_discount: {
            values: { product_ids: form.product_ids, config: form.config as PackDiscountConfig },
            errors: { product_ids: errors.product_ids, bundle_price: errors.bundle_price },
            onChange: (partial: { product_ids?: number[]; config?: PackDiscountConfig }) => updateForm(partial as Partial<FormState>),
        },
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl p-6">
                <DialogHeader>
                    <DialogTitle>
                        {promotion ? t('promotions.edit_promotion') : t('promotions.add_promotion')}
                    </DialogTitle>
                    {!promotion && (
                        <p className="text-xs text-[var(--color-text-muted)] font-medium mt-1">
                            {t('promotions.form.type_help', 'Type cannot be changed after creation')}
                        </p>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <GeneralInfoSection
                                values={{ name: form.name, type: form.type, status: form.status, start_date: form.start_date, end_date: form.end_date }}
                                errors={{ name: errors.name, type: errors.type, start_date: errors.start_date, end_date: errors.end_date }}
                                onChange={(partial) => {
                                    if ('type' in partial && partial.type) {
                                        handleTypeChange(partial.type);
                                    } else {
                                        updateForm(partial as Partial<FormState>);
                                    }
                                }}
                                isEditMode={isEditMode}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {form.type === 'price_discount' && (
                                <PriceDiscountSection {...typeProps.price_discount} />
                            )}
                            {form.type === 'quantity_discount' && (
                                <QuantityDiscountSection {...typeProps.quantity_discount} />
                            )}
                            {form.type === 'pack_discount' && (
                                <PackDiscountSection {...typeProps.pack_discount} />
                            )}
                        </div>
                    )}

                    <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex justify-end gap-3">
                        {step === 1 ? (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleNext}
                                >
                                    {t('common.next', 'Next')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                >
                                    {t('common.back', 'Back')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    icon={<Save size={16} />}
                                    disabled={isSubmitting}
                                >
                                    {promotion ? t('promotions.form.save_changes') : t('promotions.form.create')}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
