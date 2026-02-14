/**
 * Database barrel export — single import point for the entire database layer.
 */

export { initDatabase, getDatabase, saveDatabase, query, execute, transaction } from './db';
export { seedDatabase } from './seed';
export { CategoryRepo } from './repositories/category.repo';
export { ProductRepo } from './repositories/product.repo';
export { SaleRepo } from './repositories/sale.repo';
export { SupplierRepo } from './repositories/supplier.repo';
export { StockRepo } from './repositories/stock.repo';
export { UserRepo } from './repositories/user.repo';
export { CashierSessionRepo } from './repositories/cashier-session.repo';
