/**
 * Shared entity type definitions for the Kenz SaaS platform.
 * Generated from data-model.md — 23 entities with UUID v4 primary keys.
 */

// ── Store (tenant root) ──────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  currency: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ── User ─────────────────────────────────────────────────────────

export type UserRole = "owner" | "manager" | "cashier";

export interface User {
  id: string;
  store_id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  pin_length: number;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// ── Category ─────────────────────────────────────────────────────

export interface Category {
  id: string;
  store_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// ── Product ──────────────────────────────────────────────────────

export interface Product {
  id: string;
  store_id: string;
  barcode: string | null;
  name: string;
  description: string;
  category_id: string | null;
  cost_price: string;
  selling_price: string;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── ProductBatch ─────────────────────────────────────────────────

export interface ProductBatch {
  id: string;
  store_id: string;
  product_id: string;
  batch_number: string;
  manufacture_date: string | null;
  expiration_date: string | null;
  quantity: number;
  cost_price: string | null;
  created_at: string;
}

// ── Supplier ─────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  store_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── PurchaseOrder ────────────────────────────────────────────────

export type PurchaseOrderStatus = "pending" | "received" | "cancelled";

export interface PurchaseOrder {
  id: string;
  store_id: string;
  supplier_id: string;
  order_date: string;
  expected_date: string | null;
  status: PurchaseOrderStatus;
  total_amount: string;
  paid_amount: string;
  notes: string;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

// ── PurchaseOrderItem ────────────────────────────────────────────

export interface PurchaseOrderItem {
  id: string;
  store_id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: string;
  total_cost: string;
  received_quantity: number;
}

// ── Customer ─────────────────────────────────────────────────────

export interface Customer {
  id: string;
  store_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  loyalty_points: number;
  total_debt: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CustomerTransaction ──────────────────────────────────────────

export type CustomerTransactionType = "debt" | "payment";

export interface CustomerTransaction {
  id: string;
  store_id: string;
  customer_id: string;
  type: CustomerTransactionType;
  amount: string;
  balance_after: string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

// ── Sale ─────────────────────────────────────────────────────────

export type SaleStatus = "completed" | "returned" | "voided";

export interface Sale {
  id: string;
  store_id: string;
  user_id: string | null;
  session_id: string | null;
  customer_id: string | null;
  sale_date: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total: string;
  payment_method: string;
  customer_name: string;
  status: SaleStatus;
  ticket_number: number | null;
  original_sale_id: string | null;
  return_type: string | null;
  cart_discount_type: string | null;
  cart_discount_value: string;
  cart_discount_amount: string;
  synced_at: string | null;
  client_id: string | null;
  items?: SaleItem[];
  payments?: PaymentEntry[];
  created_at: string;
}

// ── SaleItem ─────────────────────────────────────────────────────

export interface SaleItem {
  id: string;
  store_id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  discount: string;
  total: string;
  manual_discount_type: string | null;
  manual_discount_value: string;
  manual_discount_amount: string;
  promotion_id: string | null;
  promotion_name: string | null;
}

// ── PaymentEntry ─────────────────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "mobile" | "credit";

export interface PaymentEntry {
  id: string;
  store_id: string;
  sale_id: string;
  method: PaymentMethod;
  amount: string;
  change_amount: string;
  created_at: string;
}

// ── StockMovement ────────────────────────────────────────────────

export interface StockMovement {
  id: string;
  store_id: string;
  product_id: string;
  type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

// ── CashierSession ───────────────────────────────────────────────

export type CashierSessionStatus = "active" | "closed" | "force_closed";

export interface CashierSession {
  id: string;
  store_id: string;
  cashier_id: string;
  login_time: string;
  logout_time: string | null;
  opening_cash: string;
  closing_cash: string | null;
  expected_cash: string | null;
  cash_difference: string | null;
  status: CashierSessionStatus;
  notes: string;
  created_at: string;
}

// ── POSQuickAccess ───────────────────────────────────────────────

export interface POSQuickAccess {
  id: string;
  store_id: string;
  product_id: string;
  display_name: string;
  icon: string;
  color: string;
  bg_color: string;
  options: unknown[];
  created_at: string;
  updated_at: string;
}

// ── Expense ──────────────────────────────────────────────────────

export interface Expense {
  id: string;
  store_id: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  payment_method: string;
  user_id: string | null;
  created_at: string;
}

// ── AuditLog ─────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  store_id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ── Promotion ────────────────────────────────────────────────────

export type PromotionType =
  | "price_discount"
  | "quantity_discount"
  | "pack_discount";
export type PromotionStatus = "active" | "inactive";

export interface Promotion {
  id: string;
  store_id: string;
  name: string;
  type: PromotionType;
  status: PromotionStatus;
  start_date: string;
  end_date: string;
  config: Record<string, unknown>;
  deleted_at: string | null;
  product_ids?: string[];
  created_at: string;
  updated_at: string;
}

// ── PromotionProduct ─────────────────────────────────────────────

export interface PromotionProduct {
  id: string;
  store_id: string;
  promotion_id: string;
  product_id: string;
  created_at: string;
}

// ── AppSetting ───────────────────────────────────────────────────

export interface AppSetting {
  id: string;
  store_id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

// ── TicketCounter ────────────────────────────────────────────────

export interface TicketCounter {
  id: string;
  store_id: string;
  date: string;
  last_number: number;
}

// ── StoreSubscription ────────────────────────────────────────────

export type PlanName = "free" | "basic" | "pro";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export interface StoreSubscription {
  id: string;
  store_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: PlanName;
  status: SubscriptionStatus;
  trial_end_date: string | null;
  next_billing_date: string | null;
  cancel_at_period_end: boolean;
  grace_period_end: string | null;
  max_products: number;
  max_cashiers: number;
  created_at: string;
  updated_at: string;
}

// ── SyncLog ──────────────────────────────────────────────────────

export interface SyncLog {
  id: string;
  store_id: string;
  operation_id: string;
  entity: string;
  action: string;
  client_id: string;
  local_timestamp: number;
  sync_order: number;
  conflict_detected: boolean;
  conflict_resolution: Record<string, unknown> | null;
  created_at: string;
}

// ── Paginated Response ───────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── API Error ────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
  code: string;
  errors?: Record<string, string[]>;
}
