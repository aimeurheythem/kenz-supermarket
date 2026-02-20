/**
 * Smoke test — verifies the test infrastructure is wired up correctly.
 *
 * Checks:
 *  1. Vitest globals work (describe/it/expect)
 *  2. @testing-library/jest-dom matchers work (.toBeInTheDocument)
 *  3. React Testing Library renders components
 *  4. sql.js mock is available
 *  5. window.electronAPI mock is available
 *  6. __APP_VERSION__ is defined
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Test Infrastructure', () => {
    it('basic assertions work', () => {
        expect(1 + 1).toBe(2);
        expect('hello').toContain('ell');
        expect([1, 2, 3]).toHaveLength(3);
    });

    it('jest-dom matchers work', () => {
        const div = document.createElement('div');
        div.textContent = 'Hello';
        document.body.appendChild(div);
        expect(div).toBeInTheDocument();
        expect(div).toHaveTextContent('Hello');
    });

    it('renders a React component', () => {
        function Greeting({ name }: { name: string }) {
            return <h1>Hello, {name}!</h1>;
        }
        render(<Greeting name="World" />);
        expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    });

    it('userEvent works', async () => {
        const handleClick = vi.fn();
        function ClickMe() {
            return <button onClick={handleClick}>Click</button>;
        }
        render(<ClickMe />);
        await userEvent.click(screen.getByRole('button', { name: 'Click' }));
        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('sql.js mock is available', async () => {
        const initSqlJs = (await import('sql.js')).default;
        const SQL = await initSqlJs();
        const db = new SQL.Database();
        expect(db.exec).toBeDefined();
        expect(db.run).toBeDefined();
        expect(db.prepare).toBeDefined();
        expect(db.export).toBeDefined();
        expect(db.close).toBeDefined();
    });

    it('window.electronAPI mock is available', () => {
        expect(window.electronAPI).toBeDefined();
        expect(window.electronAPI!.loadDatabase).toBeDefined();
        expect(window.electronAPI!.saveDatabase).toBeDefined();
        expect(window.electronAPI!.printReceipt).toBeDefined();
        expect(window.electronAPI!.minimizeWindow).toBeDefined();
    });

    it('__APP_VERSION__ is defined', () => {
        expect(__APP_VERSION__).toBe('1.0.0-test');
    });
});
