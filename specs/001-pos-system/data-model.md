# Data Model: Full-Featured POS System

**Date**: 2026-02-22  
**Feature**: 001-pos-system

## Entities

### Product

Represents items for sale in the inventory.

| Field               | Type          | Constraints          | Description                 |
| ------------------- | ------------- | -------------------- | --------------------------- |
| id                  | UUID          | PK                   | Unique identifier           |
| barcode             | VARCHAR(50)   | UNIQUE, NOT NULL     | Primary lookup key          |
| sku                 | VARCHAR(50)   | UNIQUE, NULLABLE     | Secondary identifier        |
| name                | VARCHAR(255)  | NOT NULL             | Product display name        |
| description         | TEXT          | NULLABLE             | Product details             |
| price               | DECIMAL(10,2) | NOT NULL             | Unit price                  |
| cost                | DECIMAL(10,2) | NULLABLE             | Cost for profit calculation |
| category_id         | UUID          | FK → Category        | Product category            |
| tax_rate_id         | UUID          | FK → TaxRate         | Applicable tax rate         |
| stock_quantity      | INTEGER       | NOT NULL, DEFAULT 0  | Current inventory           |
| low_stock_threshold | INTEGER       | NOT NULL, DEFAULT 10 | Alert threshold             |
| is_active           | BOOLEAN       | DEFAULT TRUE         | Soft delete flag            |
| created_at          | TIMESTAMP     | DEFAULT NOW          | Creation timestamp          |
| updated_at          | TIMESTAMP     | DEFAULT NOW          | Last update timestamp       |

**State Transitions**: Active → Inactive (deactivation does not delete)

---

### Category

Groups products for organization and reporting.

| Field     | Type         | Constraints   | Description                        |
| --------- | ------------ | ------------- | ---------------------------------- |
| id        | UUID         | PK            | Unique identifier                  |
| name      | VARCHAR(100) | NOT NULL      | Category name                      |
| parent_id | UUID         | FK → Category | Self-referential for subcategories |
| is_active | BOOLEAN      | DEFAULT TRUE  | Soft delete flag                   |

---

### TaxRate

Defines tax percentages for product categories.

| Field      | Type         | Constraints   | Description                                 |
| ---------- | ------------ | ------------- | ------------------------------------------- |
| id         | UUID         | PK            | Unique identifier                           |
| name       | VARCHAR(50)  | NOT NULL      | Tax rate name (e.g., "Standard", "Reduced") |
| rate       | DECIMAL(5,4) | NOT NULL      | Tax percentage (e.g., 0.0825 for 8.25%)     |
| is_default | BOOLEAN      | DEFAULT FALSE | Default rate for new products               |

---

### Cart

Temporary shopping cart for active transaction.

| Field          | Type          | Constraints                     | Description             |
| -------------- | ------------- | ------------------------------- | ----------------------- |
| id             | UUID          | PK                              | Unique identifier       |
| terminal_id    | VARCHAR(50)   | NOT NULL                        | POS terminal identifier |
| status         | ENUM          | 'active', 'completed', 'voided' | Cart state              |
| subtotal       | DECIMAL(10,2) | NOT NULL, DEFAULT 0             | Before discounts/tax    |
| discount_total | DECIMAL(10,2) | NOT NULL, DEFAULT 0             | Total discounts applied |
| tax_total      | DECIMAL(10,2) | NOT NULL, DEFAULT 0             | Total tax amount        |
| total          | DECIMAL(10,2) | NOT NULL, DEFAULT 0             | Final total             |
| customer_id    | UUID          | FK → Customer, NULLABLE         | Associated customer     |
| created_at     | TIMESTAMP     | DEFAULT NOW                     | Creation timestamp      |
| completed_at   | TIMESTAMP     | NULLABLE                        | Completion timestamp    |

**State Transitions**:

- active → completed (on payment)
- active → voided (on void)

---

### CartItem

Individual items in a cart.

| Field      | Type          | Constraints         | Description                      |
| ---------- | ------------- | ------------------- | -------------------------------- |
| id         | UUID          | PK                  | Unique identifier                |
| cart_id    | UUID          | FK → Cart           | Parent cart                      |
| product_id | UUID          | FK → Product        | Product being sold               |
| quantity   | INTEGER       | NOT NULL, MIN 1     | Number of units                  |
| unit_price | DECIMAL(10,2) | NOT NULL            | Price at time of sale            |
| discount   | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Item-level discount              |
| line_total | DECIMAL(10,2) | NOT NULL            | quantity × unit_price - discount |

---

### Transaction

Completed sale record (immutable).

| Field              | Type          | Constraints                                         | Description                   |
| ------------------ | ------------- | --------------------------------------------------- | ----------------------------- |
| id                 | UUID          | PK                                                  | Unique identifier             |
| cart_id            | UUID          | FK → Cart                                           | Original cart                 |
| transaction_number | VARCHAR(20)   | UNIQUE, NOT NULL                                    | Human-readable receipt number |
| status             | ENUM          | 'completed', 'voided', 'refunded', 'partial_refund' | Transaction state             |
| subtotal           | DECIMAL(10,2) | NOT NULL                                            | Before discounts/tax          |
| discount_total     | DECIMAL(10,2) | NOT NULL                                            | Total discounts               |
| tax_total          | DECIMAL(10,2) | NOT NULL                                            | Total tax                     |
| total              | DECIMAL(10,2) | NOT NULL                                            | Final amount                  |
| cash               | DECIMAL(10,2) | NULLABLE                                            | Cash tendered (cash payments) |
| change             | DECIMAL(10,2) | NULLABLE                                            | Change given                  |
| customer_id        | UUID          | FK → Customer, NULLABLE                             | Customer if loyalty member    |
| cashier_id         | UUID          | FK → User                                           | Who processed sale            |
| terminal_id        | VARCHAR(50)   | NOT NULL                                            | POS terminal                  |
| completed_at       | TIMESTAMP     | NOT NULL                                            | Sale completion time          |

**State Transitions**: Completed → Voided → Refunded → Partial Refund

---

### Payment

Payment methods applied to a transaction.

| Field          | Type          | Constraints             | Description                  |
| -------------- | ------------- | ----------------------- | ---------------------------- |
| id             | UUID          | PK                      | Unique identifier            |
| transaction_id | UUID          | FK → Transaction        | Associated transaction       |
| method         | ENUM          | 'cash', 'card', 'split' | Payment type                 |
| amount         | DECIMAL(10,2) | NOT NULL                | Payment amount               |
| reference      | VARCHAR(100)  | NULLABLE                | Card auth code, check number |
| card_last_four | VARCHAR(4)    | NULLABLE                | For card payments            |
| card_brand     | VARCHAR(20)   | NULLABLE                | Visa, Mastercard, etc.       |
| created_at     | TIMESTAMP     | DEFAULT NOW             | Payment timestamp            |

---

### Customer

Registered customer for loyalty and history.

| Field          | Type         | Constraints      | Description         |
| -------------- | ------------ | ---------------- | ------------------- |
| id             | UUID         | PK               | Unique identifier   |
| member_number  | VARCHAR(20)  | UNIQUE           | Loyalty card number |
| first_name     | VARCHAR(100) | NOT NULL         | First name          |
| last_name      | VARCHAR(100) | NOT NULL         | Last name           |
| email          | VARCHAR(255) | UNIQUE, NULLABLE | Email address       |
| phone          | VARCHAR(20)  | NULLABLE         | Phone number        |
| loyalty_points | INTEGER      | DEFAULT 0        | Accumulated points  |
| notes          | TEXT         | NULLABLE         | Internal notes      |
| is_active      | BOOLEAN      | DEFAULT TRUE     | Soft delete         |
| created_at     | TIMESTAMP    | DEFAULT NOW      | Registration date   |
| updated_at     | TIMESTAMP    | DEFAULT NOW      | Last update         |

---

### Return

Record of returned items.

| Field                   | Type          | Constraints                        | Description           |
| ----------------------- | ------------- | ---------------------------------- | --------------------- |
| id                      | UUID          | PK                                 | Unique identifier     |
| original_transaction_id | UUID          | FK → Transaction                   | Original sale         |
| return_number           | VARCHAR(20)   | UNIQUE                             | Return receipt number |
| status                  | ENUM          | 'pending', 'completed', 'rejected' | Return state          |
| reason                  | TEXT          | NOT NULL                           | Return reason         |
| refund_amount           | DECIMAL(10,2) | NOT NULL                           | Total refund          |
| refund_method           | ENUM          | 'original_payment', 'store_credit' | Refund type           |
| processed_by            | UUID          | FK → User                          | Who processed         |
| created_at              | TIMESTAMP     | DEFAULT NOW                        | Return request time   |
| completed_at            | TIMESTAMP     | NULLABLE                           | Completion time       |

---

### ReturnItem

Individual items being returned.

| Field               | Type          | Constraints          | Description             |
| ------------------- | ------------- | -------------------- | ----------------------- |
| id                  | UUID          | PK                   | Unique identifier       |
| return_id           | UUID          | FK → Return          | Parent return           |
| transaction_item_id | UUID          | FK → TransactionItem | Original sale item      |
| quantity            | INTEGER       | NOT NULL             | Quantity being returned |
| refund_amount       | DECIMAL(10,2) | NOT NULL             | Refund for this item    |

---

### Discount

Promotional discounts and rules.

| Field                 | Type          | Constraints                   | Description        |
| --------------------- | ------------- | ----------------------------- | ------------------ |
| id                    | UUID          | PK                            | Unique identifier  |
| name                  | VARCHAR(100)  | NOT NULL                      | Promotion name     |
| type                  | ENUM          | 'percentage', 'fixed', 'bogo' | Discount type      |
| value                 | DECIMAL(10,2) | NOT NULL                      | Discount value     |
| minPurchase           | DECIMAL(10,2) | NULLABLE                      | Minimum cart total |
| maxUses               | INTEGER       | NULLABLE                      | Usage limit        |
| uses_count            | INTEGER       | DEFAULT 0                     | Times used         |
| start_date            | DATE          | NOT NULL                      | Promotion start    |
| end_date              | DATE          | NULLABLE                      | Promotion end      |
| is_active             | BOOLEAN       | DEFAULT TRUE                  | Soft toggle        |
| applicable_categories | UUID[]        | NULLABLE                      | Category filter    |
| applicable_products   | UUID[]        | NULLABLE                      | Product filter     |

---

### User

System users (cashiers, managers, admins).

| Field         | Type         | Constraints                   | Description       |
| ------------- | ------------ | ----------------------------- | ----------------- |
| id            | UUID         | PK                            | Unique identifier |
| username      | VARCHAR(50)  | UNIQUE, NOT NULL              | Login username    |
| email         | VARCHAR(255) | UNIQUE, NOT NULL              | Email             |
| password_hash | VARCHAR(255) | NOT NULL                      | Bcrypt hash       |
| role          | ENUM         | 'cashier', 'manager', 'admin' | Access level      |
| is_active     | BOOLEAN      | DEFAULT TRUE                  | Employment status |
| created_at    | TIMESTAMP    | DEFAULT NOW                   | Creation date     |
| last_login    | TIMESTAMP    | NULLABLE                      | Last login time   |

---

### LowStockAlert

Inventory alerts for managers.

| Field         | Type      | Constraints   | Description              |
| ------------- | --------- | ------------- | ------------------------ |
| id            | UUID      | PK            | Unique identifier        |
| product_id    | UUID      | FK → Product  | Product with low stock   |
| current_stock | INTEGER   | NOT NULL      | Stock at alert time      |
| threshold     | INTEGER   | NOT NULL      | Threshold that triggered |
| is_read       | BOOLEAN   | DEFAULT FALSE | Acknowledged flag        |
| created_at    | TIMESTAMP | DEFAULT NOW   | Alert timestamp          |

---

## Relationships

```
Category (1) ──┬── Product (many)
TaxRate (1) ──┬── Product (many)
Customer (1) ──┬── Cart (many)
Customer (1) ──┬── Transaction (many)
User (1) ──┬── Transaction (many)
Terminal (1) ──┬── Cart (many)
Cart (1) ──┬── CartItem (many)
CartItem (many) ──┬ Product (1)
Cart (1) ──┬── Transaction (0..1)
Transaction (1) ──┬── Payment (many)
Transaction (1) ──┬── Return (many)
Discount (1) ──┬── Cart (many, via cart_discounts join table)
```

## Validation Rules

1. **Cart**: Total must equal sum of (line_items + tax - discounts)
2. **Payment**: Sum of payments must equal transaction total
3. **Inventory**: stock_quantity cannot go negative (check before sale)
4. **Discount**: Cannot exceed cart subtotal
5. **Return**: Cannot refund more than original transaction
6. **Customer**: Loyalty points must be non-negative
