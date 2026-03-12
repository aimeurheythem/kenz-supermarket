# super-market Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript (React 19.x frontend, Vite 7.x bundler) + React, Zustand (state), sql.js (SQLite in WASM), Framer Motion (animations), Radix UI (primitives), lucide-react (icons), sonner (toasts), react-i18next (i18n), react-router-dom (routing) (003-promotion-management)
- SQLite (client-side via sql.js; Electron persistence via IPC) (003-promotion-management)
- TypeScript 5.9.x (React 19.x) + React 19, Zustand 5, Framer Motion 12, Radix UI, lucide-react, sonner (toasts), react-i18next, Tailwind CSS 4 (004-cart-panel)
- sql.js (client-side SQLite) + better-sqlite3 (Electron persistence via IPC) (004-cart-panel)
- TypeScript 5.9 (React 19.x) + Vite 7.x, React 19, Zustand 5.x (state), sql.js + better-sqlite3 (SQLite), Framer Motion 12.x (animations), Radix UI (dialogs/selects/tooltips), lucide-react (icons), sonner (toasts), react-i18next (i18n), react-router-dom 7, Tailwind CSS 4.x (005-pos-rebuild)
- SQLite (client-side via sql.js; Electron persistence via IPC with better-sqlite3) (005-pos-rebuild)
- Python 3.12 (backend), TypeScript 5.x (web/desktop/mobile) + Django 5.x + DRF + Django Channels + SimpleJWT (backend); React 19 + Vite 7 + Zustand + Radix UI + Tailwind CSS + Framer Motion + Recharts (web); Electron 40 + sql.js/better-sqlite3 (desktop); Expo SDK + React Native + NativeWind + React Navigation (mobile) (006-cloud-saas-platform)
- PostgreSQL 16 (server, multi-tenant via store_id FK + RLS); SQLite (POS offline cache via sql.js/better-sqlite3); expo-sqlite (mobile cache) (006-cloud-saas-platform)

- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (003-promotion-management)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

[e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]: Follow standard conventions

## Recent Changes
- 006-cloud-saas-platform: Added Python 3.12 (backend), TypeScript 5.x (web/desktop/mobile) + Django 5.x + DRF + Django Channels + SimpleJWT (backend); React 19 + Vite 7 + Zustand + Radix UI + Tailwind CSS + Framer Motion + Recharts (web); Electron 40 + sql.js/better-sqlite3 (desktop); Expo SDK + React Native + NativeWind + React Navigation (mobile)
- 005-pos-rebuild: Added TypeScript 5.9 (React 19.x) + Vite 7.x, React 19, Zustand 5.x (state), sql.js + better-sqlite3 (SQLite), Framer Motion 12.x (animations), Radix UI (dialogs/selects/tooltips), lucide-react (icons), sonner (toasts), react-i18next (i18n), react-router-dom 7, Tailwind CSS 4.x
- 004-cart-panel: Added TypeScript 5.9.x (React 19.x) + React 19, Zustand 5, Framer Motion 12, Radix UI, lucide-react, sonner (toasts), react-i18next, Tailwind CSS 4


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
