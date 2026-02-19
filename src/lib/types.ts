/**
 * Shared TypeScript types for the entire application.
 * These mirror the database schema and are used across UI, stores, and repositories.
 */

// =============================================
// CATEGORIES
// =============================================
export interface Category {
    id: number;
    name: string;
    description: string;
    color: string;
    created_at: string;
    updated_at: string;
}

export type CategoryInput = Pick<Category, 'name'> & Partial<Pick<Category, 'description' | 'color'>>;

// =============================================
// PRODUCTS
// =============================================
export interface Product {
    id: number;
    barcode: string | null;
    name: string;
    description: string;
    category_id: number | null;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    reorder_level: number;
    unit: string;
    image_url: string;
    is_active: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    category_name?: string;
}

export type ProductInput = Pick<Product, 'name' | 'cost_price' | 'selling_price'> &
    Partial<
        Pick<
            Product,
            'barcode' | 'description' | 'category_id' | 'stock_quantity' | 'reorder_level' | 'unit' | 'image_url'
        >
    >;

// =============================================
// PRODUCT BATCHES
// =============================================
export interface ProductBatch {
    id: number;
    product_id: number;
    batch_number: string;
    manufacture_date: string | null;
    expiration_date: string | null;
    quantity: number;
    cost_price: number | null;
    created_at: string;
}

export type ProductBatchInput = Pick<ProductBatch, 'product_id' | 'batch_number' | 'quantity'> &
    Partial<Pick<ProductBatch, 'manufacture_date' | 'expiration_date' | 'cost_price'>>;

// =============================================
// SUPPLIERS
// =============================================
export interface Supplier {
    id: number;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    balance: number;
    is_active: number;
    created_at: string;
    updated_at: string;
}

export type SupplierInput = Pick<Supplier, 'name'> &
    Partial<Pick<Supplier, 'contact_person' | 'phone' | 'email' | 'address'>>;

// =============================================
// PURCHASE ORDERS
// =============================================
export interface PurchaseOrder {
    id: number;
    supplier_id: number;
    order_date: string;
    expected_date: string | null;
    status: 'pending' | 'ordered' | 'received' | 'cancelled';
    total_amount: number;
    paid_amount: number;
    notes: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    supplier_name?: string;
}

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    received_quantity: number;
    // Joined
    product_name?: string;
}

// =============================================
// CUSTOMERS
// =============================================
export interface Customer {
    id: number;
    full_name: string;
    phone?: string;
    email?: string;
    address?: string;
    loyalty_points: number;
    total_debt: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CustomerTransaction {
    id: number;
    customer_id: number;
    type: 'debt' | 'payment';
    amount: number;
    balance_after: number;
    reference_type?: 'sale' | 'payment';
    reference_id?: number;
    description?: string;
    created_at: string;
}

export type CustomerInput = Pick<Customer, 'full_name'> &
    Partial<Pick<Customer, 'phone' | 'email' | 'address' | 'notes' | 'loyalty_points'>>;

// =============================================
// SALES
// =============================================
export interface Sale {
    id: number;
    user_id: number | null;
    session_id: number | null;
    customer_id: number | null; // Linked customer
    sale_date: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    payment_method: 'cash' | 'card' | 'mobile' | 'credit';
    customer_name: string;
    status: 'completed' | 'refunded' | 'voided';
    created_at: string;
    // Joined
    user_name?: string;
    session_status?: string;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
}

export type CartItem = {
    product: Product;
    quantity: number;
    discount: number;
};

// =============================================
// STOCK MOVEMENTS
// =============================================
export interface StockMovement {
    id: number;
    product_id: number;
    type: 'in' | 'out' | 'adjustment' | 'return';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reason: string;
    reference_id: number | null;
    reference_type: string | null;
    created_at: string;
    // Joined
    product_name?: string;
}

// =============================================
// USERS
// =============================================
export interface User {
    id: number;
    username: string;
    full_name: string;
    role: 'admin' | 'manager' | 'cashier';
    is_active: number;
    has_pin?: number; // 1 if a PIN is set, 0 otherwise (safe computed field)
    pin_length?: number; // Original PIN digit count (4–8)
    last_login: string | null;
    created_at: string;
    updated_at: string;
    // Sensitive fields — only present in internal/full queries, never sent to UI
    password_hash?: string;
    pin_code?: string | null;
}

export type UserInput = Pick<User, 'username' | 'full_name' | 'role'> & { password: string; pin_code?: string };

// =============================================
// CASHIER SESSIONS
// =============================================
export interface CashierSession {
    id: number;
    cashier_id: number;
    login_time: string;
    logout_time: string | null;
    opening_cash: number;
    closing_cash: number | null;
    expected_cash: number | null;
    cash_difference: number | null;
    status: 'active' | 'closed' | 'force_closed';
    notes: string;
    created_at: string;
    // Joined fields
    cashier_name?: string;
}

export interface CashierSessionInput {
    cashier_id: number;
    opening_cash: number;
}

export interface SessionCloseInput {
    session_id: number;
    closing_cash: number;
    notes?: string;
}

// =============================================
// DASHBOARD / REPORTS
// =============================================
export interface DashboardStats {
    todayRevenue: number;
    todayOrders: number;
    totalProducts: number;
    lowStockCount: number;
    revenueChange: number;
    ordersChange: number;
}

export interface SalesReport {
    date: string;
    total_sales: number;
    total_orders: number;
    avg_order_value: number;
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
}

// =============================================
// QUICK ACCESS (POS Customization)
// =============================================
export interface QuickAccessOption {
    label: string;
    qty: number;
    price: number;
}

export interface QuickAccessItem {
    id: number;
    product_id: number;
    display_name: string;
    icon: string;
    color: string;
    bg_color: string;
    options: QuickAccessOption[];
    created_at: string;
    updated_at: string;
    // Joined fields
    product_name?: string;
}

export type QuickAccessItemInput = Pick<QuickAccessItem, 'product_id' | 'display_name'> &
    Partial<Pick<QuickAccessItem, 'icon' | 'color' | 'bg_color' | 'options'>>;

// =============================================
// EXPENSES
// =============================================
export interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
    payment_method: string;
    user_id: number | null;
    created_at: string;
}

export type ExpenseInput = Pick<Expense, 'description' | 'amount' | 'category'> &
    Partial<Pick<Expense, 'date' | 'payment_method' | 'user_id'>>;
