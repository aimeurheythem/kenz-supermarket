import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Barcode, Check } from 'lucide-react';
import { useProductStore } from '@/stores/useProductStore';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { Product } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

interface ProductSearchSelectProps {
    /** IDs of currently selected products */
    selectedIds: number[];
    /** Allow selecting more than one product */
    multiSelect?: boolean;
    /** Called when selection changes */
    onChange: (ids: number[]) => void;
    /** Validation error message */
    error?: string;
    /** Placeholder text for the search input */
    placeholder?: string;
    /** Label shown above the field */
    label?: string;
}

// ── Shared style tokens ────────────────────────────────────────────────────

const LABEL_CLASS = 'block text-sm font-medium text-[var(--color-text-muted)] mb-1';

// ── Component ──────────────────────────────────────────────────────────────

export default function ProductSearchSelect({
    selectedIds,
    multiSelect = false,
    onChange,
    error,
    placeholder = 'Search by name or barcode…',
    label,
}: ProductSearchSelectProps) {
    const { products, loadProducts } = useProductStore();
    const { formatCurrency: format } = useFormatCurrency();

    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load products once
    useEffect(() => {
        if (products.length === 0) loadProducts();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredProducts: Product[] = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products
            .filter((p) => p.is_active)
            .filter((p) => {
                if (multiSelect) return !selectedIds.includes(p.id);
                return true;
            })
            .filter((p) => {
                if (!q) return true;
                const matchesName = p.name.toLowerCase().includes(q);
                const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
                return matchesName || matchesBarcode;
            })
            .slice(0, 12);
    }, [products, query, selectedIds, multiSelect]);

    const selectedProducts = useMemo(
        () => products.filter((p) => selectedIds.includes(p.id)),
        [products, selectedIds]
    );

    // ── Handlers ─────────────────────────────────────────────────────────

    const selectProduct = (p: Product) => {
        if (multiSelect) {
            onChange([...selectedIds, p.id]);
            setQuery('');
            inputRef.current?.focus();
        } else {
            onChange([p.id]);
            setQuery('');
            setOpen(false);
        }
    };

    const removeProduct = (id: number) => {
        onChange(selectedIds.filter((sid) => sid !== id));
    };

    const clearAll = () => {
        onChange([]);
        setQuery('');
        inputRef.current?.focus();
    };

    // ── Render ────────────────────────────────────────────────────────────

    const showDropdown = open && (query.length > 0 || filteredProducts.length > 0);

    return (
        <div ref={wrapperRef} className="relative">
            {label && <label className={LABEL_CLASS}>{label}</label>}

            {/* Selected chips — multiSelect only */}
            {multiSelect && selectedProducts.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedProducts.map((p) => (
                        <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-bold"
                        >
                            {p.name}
                            <button
                                type="button"
                                onClick={() => removeProduct(p.id)}
                                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <X size={11} strokeWidth={3} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Input wrapper */}
            <div className="relative">
                {/* Search icon */}
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Search size={15} className="text-[var(--color-text-placeholder)]" strokeWidth={2.5} />
                </div>

                {/* Single-select: show selected product inside the input box */}
                {!multiSelect && selectedIds.length > 0 ? (
                    <div className="w-full pl-9 pr-10 py-2 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border-hover)] text-sm flex items-center gap-2">
                        <span className="flex-1 truncate text-zinc-800">
                            {selectedProducts[0]?.name ?? '—'}
                        </span>
                        {selectedProducts[0]?.barcode && (
                            <span className="flex items-center gap-1 shrink-0 text-[11px] text-zinc-400 font-mono">
                                <Barcode size={12} className="text-zinc-400" />
                                {selectedProducts[0].barcode}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={clearAll}
                            className="shrink-0 p-0.5 rounded-full bg-zinc-300 hover:bg-zinc-400 transition-colors"
                        >
                            <X size={10} strokeWidth={3} className="text-zinc-700" />
                        </button>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all"
                    />
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute left-0 right-0 mt-1 z-50 rounded-lg border border-[var(--color-border)] bg-white shadow-lg overflow-hidden">
                    {filteredProducts.length === 0 ? (
                        <div className="px-4 py-3 text-xs font-semibold text-zinc-400 text-center">
                            No products found
                        </div>
                    ) : (
                        <ul className="max-h-52 overflow-y-auto divide-y divide-zinc-100">
                            {filteredProducts.map((p) => {
                                const isSelected = selectedIds.includes(p.id);
                                return (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => selectProduct(p)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors group"
                                        >
                                            {/* Check indicator */}
                                            <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                                isSelected
                                                    ? 'bg-[var(--color-border-hover)] border-[var(--color-border-hover)]'
                                                    : 'border-[var(--color-border)] group-hover:border-[var(--color-border-hover)]'
                                            }`}>
                                                {isSelected && <Check size={9} strokeWidth={3} className="text-white" />}
                                            </span>

                                            {/* Name */}
                                            <span className="flex-1 text-sm font-bold text-zinc-800 truncate">
                                                {highlightMatch(p.name, query)}
                                            </span>

                                            {/* Barcode badge */}
                                            {p.barcode && (
                                                <span className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                                                    <Barcode size={10} />
                                                    {p.barcode}
                                                </span>
                                            )}

                                            {/* Price */}
                                            <span className="shrink-0 text-xs font-black text-zinc-600">
                                                {format(p.selling_price)}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {error && <p className="mt-1 text-xs text-rose-500 font-semibold">{error}</p>}
        </div>
    );
}

// ── Highlight matching query text ─────────────────────────────────────────

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <span className="text-yellow-500">{text.slice(idx, idx + query.length)}</span>
            {text.slice(idx + query.length)}
        </>
    );
}
