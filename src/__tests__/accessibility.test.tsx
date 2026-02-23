/**
 * Phase 8.5 — Accessibility Tests
 *
 * Uses vitest-axe (axe-core) for automated a11y violation checks
 * and @testing-library queries for ARIA / keyboard semantics.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import type { AxeMatchers } from 'vitest-axe/matchers';
import * as matchers from 'vitest-axe/matchers';
import React from 'react';

declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Assertion extends AxeMatchers {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend(matchers);

// ── Mocks ──────────────────────────────────────────

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback ?? key,
        i18n: { language: 'en', dir: () => 'ltr', changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
    I18nextProvider: ({ children }: any) => children,
}));

vi.mock('framer-motion', () => {
    const actual = React;
    return {
        motion: new Proxy(
            {},
            {
                get: (_target, prop: string) =>
                    actual.forwardRef((props: any, ref: any) => {
                        const { initial, animate, exit, whileHover, whileTap, transition, variants, layout, ...rest } =
                            props;
                        return actual.createElement(prop, { ...rest, ref });
                    }),
            },
        ),
        AnimatePresence: ({ children }: any) => children,
    };
});

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', state: null }),
    NavLink: (props: any) => React.createElement('a', { href: props.to, className: props.className }, props.children),
    Link: (props: any) => React.createElement('a', { href: props.to }, props.children),
}));

// Mock stores used by Sidebar
vi.mock('@/stores/useAuthStore', () => ({
    useAuthStore: () => ({
        user: { id: 1, username: 'admin', role: 'admin', full_name: 'Admin' },
        logout: vi.fn(),
    }),
}));

vi.mock('@/stores/useLayoutStore', () => ({
    useLayoutStore: () => ({
        collapsed: false,
        setCollapsed: vi.fn(),
    }),
}));

// ── Imports ────────────────────────────────────────

import { FormModal } from '@/components/common/FormModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import SearchInput from '@/components/common/SearchInput';
import Button from '@/components/common/Button';
import Sidebar from '@/components/layout/Sidebar';

// ════════════════════════════════════════════════════
// 1. FormModal — axe + ARIA attributes
// ════════════════════════════════════════════════════

describe('FormModal accessibility', () => {
    const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Add Product',
        description: 'Fill in the product details',
    };

    beforeEach(() => vi.clearAllMocks());

    it('has no axe violations when open', async () => {
        const { container } = render(
            <FormModal {...baseProps}>
                <input aria-label="Product name" />
            </FormModal>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('renders dialog role', () => {
        render(
            <FormModal {...baseProps}>
                <p>body</p>
            </FormModal>,
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('dialog has accessible title', () => {
        render(
            <FormModal {...baseProps}>
                <p>body</p>
            </FormModal>,
        );
        const dialog = screen.getByRole('dialog');
        // Radix sets aria-labelledby pointing to DialogTitle
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(screen.getByText('Add Product')).toBeInTheDocument();
    });

    it('dialog has accessible description', () => {
        render(
            <FormModal {...baseProps}>
                <p>body</p>
            </FormModal>,
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-describedby');
        expect(screen.getByText('Fill in the product details')).toBeInTheDocument();
    });

    it('close button has accessible label', () => {
        render(
            <FormModal {...baseProps}>
                <p>body</p>
            </FormModal>,
        );
        // The shadcn Dialog's close button has <span className="sr-only">Close</span>
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
        render(
            <FormModal {...baseProps} isOpen={false}>
                <p>hidden content</p>
            </FormModal>,
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

// ════════════════════════════════════════════════════
// 2. DeleteConfirmModal — axe + buttons + ARIA
// ════════════════════════════════════════════════════

describe('DeleteConfirmModal accessibility', () => {
    const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        title: 'Delete Item',
        description: 'This cannot be undone.',
        itemName: 'Milk 1L',
    };

    beforeEach(() => vi.clearAllMocks());

    it('has no axe violations when open', async () => {
        const { container } = render(<DeleteConfirmModal {...baseProps} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('renders dialog role with title', () => {
        render(<DeleteConfirmModal {...baseProps} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('cancel and confirm buttons are visible and labelled', () => {
        render(<DeleteConfirmModal {...baseProps} />);
        // i18n mock returns the key as text
        expect(screen.getByText('inventory.delete_modal.cancel')).toBeInTheDocument();
        expect(screen.getByText('inventory.delete_modal.confirm')).toBeInTheDocument();
    });

    it('cancel button is focusable', () => {
        render(<DeleteConfirmModal {...baseProps} />);
        const cancel = screen.getByText('inventory.delete_modal.cancel');
        expect(cancel.closest('button')).not.toBeDisabled();
    });

    it('confirm button triggers callbacks', async () => {
        const user = userEvent.setup();
        render(<DeleteConfirmModal {...baseProps} />);
        const btn = screen.getByText('inventory.delete_modal.confirm');
        await user.click(btn);
        expect(baseProps.onConfirm).toHaveBeenCalledOnce();
        expect(baseProps.onClose).toHaveBeenCalledOnce();
    });

    it('displays item name for context', () => {
        render(<DeleteConfirmModal {...baseProps} />);
        expect(screen.getByText('Milk 1L')).toBeInTheDocument();
    });
});

// ════════════════════════════════════════════════════
// 3. SearchInput — axe + input semantics
// ════════════════════════════════════════════════════

describe('SearchInput accessibility', () => {
    it('has no axe violations', async () => {
        const { container } = render(<SearchInput value="" onChange={vi.fn()} placeholder="Search products…" />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('renders an input with the provided placeholder', () => {
        render(<SearchInput value="" onChange={vi.fn()} placeholder="Search products…" />);
        expect(screen.getByPlaceholderText('Search products…')).toBeInTheDocument();
    });

    it('input is focusable', () => {
        render(<SearchInput value="" onChange={vi.fn()} placeholder="Search…" />);
        const input = screen.getByPlaceholderText('Search…');
        input.focus();
        expect(document.activeElement).toBe(input);
    });

    it('input has text type for screen readers', () => {
        render(<SearchInput value="" onChange={vi.fn()} placeholder="Search…" />);
        const input = screen.getByPlaceholderText('Search…');
        expect(input).toHaveAttribute('type', 'text');
    });
});

// ════════════════════════════════════════════════════
// 4. Button — axe + disabled state + icon accessibility
// ════════════════════════════════════════════════════

describe('Button accessibility', () => {
    it('has no axe violations (primary)', async () => {
        const { container } = render(<Button>Save</Button>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no axe violations (with icon)', async () => {
        const { container } = render(<Button icon={<span aria-hidden="true">🛒</span>}>Add to Cart</Button>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('disabled state sets aria-disabled semantics', () => {
        render(<Button disabled>Submit</Button>);
        const btn = screen.getByRole('button', { name: 'Submit' });
        expect(btn).toBeDisabled();
    });

    it('renders correct button type', () => {
        render(<Button type="submit">Go</Button>);
        expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'submit');
    });

    it('default type is button (not submit)', () => {
        render(<Button>Click</Button>);
        expect(screen.getByRole('button', { name: 'Click' })).toHaveAttribute('type', 'button');
    });

    it('all variants render accessible buttons', () => {
        const variants = ['primary', 'secondary', 'danger', 'ghost'] as const;
        variants.forEach((v) => {
            const { unmount } = render(<Button variant={v}>{v}</Button>);
            expect(screen.getByRole('button', { name: v })).toBeInTheDocument();
            unmount();
        });
    });
});

// ════════════════════════════════════════════════════
// 5. Sidebar — navigation landmark + structure
// ════════════════════════════════════════════════════

describe('Sidebar accessibility', () => {
    it('has no axe violations', async () => {
        const { container } = render(<Sidebar />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('contains a nav landmark', () => {
        render(<Sidebar />);
        expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('sidebar renders as complementary landmark (aside)', () => {
        render(<Sidebar />);
        // <aside> maps to complementary role
        expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('logo image has alt text', () => {
        render(<Sidebar />);
        expect(screen.getByAltText('Kenzy Pro')).toBeInTheDocument();
    });
});

// ════════════════════════════════════════════════════
// 6. Keyboard interaction tests
// ════════════════════════════════════════════════════

describe('Keyboard interactions', () => {
    it('Escape closes FormModal', async () => {
        const onClose = vi.fn();
        render(
            <FormModal isOpen={true} onClose={onClose} title="Test">
                <button>Inner</button>
            </FormModal>,
        );
        const user = userEvent.setup();
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });

    it('Escape closes DeleteConfirmModal', async () => {
        const onClose = vi.fn();
        render(<DeleteConfirmModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />);
        const user = userEvent.setup();
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });

    it('Tab is trapped inside open FormModal', async () => {
        render(
            <FormModal isOpen={true} onClose={vi.fn()} title="Focus Trap">
                <input aria-label="Field A" />
                <input aria-label="Field B" />
            </FormModal>,
        );
        const user = userEvent.setup();
        const dialog = screen.getByRole('dialog');

        // Press Tab multiple times — focus should always stay inside the dialog
        for (let i = 0; i < 10; i++) {
            await user.tab();
            expect(dialog.contains(document.activeElement)).toBe(true);
        }
    });

    it('Tab is trapped inside open DeleteConfirmModal', async () => {
        render(<DeleteConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />);
        const user = userEvent.setup();
        const dialog = screen.getByRole('dialog');

        for (let i = 0; i < 10; i++) {
            await user.tab();
            expect(dialog.contains(document.activeElement)).toBe(true);
        }
    });

    it('SearchInput receives typed value', async () => {
        const onChange = vi.fn();
        render(<SearchInput value="" onChange={onChange} placeholder="Type here…" />);
        const user = userEvent.setup();
        const input = screen.getByPlaceholderText('Type here…');
        await user.click(input);
        await user.keyboard('milk');
        // onChange fires for each character
        expect(onChange).toHaveBeenCalledTimes(4);
    });

    it('Button onClick fires on Enter key', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Press Me</Button>);
        const user = userEvent.setup();
        const btn = screen.getByRole('button', { name: 'Press Me' });
        btn.focus();
        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('Button onClick fires on Space key', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Press Me</Button>);
        const user = userEvent.setup();
        const btn = screen.getByRole('button', { name: 'Press Me' });
        btn.focus();
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('disabled Button does not fire on Enter', async () => {
        const onClick = vi.fn();
        render(
            <Button onClick={onClick} disabled>
                No Click
            </Button>,
        );
        const user = userEvent.setup();
        const btn = screen.getByRole('button', { name: 'No Click' });
        btn.focus();
        await user.keyboard('{Enter}');
        expect(onClick).not.toHaveBeenCalled();
    });
});
