# super-market Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript (React 19.x) + Vite 7.x + React, Zustand (state), sql.js (SQLite), Framer Motion (002-performance-optimization)
- SQLite (client-side via sql.js + better-sqlite3 for Electron) (002-performance-optimization)
- TypeScript (React 19.x frontend, Vite 7.x bundler) + React, Zustand, sql.js, Framer Motion, Radix UI, lucide-react, sonner, react-i18next, react-router-dom (003-promotion-management)
- SQLite (client-side via sql.js; Electron persistence via IPC) (003-promotion-management)

- TypeScript (React 18.x for frontend, Node.js 20.x for backend) + Next.js 14, PostgreSQL 15, Stripe API (card payments) (001-pos-system)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (React 18.x for frontend, Node.js 20.x for backend): Follow standard conventions

## Recent Changes
- 003-promotion-management: Added TypeScript (React 19.x) + Zustand, sql.js, Radix UI, Framer Motion, sonner, react-i18next — Promotion Management System (price/quantity/pack discounts, admin CRUD page, checkout integration)

- 002-performance-optimization: Added TypeScript (React 19.x) + Vite 7.x + React, Zustand (state), sql.js (SQLite), Framer Motion

- 001-pos-system: Added TypeScript (React 18.x for frontend, Node.js 20.x for backend) + Next.js 14, PostgreSQL 15, Stripe API (card payments)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
