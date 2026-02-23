# Quickstart: Full-Featured POS System

**Date**: 2026-02-22  
**Feature**: 001-pos-system

## Prerequisites

- Node.js 20.x
- PostgreSQL 15.x
- npm or yarn

## Setup

### 1. Database Setup

```bash
# Create database
createdb super_market_pos

# Run migrations
cd backend
npm install
npx prisma migrate dev
```

### 2. Environment Variables

Create `.env` in backend directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/super_market_pos"
SESSION_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Seed Initial Data

```bash
# Seed categories, tax rates, and demo user
npx prisma db seed
```

Default login: `admin@pos.local` / `admin123`

### 4. Start Development Servers

```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

### 5. Access POS

Open http://localhost:3000 in browser.

## User Roles

| Role    | Permissions                                                   |
| ------- | ------------------------------------------------------------- |
| Cashier | Process sales, view own transactions, basic product search    |
| Manager | All cashier + product management, reports, returns, discounts |
| Admin   | All permissions + user management, system settings            |

## Key Workflows

### Starting a Sale

1. Login with cashier credentials
2. POS main screen shows empty cart
3. Scan barcode or search for products
4. Products added to cart with quantities

### Completing Payment

1. Review cart total
2. Select payment method (Cash/Card/Split)
3. For cash: Enter amount tendered, system calculates change
4. For card: Process via Stripe terminal
5. Print/skip receipt
6. Cart saved as completed transaction

### Processing Returns

1. Login as Manager
2. Enter transaction number or scan receipt
3. Select items to return
4. Choose refund method (original payment / store credit)
5. Process refund

### End of Day

1. Login as Manager
2. Navigate to Reports
3. Select "Daily Report"
4. Review totals, payment breakdown, top sellers
5. Export or print report

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Troubleshooting

**Barcode not scanning**: Ensure cursor is in search field, scanner is connected as keyboard input

**Card payment failing**: Check Stripe API keys in .env

**Inventory not syncing**: Verify WebSocket connection, check network

**Receipt not printing**: Check printer configuration, try browser print dialog
