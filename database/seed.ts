/**
 * Seed initial data for development and first-time setup.
 */

import { execute, query, get } from './db';
import { CategoryRepo } from './repositories/category.repo';
import { ProductRepo } from './repositories/product.repo';
import { SupplierRepo } from './repositories/supplier.repo';
import { UserRepo } from './repositories/user.repo';

export async function seedDatabase(): Promise<void> {
    // Only seed if we have no data
    const productCount = await get<{ count: number }>('SELECT COUNT(*) as count FROM products');
    if ((productCount?.count ?? 0) > 0) return;

    console.log('🌱 Seeding database with initial data...');

    // Seed default admin user
    await UserRepo.seedDefault();

    // Seed sample cashiers
    const cashiers = [
        { username: 'cashier1', password: '1234', full_name: 'Ahmed Ben', role: 'cashier' as const, pin_code: '1111' },
        { username: 'cashier2', password: '1234', full_name: 'Sara Alami', role: 'cashier' as const, pin_code: '2222' },
        { username: 'cashier3', password: '1234', full_name: 'Karim Fassi', role: 'cashier' as const, pin_code: '3333' },
        { username: 'cashier4', password: '1234', full_name: 'Laila Moussaoui', role: 'cashier' as const, pin_code: '4444' },
    ];

    for (const cashier of cashiers) {
        const existing = await get<{ id: number }>('SELECT id FROM users WHERE username = ?', [cashier.username]);
        if (!existing) {
            try {
                await UserRepo.create(cashier);
                console.log(`✅ Created cashier: ${cashier.full_name}`);
            } catch (e) {
                console.error('Error creating cashier:', cashier.full_name, e);
            }
        }
    }

    // Categories
    const categories = [
        { name: 'Dairy', description: 'Milk, cheese, yogurt, butter', color: '#3b82f6' },
        { name: 'Bakery', description: 'Bread, pastries, cakes', color: '#f59e0b' },
        { name: 'Produce', description: 'Fresh fruits and vegetables', color: '#22c55e' },
        { name: 'Meat & Poultry', description: 'Fresh and frozen meats', color: '#ef4444' },
        { name: 'Beverages', description: 'Drinks, juices, water', color: '#6366f1' },
        { name: 'Canned Goods', description: 'Canned and jarred items', color: '#8b5cf6' },
        { name: 'Snacks', description: 'Chips, crackers, candy', color: '#ec4899' },
        { name: 'Frozen Foods', description: 'Frozen meals and ingredients', color: '#06b6d4' },
        { name: 'Cleaning', description: 'Household cleaning supplies', color: '#14b8a6' },
        { name: 'Personal Care', description: 'Hygiene and beauty products', color: '#f97316' },
    ];

    const categoryIds: Record<string, number> = {};
    for (const cat of categories) {
        try {
            const existing = await get<{ id: number }>('SELECT id FROM categories WHERE name = ?', [cat.name]);
            if (existing) {
                categoryIds[cat.name] = existing.id;
            } else {
                const created = await CategoryRepo.create(cat);
                if (created) {
                    categoryIds[cat.name] = created.id;
                } else {
                    console.error('Failed to create category:', cat.name);
                }
            }
        } catch (e) {
            console.error('Error seeding category:', cat.name, e);
        }
    }

    // Products
    const products = [
        { name: 'Whole Milk 1L', barcode: '5901234123457', category: 'Dairy', cost: 1.20, price: 2.49, stock: 45, reorder: 20 },
        { name: 'Cheddar Cheese 200g', barcode: '5901234123458', category: 'Dairy', cost: 2.50, price: 4.99, stock: 30, reorder: 15 },
        { name: 'Greek Yogurt 500g', barcode: '5901234123459', category: 'Dairy', cost: 1.80, price: 3.49, stock: 25, reorder: 12 },
        { name: 'Butter 250g', barcode: '5901234123460', category: 'Dairy', cost: 1.50, price: 2.99, stock: 5, reorder: 20 },
        { name: 'White Bread', barcode: '5901234123461', category: 'Bakery', cost: 0.80, price: 1.99, stock: 3, reorder: 15 },
        { name: 'Whole Wheat Bread', barcode: '5901234123462', category: 'Bakery', cost: 1.00, price: 2.49, stock: 20, reorder: 15 },
        { name: 'Croissants (pack of 4)', barcode: '5901234123463', category: 'Bakery', cost: 1.50, price: 3.99, stock: 15, reorder: 10 },
        { name: 'Bananas (bunch)', barcode: '5901234123464', category: 'Produce', cost: 0.60, price: 1.29, stock: 8, reorder: 25 },
        { name: 'Red Apples 1kg', barcode: '5901234123465', category: 'Produce', cost: 1.20, price: 2.99, stock: 35, reorder: 20 },
        { name: 'Tomatoes 500g', barcode: '5901234123466', category: 'Produce', cost: 0.80, price: 1.99, stock: 40, reorder: 20 },
        { name: 'Carrots 1kg', barcode: '5901234123467', category: 'Produce', cost: 0.50, price: 1.49, stock: 30, reorder: 15 },
        { name: 'Chicken Breast 500g', barcode: '5901234123468', category: 'Meat & Poultry', cost: 3.50, price: 6.99, stock: 20, reorder: 10 },
        { name: 'Ground Beef 500g', barcode: '5901234123469', category: 'Meat & Poultry', cost: 4.00, price: 7.99, stock: 15, reorder: 10 },
        { name: 'Orange Juice 1L', barcode: '5901234123470', category: 'Beverages', cost: 1.50, price: 3.49, stock: 50, reorder: 20 },
        { name: 'Sparkling Water 1.5L', barcode: '5901234123471', category: 'Beverages', cost: 0.40, price: 0.99, stock: 80, reorder: 30 },
        { name: 'Cola 2L', barcode: '5901234123472', category: 'Beverages', cost: 0.80, price: 1.99, stock: 60, reorder: 25 },
        { name: 'Tomato Sauce 500g', barcode: '5901234123473', category: 'Canned Goods', cost: 0.60, price: 1.49, stock: 4, reorder: 12 },
        { name: 'Canned Tuna 200g', barcode: '5901234123474', category: 'Canned Goods', cost: 1.20, price: 2.79, stock: 35, reorder: 15 },
        { name: 'Potato Chips 150g', barcode: '5901234123475', category: 'Snacks', cost: 0.80, price: 2.49, stock: 45, reorder: 20 },
        { name: 'Chocolate Bar 100g', barcode: '5901234123476', category: 'Snacks', cost: 0.60, price: 1.79, stock: 55, reorder: 25 },
        { name: 'Frozen Pizza', barcode: '5901234123477', category: 'Frozen Foods', cost: 2.00, price: 4.99, stock: 18, reorder: 10 },
        { name: 'Ice Cream 500ml', barcode: '5901234123478', category: 'Frozen Foods', cost: 2.50, price: 5.49, stock: 12, reorder: 8 },
        { name: 'Dish Soap 500ml', barcode: '5901234123479', category: 'Cleaning', cost: 1.00, price: 2.49, stock: 25, reorder: 12 },
        { name: 'Laundry Detergent 1L', barcode: '5901234123480', category: 'Cleaning', cost: 3.00, price: 6.99, stock: 20, reorder: 10 },
        { name: 'Shampoo 400ml', barcode: '5901234123481', category: 'Personal Care', cost: 2.00, price: 4.99, stock: 22, reorder: 10 },
        { name: 'Toothpaste 100ml', barcode: '5901234123482', category: 'Personal Care', cost: 0.80, price: 2.29, stock: 30, reorder: 15 },
    ];

    for (const p of products) {
        try {
            const catId = categoryIds[p.category];
            if (!catId) {
                // Skip if category creation failed
                continue;
            }

            const existing = await get<{ id: number }>('SELECT id FROM products WHERE barcode = ?', [p.barcode]);
            if (!existing) {
                await ProductRepo.create({
                    name: p.name,
                    barcode: p.barcode,
                    category_id: catId,
                    cost_price: p.cost,
                    selling_price: p.price,
                    stock_quantity: p.stock,
                    reorder_level: p.reorder,
                });
            }
        } catch (e) {
            console.error('Error seeding product:', p.name, e);
        }
    }

    // Suppliers
    const suppliers = [
        { name: 'Fresh Farms Inc.', contact_person: 'John Miller', phone: '+1-555-0101', email: 'john@freshfarms.com', address: '123 Farm Rd, Springfield' },
        { name: 'Metro Distributors', contact_person: 'Sarah Lee', phone: '+1-555-0202', email: 'sarah@metrodist.com', address: '456 Commerce St, Townville' },
        { name: 'Quality Meats Co.', contact_person: 'Mike Brown', phone: '+1-555-0303', email: 'mike@qualitymeats.com', address: '789 Industrial Ave, Cityburg' },
        { name: 'BevCo Supplies', contact_person: 'Lisa Chen', phone: '+1-555-0404', email: 'lisa@bevco.com', address: '321 Beverage Blvd, Drinktown' },
        { name: 'CleanPro Supply', contact_person: 'Tom Wilson', phone: '+1-555-0505', email: 'tom@cleanpro.com', address: '654 Clean St, Washville' },
    ];

    for (const s of suppliers) {
        try {
            const existing = await get<{ id: number }>('SELECT id FROM suppliers WHERE name = ?', [s.name]);
            if (!existing) {
                await SupplierRepo.create(s);
            }
        } catch (e) {
            console.error('Error seeding supplier:', s.name, e);
        }
    }

    console.log('✅ Database seeded execution complete.');
}
