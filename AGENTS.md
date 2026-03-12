# super-market Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript (React 19.x) + Vite 7.x + React, Zustand (state), sql.js (SQLite), Framer Motion (002-performance-optimization)
- SQLite (client-side via sql.js + better-sqlite3 for Electron) (002-performance-optimization)
- TypeScript (React 19.x frontend, Vite 7.x bundler) + React, Zustand, sql.js, Framer Motion, Radix UI, lucide-react, sonner, react-i18next, react-router-dom (003-promotion-management)
- SQLite (client-side via sql.js; Electron persistence via IPC) (003-promotion-management)

- TypeScript (React 18.x for frontend, Node.js 20.x for backend) + Next.js 14, PostgreSQL 15, Stripe API (card payments) (001-pos-system)
- Python 3.12 (Django 5.x, DRF, Django Channels, SimpleJWT, dj-stripe) + PostgreSQL 16, Redis (channels_redis) — Backend API (006-cloud-saas-platform)
- TypeScript (React 19.x, Vite 7.x) + Zustand 5, Radix UI, Tailwind CSS 4, Framer Motion, Recharts, React Router 7 — Web Dashboard (006-cloud-saas-platform)
- Electron 40 + sql.js, better-sqlite3, bcryptjs — Offline-First POS with Sync (006-cloud-saas-platform)
- Expo SDK (React Native) + NativeWind, React Navigation, expo-sqlite, expo-camera — Mobile App (006-cloud-saas-platform)

## Project Structure

```text
backend/         # Django 5.x API + WebSocket (006)
frontend/        # React 19 web dashboard (006)
src/ + electron/ # Electron POS (existing + sync layer)
mobile/          # Expo React Native app (006)
specs/           # Feature specs & plans
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (React 18.x for frontend, Node.js 20.x for backend): Follow standard conventions

## Recent Changes
- 006-cloud-saas-platform: Added Python 3.12 (Django 5.x, DRF, Channels, SimpleJWT, dj-stripe) + PostgreSQL 16 + Redis — Multi-Tenant SaaS Backend; React 19 Web Dashboard; Modified Electron POS with offline sync; Expo Mobile App

- 003-promotion-management: Added TypeScript (React 19.x) + Zustand, sql.js, Radix UI, Framer Motion, sonner, react-i18next — Promotion Management System (price/quantity/pack discounts, admin CRUD page, checkout integration)

- 002-performance-optimization: Added TypeScript (React 19.x) + Vite 7.x + React, Zustand (state), sql.js (SQLite), Framer Motion

- 001-pos-system: Added TypeScript (React 18.x for frontend, Node.js 20.x for backend) + Next.js 14, PostgreSQL 15, Stripe API (card payments)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
