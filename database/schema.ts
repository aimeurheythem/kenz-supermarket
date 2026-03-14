/**
 * Database Schema — SQL Migrations
 * Applied automatically on first launch
 *
 * As of 006-cloud-saas-platform, new installations use UUID v4 TEXT
 * primary keys for cloud sync compatibility.  Existing databases keep
 * their INTEGER PKs — the repos accept both.
 */

export const SCHEMA_SQL = `
-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  cost_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit TEXT DEFAULT 'piece',
  image_url TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- PRODUCT BATCHES (for expiration/batch tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS product_batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  manufacture_date TEXT,
  expiration_date TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- SUPPLIERS
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- PURCHASE ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  order_date TEXT DEFAULT (datetime('now')),
  expected_date TEXT,
  status TEXT DEFAULT 'pending',
  total_amount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- PURCHASE ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  received_quantity INTEGER DEFAULT 0
);

-- =============================================
-- CUSTOMERS
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_debt REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- CUSTOMER TRANSACTIONS (Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS customer_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- SALES
-- =============================================
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  session_id TEXT REFERENCES cashier_sessions(id),
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  sale_date TEXT DEFAULT (datetime('now')),
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  customer_name TEXT DEFAULT 'Walk-in Customer',
  status TEXT DEFAULT 'completed',
  ticket_number INTEGER DEFAULT NULL,
  original_sale_id TEXT DEFAULT NULL REFERENCES sales(id),
  return_type TEXT DEFAULT NULL,
  cart_discount_type TEXT DEFAULT NULL,
  cart_discount_value REAL DEFAULT 0,
  cart_discount_amount REAL DEFAULT 0,
  synced_at TEXT DEFAULT NULL,
  client_id TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- SALE ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  manual_discount_type TEXT DEFAULT NULL,
  manual_discount_value REAL DEFAULT 0,
  manual_discount_amount REAL DEFAULT 0,
  promotion_id TEXT DEFAULT NULL REFERENCES promotions(id) ON DELETE SET NULL,
  promotion_name TEXT DEFAULT NULL,
  synced_at TEXT DEFAULT NULL,
  client_id TEXT DEFAULT NULL
);

-- =============================================
-- STOCK MOVEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  reference_id TEXT,
  reference_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- USERS (Owner & Cashiers)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  pin_code TEXT,
  pin_length INTEGER DEFAULT 4,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- CASHIER SESSIONS (Shift tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS cashier_sessions (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_time TEXT DEFAULT (datetime('now')),
  logout_time TEXT,
  opening_cash REAL DEFAULT 0,
  closing_cash REAL,
  expected_cash REAL,
  cash_difference REAL,
  status TEXT DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- POS QUICK ACCESS (Customizable product shortcuts)
-- =============================================
CREATE TABLE IF NOT EXISTS pos_quick_access (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  icon TEXT DEFAULT 'shopping-bag',
  color TEXT DEFAULT 'text-zinc-500',
  bg_color TEXT DEFAULT 'bg-zinc-50',
  options TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- APP SETTINGS (Key-Value Store)
-- =============================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- EXPENSES
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT DEFAULT (datetime('now')),
  payment_method TEXT DEFAULT 'cash',
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- AUDIT LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- PROMOTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('price_discount', 'quantity_discount', 'pack_discount')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  deleted_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- PROMOTION PRODUCTS (junction table)
-- =============================================
CREATE TABLE IF NOT EXISTS promotion_products (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(promotion_id, product_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_deleted ON promotions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_promo_products_promotion ON promotion_products(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promo_products_product ON promotion_products(product_id);

-- =============================================
-- PAYMENT ENTRIES (Split payment support)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_entries (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK(method IN ('cash','card','mobile','credit')),
  amount REAL NOT NULL CHECK(amount > 0),
  change_amount REAL DEFAULT 0,
  synced_at TEXT DEFAULT NULL,
  client_id TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_entries_sale_id ON payment_entries(sale_id);

-- =============================================
-- TICKET COUNTER (Daily-reset sequential numbers)
-- =============================================
CREATE TABLE IF NOT EXISTS ticket_counter (
  date TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiration ON product_batches(expiration_date);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_cashier ON cashier_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_status ON cashier_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_login ON cashier_sessions(login_time);
`;
