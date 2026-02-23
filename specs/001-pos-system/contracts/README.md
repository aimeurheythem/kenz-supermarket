# Contracts: Full-Featured POS System

**Date**: 2026-02-22  
**Feature**: 001-pos-system

## Overview

This directory contains API contracts for external interfaces of the POS system.

## Public Interfaces

### 1. REST API

The POS exposes REST endpoints for:

- Product catalog operations
- Cart and transaction management
- Customer management
- Authentication
- Reporting

**Base URL**: `/api/v1`

**Authentication**: Session-based with cookie

### 2. WebSocket Events

Real-time updates for multi-terminal sync:

| Event              | Direction       | Payload                      |
| ------------------ | --------------- | ---------------------------- |
| `inventory:update` | Server → Client | `{ productId, newQuantity }` |
| `price:update`     | Server → Client | `{ productId, newPrice }`    |
| `cart:update`      | Server → Client | `{ terminalId, cartState }`  |

### 3. Stripe Integration

Card payments processed via Stripe:

- Stripe Elements for card input
- Payment Intents API for authorization
- Webhook handlers for payment events

## Internal Contracts

### Database Schema

See `../data-model.md` for entity definitions.

### Component Contracts

Frontend components communicate via React context and hooks:

- `useCart()` - Cart state and operations
- `useAuth()` - Authentication state
- `useProducts()` - Product catalog access

---

_Note: This is a web application serving internal retail operations. No public API or third-party integrations beyond Stripe for payments._
