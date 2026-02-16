/**
 * Seed built-in data for the application.
 * Categories are built-in and always seeded — they represent the universal
 * product taxonomy any supermarket would need.
 */

import { get } from './db';
import { CategoryRepo } from './repositories/category.repo';

export async function seedDatabase(): Promise<void> {
    // Only seed categories if none exist yet
    const catCount = await get<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    if ((catCount?.count ?? 0) > 0) return;

    console.log('🌱 Seeding built-in categories...');

    const categories = [
        // 🥛 Dairy & Eggs
        { name: 'Dairy & Eggs', description: 'Milk, cheese, yogurt, butter, cream, eggs', color: '#3b82f6' },

        // 🥖 Bakery
        { name: 'Bakery', description: 'Bread, pastries, cakes, buns, croissants', color: '#f59e0b' },

        // 🥬 Fresh Produce
        { name: 'Fruits', description: 'Fresh fruits — apples, bananas, oranges, berries', color: '#22c55e' },
        { name: 'Vegetables', description: 'Fresh vegetables — tomatoes, potatoes, onions, peppers', color: '#16a34a' },

        // 🥩 Meat & Seafood
        { name: 'Meat & Poultry', description: 'Beef, chicken, lamb, turkey, sausages', color: '#ef4444' },
        { name: 'Seafood & Fish', description: 'Fresh and frozen fish, shrimp, shellfish', color: '#0ea5e9' },

        // 🍞 Grains & Staples
        { name: 'Rice, Pasta & Grains', description: 'Rice, pasta, couscous, flour, oats, cereals', color: '#d97706' },

        // 🥫 Canned & Jarred
        { name: 'Canned Goods', description: 'Canned vegetables, beans, tuna, soups, sauces', color: '#8b5cf6' },

        // 🧊 Frozen Foods
        { name: 'Frozen Foods', description: 'Frozen meals, pizza, ice cream, frozen vegetables', color: '#06b6d4' },

        // 🥤 Beverages
        { name: 'Beverages', description: 'Water, juices, soft drinks, energy drinks', color: '#6366f1' },
        { name: 'Tea & Coffee', description: 'Tea bags, ground coffee, instant coffee, herbal teas', color: '#78350f' },

        // 🍪 Snacks & Confectionery
        { name: 'Snacks', description: 'Chips, crackers, nuts, popcorn, trail mix', color: '#ec4899' },
        { name: 'Confectionery', description: 'Chocolate, candies, gum, sweets', color: '#f43f5e' },

        // 🫒 Oils, Sauces & Condiments
        { name: 'Oils & Condiments', description: 'Cooking oil, olive oil, vinegar, ketchup, mustard, mayonnaise', color: '#ca8a04' },
        { name: 'Spices & Seasonings', description: 'Salt, pepper, cumin, paprika, herbs, spice mixes', color: '#b45309' },

        // 🍯 Breakfast & Spreads
        { name: 'Breakfast & Cereals', description: 'Cereals, oatmeal, pancake mix, granola, muesli', color: '#fb923c' },
        { name: 'Spreads & Jams', description: 'Honey, jam, peanut butter, Nutella, marmalade', color: '#f97316' },

        // 🧁 Baking Supplies
        { name: 'Baking Supplies', description: 'Flour, sugar, baking powder, yeast, vanilla, chocolate chips', color: '#a16207' },

        // 👶 Baby Products
        { name: 'Baby Products', description: 'Baby food, formula, diapers, wipes, baby care', color: '#f0abfc' },

        // 🧴 Personal Care & Hygiene
        { name: 'Personal Care', description: 'Shampoo, soap, toothpaste, deodorant, skincare', color: '#e879f9' },
        { name: 'Health & Wellness', description: 'Vitamins, supplements, first aid, pain relief', color: '#10b981' },

        // 🧹 Household & Cleaning
        { name: 'Cleaning Supplies', description: 'Detergent, dish soap, bleach, floor cleaner, sponges', color: '#14b8a6' },
        { name: 'Paper & Disposables', description: 'Toilet paper, tissues, paper towels, trash bags, foil', color: '#64748b' },

        // 🐾 Pet Supplies
        { name: 'Pet Supplies', description: 'Pet food, treats, cat litter, pet accessories', color: '#a3e635' },

        // 🍷 Alcohol & Tobacco
        { name: 'Alcohol', description: 'Beer, wine, spirits, liqueurs', color: '#7c3aed' },
        { name: 'Tobacco', description: 'Cigarettes, tobacco, rolling papers, lighters', color: '#57534e' },

        // 🌍 International & Specialty
        { name: 'International Foods', description: 'Asian, Mexican, Mediterranean, Middle Eastern, specialty items', color: '#0d9488' },
        { name: 'Organic & Health Food', description: 'Organic products, gluten-free, vegan, sugar-free', color: '#4ade80' },

        // ❄️ Deli & Ready Meals
        { name: 'Deli & Charcuterie', description: 'Cold cuts, cheese platters, olives, prepared salads', color: '#e11d48' },
        { name: 'Ready Meals', description: 'Pre-made meals, sandwiches, salads, soups', color: '#be123c' },

        // 🏠 Home & Kitchen
        { name: 'Kitchen & Cookware', description: 'Utensils, containers, pots, pans, storage', color: '#475569' },
        { name: 'Home Essentials', description: 'Light bulbs, batteries, candles, matches, laundry', color: '#6b7280' },

        // 📦 Others
        { name: 'Stationery & Office', description: 'Pens, notebooks, tape, envelopes, school supplies', color: '#2563eb' },
        { name: 'Seasonal & Gifts', description: 'Holiday items, decorations, gift cards, wrapping', color: '#c026d3' },
        { name: 'Other', description: 'Miscellaneous and uncategorized items', color: '#94a3b8' },
    ];

    for (const cat of categories) {
        try {
            await CategoryRepo.create(cat);
        } catch (e) {
            console.error('Error seeding category:', cat.name, e);
        }
    }

    console.log(`✅ ${categories.length} built-in categories seeded.`);
}
