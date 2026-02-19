import React from 'react';
import { HelpCircle, Mail, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Help() {
    const { t } = useTranslation();

    const contactMethods = [
        { icon: Mail, label: 'Email Support', value: 'support@supermarket.dz', color: 'text-blue-500' },
        { icon: Phone, label: 'Phone Support', value: '+213 123 456 789', color: 'text-emerald-500' },
        { icon: MessageSquare, label: 'Live Chat', value: t('help.contact.available_hours', 'Available 9AM - 6PM'), color: 'text-purple-500' },
    ];

    return (
        <div className="h-full flex flex-col p-8 animate-fadeIn max-w-5xl mx-auto w-full space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-[var(--color-text-primary)] tracking-tighter uppercase">
                    {t('help.title', 'Help & Contact')}
                </h1>
                <p className="text-[var(--color-text-muted)] text-lg font-medium max-w-2xl">
                    {t('help.subtitle', 'Need assistance with your workstation? We are here to help you get the most out of your management system.')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contactMethods.map((method) => (
                    <div key={method.label} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[32px] group hover:bg-[var(--color-bg-secondary)] transition-all duration-300">
                        <div className={`w-12 h-12 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center mb-6 ${method.color}`}>
                            <method.icon size={24} />
                        </div>
                        <h3 className="text-[var(--color-text-muted)] text-sm font-bold uppercase tracking-widest mb-2">{t(`help.contact.${method.label.toLowerCase().replace(' ', '_')}`, method.label)}</h3>
                        <p className="text-[var(--color-text-primary)] font-bold text-lg">{method.value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-[var(--color-text-primary)] uppercase tracking-tight">
                    {t('help.faq.title', 'Common Questions')}
                </h2>
                <div className="grid gap-4">
                    {[
                        {
                            q: t('help.faq.q1', 'How do I add a new product to the inventory?'),
                            a: t('help.faq.a1', 'Go to the Inventory page, click the "Add Product" button, and fill in the product details including name, barcode, price, and stock quantity. You can also import products in bulk using a CSV file via the Import button.'),
                        },
                        {
                            q: t('help.faq.q2', 'How do I process a refund or return?'),
                            a: t('help.faq.a2', 'Navigate to Reports → Sales, find the transaction you want to refund, and click on it to view details. Use the refund option to process a partial or full return. The stock will be automatically updated.'),
                        },
                        {
                            q: t('help.faq.q3', 'How do I set up a new cashier account?'),
                            a: t('help.faq.a3', 'Go to Users page from the sidebar, click "Add User", enter the cashier\'s name and create a PIN code. The cashier can then log in using the Cashier Login option on the login screen.'),
                        },
                        {
                            q: t('help.faq.q4', 'How do I view daily sales reports?'),
                            a: t('help.faq.a4', 'Go to the Reports page to see detailed sales data. You can filter by date range, payment method, and cashier. The Dashboard also shows today\'s revenue, profit, and sales analytics at a glance.'),
                        },
                        {
                            q: t('help.faq.q5', 'How do I manage low stock alerts?'),
                            a: t('help.faq.a5', 'Each product has a "Reorder Level" field. When stock falls below this threshold, the product appears in the Low Stock section on the Inventory page. You can also export a low stock report as CSV.'),
                        },
                        {
                            q: t('help.faq.q6', 'How do I use the barcode scanner?'),
                            a: t('help.faq.a6', 'On the POS page, click the barcode icon or press the scan shortcut. Point your scanner at the product barcode — it will automatically add the item to the cart. You can also generate and print barcode labels from the Barcode Labels page.'),
                        },
                    ].map((faq, i) => (
                        <div key={i} className="flex items-start justify-between p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[24px] group cursor-pointer hover:border-[var(--color-border-hover)] transition-all">
                            <div className="space-y-2">
                                <h4 className="text-[var(--color-text-primary)] font-bold">{faq.q}</h4>
                                <p className="text-[var(--color-text-muted)] text-sm">{faq.a}</p>
                            </div>
                            <ExternalLink size={16} className="text-[var(--color-text-placeholder)] group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-1" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
