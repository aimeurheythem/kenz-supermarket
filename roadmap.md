Project Description
Kenz POS — Cloud-Powered Multi-Tenant Supermarket Management SaaS

What we're building
We are transforming the existing Kenz Supermarket Electron desktop application into a full SaaS (Software as a Service) product that any store owner anywhere can purchase, set up in minutes, and run their entire supermarket operation from a desktop POS, a web admin dashboard, and a mobile app — all synchronized in real-time through a central Django backend.

The system has 4 components:
1. Django Backend API (NEW — the core)
A multi-tenant REST API built with Django + Django REST Framework + PostgreSQL that serves as the single source of truth for all stores. Every table is isolated by store_id so each store's data (products, sales, customers, stock, expenses, promotions, etc.) is completely separate. The backend handles:

Authentication & authorization (JWT): store owners, managers, cashiers — role-based access
Store registration & onboarding (owner signs up → gets a store workspace)
Full CRUD for all 17 entities: categories, products, product batches, suppliers, purchase orders, purchase order items, customers, customer transactions, sales, sale items, payment entries, stock movements, users, cashier sessions, POS quick access, expenses, audit logs, promotions, promotion products, app settings, ticket counters
Real-time WebSocket notifications (Django Channels): when data changes on one device, all other connected devices for that store receive the update instantly
Sync protocol for the Electron POS: offline queue reconciliation, conflict resolution, last-write-wins with field-level merge
Reporting & analytics endpoints: daily sales, revenue, top products, stock alerts, cashier performance
Subscription/plan management: free trial, basic, pro tiers (enforced at API level)
Deployed on Render (free tier to start), migrates to Oracle Cloud or Hetzner when profitable
2. SaaS Marketing Website + Admin Dashboard (NEW — React web app)
A web application deployed on Vercel (free) that serves two purposes:

Public pages: landing page, pricing, features, sign-up/login — this is how new customers discover and purchase the product
Admin dashboard (after login): the store owner/manager's control panel — this is essentially the current Electron app UI (Dashboard, Inventory, Suppliers, Stock Control, Purchases, Reports, Transactions, Users, Customers, Expenses, Promotions, Audit Logs, Settings) rebuilt to call the Django API instead of local SQLite. The admin dashboard does NOT include the POS/checkout screen — that stays exclusive to the Electron desktop app where the cashier operates.
The existing React components, pages, Zustand stores, hooks, i18n translations, and UI library (Radix UI, Tailwind, Framer Motion, Recharts, Lucide icons, Sonner toasts) are reused directly. The main change is replacing all database/repositories/*.repo.ts calls with fetch() calls to the Django API.

3. Electron POS Desktop App (MODIFIED — existing app)
The existing Electron POS application stays as the cashier's primary tool at the store register. It is modified to:

Add a login screen that authenticates against the Django API (the cashier uses credentials created by the admin)
Keep local SQLite as an offline cache so the POS never stops working if internet drops
Add a sync layer: on startup and periodically, sync local SQLite ↔ Django API (push local sales/changes, pull new products/prices/promotions from server)
Add an offline queue: sales made while offline are stored locally and pushed to the server when connectivity returns
Add WebSocket client: receive real-time updates (new products added from phone/web appear instantly on POS)
Remove the admin management pages (Inventory, Suppliers, Reports, Users, etc.) from the POS build — or keep them accessible only if the logged-in user is an admin/manager. The POS focuses on: checkout, cart, barcode scanning, quick access, receipt printing, cashier session management.
Distribution: downloadable .exe / .dmg from the SaaS website, or auto-update via electron-updater
4. Mobile App (NEW — Expo React Native, iOS + Android)
A cross-platform mobile application for store owners/managers to manage their store from anywhere (home, traveling, another location). It connects directly to the Django API over the internet. Features:

Same functionality as the web admin dashboard: view/manage products, categories, suppliers, stock, view sales & reports, manage customers, manage users/cashiers, view expenses, manage promotions, view audit logs, configure settings
Real-time updates via WebSocket: see new sales as they happen at the store
Push notifications: low stock alerts, large sales, cashier session open/close
Barcode scanning via phone camera (expo-camera)
Offline capability: light local cache + offline queue for product edits
Built with Expo (React Native), NativeWind (Tailwind for RN), React Navigation, Zustand (shared store logic), expo-sqlite (local cache)
Published to Apple App Store and Google Play Store
Data flow:

Store owner at home (📱 Mobile or 🌐 Website)
  → Adds product "Coca Cola 1L"
  → POST to Django API
  → Saved in PostgreSQL
  → WebSocket pushes to POS at store
  → Cashier sees new product instantly

Cashier at store (🖥️ Electron POS)
  → Makes a sale
  → Saved to local SQLite + POST to Django API
  → WebSocket pushes to mobile/web
  → Owner sees the sale from home in real-time

Internet goes down at store
  → POS keeps working (local SQLite)
  → Sales queued offline
  → Internet returns → auto-sync → all devices updated

Store owner at home (📱 Mobile or 🌐 Website)  → Adds product "Coca Cola 1L"  → POST to Django API  → Saved in PostgreSQL  → WebSocket pushes to POS at store  → Cashier sees new product instantlyCashier at store (🖥️ Electron POS)  → Makes a sale  → Saved to local SQLite + POST to Django API  → WebSocket pushes to mobile/web  → Owner sees the sale from home in real-timeInternet goes down at store  → POS keeps working (local SQLite)  → Sales queued offline  → Internet returns → auto-sync → all devices updated
Multi-tenancy:
Every database table includes a store_id foreign key. Row-Level Security ensures Store A never sees Store B's data. A single PostgreSQL instance and single Django deployment serves all stores.

Authentication & roles:
Store Owner: full access to everything (web, mobile, POS)
Manager: full access except billing/subscription (web, mobile, POS)
Cashier: POS access only (desktop app, limited to checkout operations)
Tech stack summary:
Backend: Python 3.12, Django 5.x, Django REST Framework, Django Channels (WebSocket), SimpleJWT, PostgreSQL
Web admin: React 19, TypeScript, Vite, Tailwind CSS, Radix UI, Zustand, Recharts, React Router, Framer Motion — deployed on Vercel
Desktop POS: Electron, React 19, TypeScript, sql.js/better-sqlite3 (offline), sync client
Mobile app: Expo (React Native), TypeScript, NativeWind, React Navigation, Zustand, expo-sqlite, expo-camera
Hosting: Render (free), later Oracle Cloud / Hetzner
Payments: Stripe (subscription billing for SaaS customers)