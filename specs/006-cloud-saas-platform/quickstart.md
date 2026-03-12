# Quickstart: Cloud-Powered Multi-Tenant Supermarket Management SaaS

**Feature**: `006-cloud-saas-platform` | **Date**: 2026-03-12

## Prerequisites

- Python 3.12+
- Node.js 20+ & npm
- PostgreSQL 16
- Redis 7+
- Expo CLI (`npm install -g expo-cli`)
- Stripe CLI (for webhook testing)

## Project Structure

```
kenz-supermarket/
├── backend/          # Django 5.x REST API + WebSocket
├── frontend/         # React 19 Vite web admin dashboard
├── src/ + electron/  # Electron POS (existing, modified)
├── mobile/           # Expo React Native app
└── specs/            # Feature specs & plans
```

## 1. Backend (Django)

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
# .venv\Scripts\Activate.ps1      # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Create .env (copy from template)
cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgres://kenz:password@localhost:5432/kenz_saas
#   REDIS_URL=redis://localhost:6379/0
#   SECRET_KEY=<generate-a-secret>
#   STRIPE_SECRET_KEY=sk_test_...
#   STRIPE_WEBHOOK_SECRET=whsec_...
#   FRONTEND_URL=http://localhost:5173
#   EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Create database
createdb kenz_saas

# Run migrations
python manage.py migrate

# Create superuser (admin panel access)
python manage.py createsuperuser

# Seed demo data (optional)
python manage.py seed_demo_store

# Start development server (HTTP + WebSocket)
python manage.py runserver         # HTTP on :8000
# In a separate terminal:
daphne -p 8001 backend.asgi:application  # WebSocket on :8001
```

### Key Django Apps

| App | Purpose |
|-----|---------|
| `stores` | Store model, registration, onboarding |
| `accounts` | User model, JWT auth, role-based permissions |
| `categories` | Category CRUD |
| `products` | Product + ProductBatch CRUD |
| `suppliers` | Supplier CRUD |
| `purchases` | PurchaseOrder + items CRUD |
| `customers` | Customer + CustomerTransaction CRUD |
| `sales` | Sale + SaleItem + PaymentEntry CRUD |
| `stock` | StockMovement CRUD |
| `cashier_sessions` | CashierSession CRUD |
| `expenses` | Expense CRUD |
| `promotions` | Promotion + PromotionProduct CRUD |
| `reports` | Aggregation endpoints |
| `billing` | dj-stripe integration, plan enforcement |
| `sync` | Sync push/pull endpoints, SyncLog |
| `audit` | AuditLog, PII access tracking |
| `settings_app` | AppSetting, TicketCounter |
| `pos_config` | POSQuickAccess CRUD |
| `realtime` | Django Channels consumers, signals |

### Running Tests

```bash
pytest --cov=. --cov-report=term-missing
```

## 2. Web Dashboard (Frontend)

```bash
cd frontend

# Install dependencies
npm install

# Create .env
cp .env.example .env
# Edit .env:
#   VITE_API_URL=http://localhost:8000/api/v1
#   VITE_WS_URL=ws://localhost:8001/ws

# Start dev server
npm run dev
# → http://localhost:5173
```

### Key Differences from Existing Electron App

- Zustand stores call `apiClient.get('/products/')` instead of `repo.getAll()`
- No local SQLite — all data from REST API
- WebSocket connection for real-time updates
- Public pages added: landing, pricing, sign-up, login

## 3. Desktop POS (Electron — Modified)

```bash
# From project root
npm install

# Create .env
cp .env.example .env
# Edit .env:
#   VITE_API_URL=http://localhost:8000/api/v1
#   VITE_WS_URL=ws://localhost:8001/ws

# Start in development
npm run electron:dev
```

### Key Modifications to Existing POS

- **Auth**: Login screen authenticates against Django API (requires internet)
- **Sync layer**: New `src/services/syncEngine.ts` manages offline queue + periodic sync
- **Local cache**: sql.js/better-sqlite3 still used, but synced with backend
- **UUID PKs**: All IDs changed from autoincrement integers to UUID v4
- **WebSocket**: Receives real-time updates from other devices/dashboard

## 4. Mobile App (Expo)

```bash
cd mobile

# Install dependencies
npm install

# Create .env
cp .env.example .env
# Edit .env:
#   API_URL=http://localhost:8000/api/v1
#   WS_URL=ws://localhost:8001/ws

# Start Expo development
npx expo start
# Scan QR with Expo Go app on your phone
```

## 5. Stripe Webhook Testing

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:8000/api/v1/billing/webhook/
# Copy the webhook signing secret to .env STRIPE_WEBHOOK_SECRET
```

## 6. Full Stack Development

For full-stack development, run all services:

| Terminal | Command | Port |
|----------|---------|------|
| 1 | `cd backend && python manage.py runserver` | 8000 |
| 2 | `cd backend && daphne -p 8001 backend.asgi:application` | 8001 |
| 3 | `cd frontend && npm run dev` | 5173 |
| 4 | `npm run electron:dev` (from root) | Electron |
| 5 | `cd mobile && npx expo start` | 19000 |
| 6 | `stripe listen --forward-to localhost:8000/api/v1/billing/webhook/` | — |

## Environment Variables Summary

| Variable | Backend | Frontend | POS | Mobile |
|----------|---------|----------|-----|--------|
| `DATABASE_URL` | ✓ | | | |
| `REDIS_URL` | ✓ | | | |
| `SECRET_KEY` | ✓ | | | |
| `STRIPE_SECRET_KEY` | ✓ | | | |
| `STRIPE_WEBHOOK_SECRET` | ✓ | | | |
| `VITE_API_URL` / `API_URL` | | ✓ | ✓ | ✓ |
| `VITE_WS_URL` / `WS_URL` | | ✓ | ✓ | ✓ |
| `FRONTEND_URL` | ✓ | | | |
| `EMAIL_BACKEND` | ✓ | | | |
