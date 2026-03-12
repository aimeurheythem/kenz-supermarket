# Implementation Plan: Cloud-Powered Multi-Tenant Supermarket Management SaaS

**Branch**: `006-cloud-saas-platform` | **Date**: 2026-03-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-cloud-saas-platform/spec.md`

## Summary

Transform the existing Kenz Supermarket Electron desktop POS into a multi-tenant SaaS platform. A new Django REST backend serves as the central source of truth with PostgreSQL multi-tenant storage (store_id isolation). The current React/Zustand frontend is split into: (1) a web admin dashboard deployed on Vercel, (2) a modified Electron POS with offline-first sync layer, and (3) a new Expo React Native mobile app. All clients synchronize in real-time via WebSocket and share a common entity model with client-generated UUID v4 primary keys.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x (web/desktop/mobile)
**Primary Dependencies**: Django 5.x + DRF + Django Channels + SimpleJWT (backend); React 19 + Vite 7 + Zustand + Radix UI + Tailwind CSS + Framer Motion + Recharts (web); Electron 40 + sql.js/better-sqlite3 (desktop); Expo SDK + React Native + NativeWind + React Navigation (mobile)
**Storage**: PostgreSQL 16 (server, multi-tenant via store_id FK + RLS); SQLite (POS offline cache via sql.js/better-sqlite3); expo-sqlite (mobile cache)
**Testing**: pytest + pytest-django + factory_boy (backend); Vitest + Testing Library (web/desktop); Jest + React Native Testing Library (mobile)
**Target Platform**: Linux server (Render → Oracle Cloud/Hetzner); Web browsers (Chrome/Firefox/Safari/Edge latest 2); Windows/macOS (Electron desktop); iOS 15+ / Android 10+ (Expo mobile)
**Project Type**: Multi-component SaaS: REST API backend, web application, desktop application, mobile application
**Performance Goals**: API p95 < 200ms; web page load < 2s; POS checkout < 15s; mobile dashboard load < 3s; WebSocket push < 3s; 500 concurrent stores × 5 devices
**Constraints**: POS offline-capable for 24h+; 7-day cached credential expiry; 99.5% backend uptime; TLS in transit; client-generated UUID v4 keys
**Scale/Scope**: 500+ stores, 2500+ concurrent devices, 21 entity types, 40 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | ESLint + Prettier (TS), Ruff + Black (Python). Single-responsibility services. Clear module interfaces per component. |
| II. Testing Standards | PASS | TDD approach. pytest (backend), Vitest (web/desktop), Jest (mobile). Coverage target 80%+. Mocked external deps. |
| III. UX Consistency | PASS | Web dashboard reuses existing component library, design patterns, i18n. Mobile uses NativeWind for Tailwind parity. |
| IV. Performance | PASS | API p95 < 200ms, indexed queries, frontend interactions < 100ms, POS checkout < 15s. Benchmarks defined in SC-003 through SC-012. |
| V. Observability | PASS | Django structured logging, health endpoints per SC-013, error tracking with context, audit log (FR-011). |
| Security | PASS | TLS (FR-034), password complexity (FR-035), PII logging (FR-036), JWT auth, no secrets in VCS, input validation (FR-010). |
| Quality Gates | PASS | All tests, 80% coverage, lint, security scans, performance benchmarks required before merge. |

**GATE RESULT: PASS** — No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/006-cloud-saas-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/                           # Django REST API (NEW)
├── manage.py
├── requirements.txt
├── config/                        # Django project settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── stores/                    # Store (tenant) management + onboarding
│   ├── accounts/                  # User auth, JWT, roles
│   ├── inventory/                 # Products, categories, batches, stock
│   ├── sales/                     # Sales, sale items, payments, cashier sessions
│   ├── purchasing/                # Suppliers, purchase orders
│   ├── customers/                 # Customers, transactions (ledger)
│   ├── promotions/                # Promotions, promotion products
│   ├── expenses/                  # Expenses
│   ├── reports/                   # Reporting & analytics endpoints
│   ├── settings/                  # App settings (per-store)
│   ├── audit/                     # Audit log
│   ├── billing/                   # Subscription/plan management (Stripe)
│   ├── sync/                      # Sync protocol + conflict resolution
│   └── notifications/             # WebSocket consumers (Django Channels)
└── tests/

frontend/                          # Web admin dashboard (NEW — extracted from src/)
├── src/
│   ├── components/                # Reused from existing src/components/
│   ├── pages/                     # Admin pages (no POS checkout)
│   ├── stores/                    # Zustand stores (API-backed)
│   ├── services/                  # API client, WebSocket client, auth service
│   ├── hooks/
│   ├── i18n/
│   ├── lib/
│   └── types/
├── public/                        # Landing page, marketing assets
└── tests/

electron/                          # Desktop POS (MODIFIED — existing)
├── main.js
├── preload.js
└── src/
    ├── sync/                      # Sync engine, offline queue, conflict resolver
    ├── services/                  # API client, WebSocket client
    └── auth/                      # Login screen, cached credential manager

src/                               # Shared React code (existing — POS UI)
├── components/                    # Existing UI components
├── stores/                        # Zustand stores (local SQLite-backed for POS)
├── hooks/
├── i18n/
├── lib/
├── pages/
├── services/
└── types/

mobile/                            # Expo React Native app (NEW)
├── app/                           # Expo Router screens
├── components/                    # RN components (NativeWind-styled)
├── stores/                        # Zustand stores (API-backed)
├── services/                      # API client, WebSocket, push notifications
├── hooks/
├── i18n/
└── types/
```

**Structure Decision**: Four-component architecture. `backend/` is a new Django project. `frontend/` extracts the admin dashboard from `src/` to a standalone Vite web app calling the API. The existing `src/` + `electron/` remains as the desktop POS with a new sync layer added. `mobile/` is a new Expo project. Shared types and i18n keys will be extracted to maintain consistency.

## Complexity Tracking

> No constitution violations to justify.
