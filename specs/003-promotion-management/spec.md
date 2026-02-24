# Feature Specification: Promotion Management System

**Feature Branch**: `003-promotion-management`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: "Promotion Management System – Admin Panel Feature for managing price discounts, quantity discounts, and pack/bundle discounts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View All Promotions (Priority: P1)

As an admin, I want to see a list of all promotions so that I can quickly understand which promotions are currently active, upcoming, or expired.

**Why this priority**: The promotions list page is the foundational view that every other feature builds on. Without it, admins cannot manage promotions at all.

**Independent Test**: Can be fully tested by navigating to the Promotions page and verifying that all created promotions appear in a structured table with correct details.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Promotions page, **When** promotions exist in the system, **Then** all promotions are displayed in a table showing name, type, status, start date, end date, and action buttons.
2. **Given** the admin navigates to the Promotions page, **When** no promotions exist, **Then** an empty state message is displayed with a prompt to create the first promotion.
3. **Given** the promotions table is displayed, **When** a promotion's end date has passed, **Then** the system has automatically marked it as inactive and the status is visually indicated as expired.
4. **Given** the admin views the promotions list, **When** there are many promotions, **Then** the list supports pagination to maintain performance and readability.

---

### User Story 2 - Create a Price Discount Promotion (Priority: P1)

As an admin, I want to create a price discount promotion for a single product so that I can offer customers a percentage or fixed-amount discount on a specific item.

**Why this priority**: Price discounts on individual products are the most common promotion type and represent the core value of the promotion system.

**Independent Test**: Can be fully tested by clicking "Add Promotion", selecting "Price Discount" type, filling required fields, saving, and verifying the promotion appears in the list and applies at checkout.

**Acceptance Scenarios**:

1. **Given** the admin clicks "Add Promotion", **When** the modal opens, **Then** a form is displayed with general information fields (name, type, start date, end date, status) and type-specific fields.
2. **Given** the admin selects "Price Discount" as the type, **When** filling out the form, **Then** fields for product selection (searchable dropdown), discount type (percentage/fixed), and discount value are shown.
3. **Given** the admin enters a percentage discount of 20% on a product priced at $50, **When** saving the promotion, **Then** the system validates all fields and creates the promotion successfully.
4. **Given** a price discount promotion is active, **When** the discounted product is added to a sale at checkout, **Then** the discount is automatically applied and reflected in the total.
5. **Given** the admin enters invalid data (e.g., discount percentage over 100, negative values, end date before start date), **When** attempting to save, **Then** appropriate validation error messages are displayed.

---

### User Story 3 - Create a Quantity Discount Promotion (Priority: P2)

As an admin, I want to create a "Buy X Get Y Free" promotion so that I can incentivize customers to purchase larger quantities.

**Why this priority**: Quantity discounts are a common retail promotion that drives volume sales, making it the second priority after basic price discounts.

**Independent Test**: Can be fully tested by creating a quantity discount (e.g., Buy 2 Get 1 Free), adding the product to a sale with sufficient quantity, and verifying the free items are automatically applied.

**Acceptance Scenarios**:

1. **Given** the admin selects "Quantity Discount" as the promotion type, **When** the form renders, **Then** fields for product selection, buy quantity (X), and free quantity (Y) are shown.
2. **Given** the admin sets Buy 2 Get 1 Free, **When** saving the promotion, **Then** the system calculates and displays the total required quantity (3) and free quantity (1).
3. **Given** a quantity discount promotion is active for "Buy 2 Get 1 Free", **When** a customer adds 3 units of the product at checkout, **Then** 1 unit is automatically made free.
4. **Given** a quantity discount promotion is active for "Buy 2 Get 1 Free", **When** a customer adds 6 units of the product at checkout, **Then** the promotion repeats and 2 units are made free (applies per multiple of the required quantity).
5. **Given** a customer adds fewer than the required quantity (e.g., 1 unit for a Buy 2 Get 1 Free), **When** at checkout, **Then** the promotion is not applied and the customer is charged full price.

---

### User Story 4 - Create a Pack/Bundle Discount Promotion (Priority: P2)

As an admin, I want to bundle multiple products together at a special price so that I can encourage customers to buy complementary products as a package.

**Why this priority**: Bundle pricing drives cross-selling and increases average transaction value, making it a high-value promotion type after individual product discounts.

**Independent Test**: Can be fully tested by creating a bundle with at least 2 products, setting a bundle price, and verifying the bundle price applies when all included products are in the cart.

**Acceptance Scenarios**:

1. **Given** the admin selects "Pack Discount" as the promotion type, **When** the form renders, **Then** fields for multi-product selection (minimum 2 products required) and bundle price are shown.
2. **Given** the admin selects 3 products with individual prices of $10, $15, and $20, **When** setting a bundle price of $35, **Then** the system displays the original total ($45) and savings ($10).
3. **Given** a pack discount promotion is active, **When** a customer adds all bundled products to a sale, **Then** the bundle price is automatically applied instead of individual prices.
4. **Given** a pack discount promotion is active, **When** a customer adds 2 units of each bundled product, **Then** the bundle applies twice (2 complete sets) and the total reflects 2× the bundle price.
5. **Given** the admin tries to create a bundle with fewer than 2 products, **When** attempting to save, **Then** a validation error indicates at least 2 products are required.

---

### User Story 5 - View Promotion Details (Priority: P2)

As an admin, I want to view the full details of any promotion so that I can review what was configured without entering edit mode.

**Why this priority**: Read-only detail views are essential for quick review and auditing of promotion configurations without risk of accidental changes.

**Independent Test**: Can be fully tested by clicking "View Details" on any promotion entry and verifying all promotion-specific information is displayed correctly in a modal.

**Acceptance Scenarios**:

1. **Given** the admin clicks "View Details" on a Price Discount promotion, **When** the details modal opens, **Then** it shows product name, original price, discount type and value, and final price after discount.
2. **Given** the admin clicks "View Details" on a Quantity Discount promotion, **When** the details modal opens, **Then** it shows product name, buy quantity, free quantity, total quantity required, and an effective discount explanation.
3. **Given** the admin clicks "View Details" on a Pack Discount promotion, **When** the details modal opens, **Then** it shows the list of included products, individual prices, original total price, bundle price, and total savings.

---

### User Story 6 - Edit and Delete Promotions (Priority: P3)

As an admin, I want to edit existing promotions or delete ones that are no longer needed so that I can keep the promotion catalog current and accurate.

**Why this priority**: Editing and deleting are management operations that are important but secondary to creation and viewing. Admins need these to maintain data hygiene.

**Independent Test**: Can be fully tested by editing a promotion's fields (e.g., changing discount value), saving, and verifying the update is reflected. Delete can be tested by removing a promotion and verifying it no longer appears.

**Acceptance Scenarios**:

1. **Given** the admin clicks "Edit" on an existing promotion, **When** the edit modal opens, **Then** all fields are pre-populated with the current promotion data.
2. **Given** the admin modifies a promotion's discount value, **When** saving, **Then** the updated value is persisted and reflected in the promotions list.
3. **Given** the admin clicks "Delete" on a promotion, **When** confirming the action, **Then** the promotion is soft-deleted (archived) and no longer appears in the active promotions list, but remains in the database for historical reference.
4. **Given** the admin attempts to delete an active promotion, **When** confirming, **Then** a warning is shown indicating the promotion is currently active before proceeding with the soft delete.

---

### User Story 7 - Checkout Integration (Priority: P1)

As a cashier, I want active promotions to be automatically applied during checkout so that customers receive the correct discounts without manual intervention.

**Why this priority**: Promotions have no value if they don't apply at checkout. This is a core requirement that makes the entire feature meaningful.

**Independent Test**: Can be fully tested by creating promotions of each type, adding the relevant products to a sale, and verifying discounts are correctly calculated in the total.

**Acceptance Scenarios**:

1. **Given** an active price discount exists for a product, **When** that product is scanned/added at checkout, **Then** the discounted price is automatically applied, the line item shows the original price struck through, the new price, and a promotion name badge.
2. **Given** an active "Buy 2 Get 1 Free" promotion exists, **When** 3 units of the product are added at checkout, **Then** the system applies the free unit, adjusts the total, and annotates the line item with the promotion name and free-unit indicator.
3. **Given** an active bundle promotion exists, **When** all bundled products are present in the sale, **Then** the bundle price replaces the sum of individual prices.
4. **Given** multiple promotions could apply to a sale, **When** calculating the total, **Then** the system applies the most beneficial promotion for the customer (non-stackable by default).
5. **Given** a promotion's date range has expired, **When** products are added at checkout, **Then** the expired promotion is not applied.

---

### Edge Cases

- What happens when a product is part of multiple active promotions simultaneously? The most beneficial promotion for the customer is applied (non-stackable by default).
- What happens when a promotion's start date is in the future? The promotion is stored but not applied at checkout until the start date is reached.
- What happens when a product included in a bundle promotion is out of stock? The bundle promotion cannot be applied; individual pricing is used for available items.
- What happens when an admin edits a promotion that is currently active and being used in a sale? Changes take effect for new sales only; in-progress sales retain the original promotion terms.
- What happens when the discount value results in a price of zero or negative? The system enforces a minimum price of zero (free item); negative prices are not allowed.
- What happens when the bundle price is set higher than the sum of individual prices? A validation warning is shown to the admin, as this would not represent a discount.
- What happens when a customer has some but not all products of a bundle in the cart? The bundle promotion does not apply; each product is charged at its individual price. Partial bundles receive no discount.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated "Promotions" page in the Admin Panel that lists all promotions in a structured table format.
- **FR-002**: System MUST display the following for each promotion entry: name/title, promotion type, status (Active/Inactive), start date, end date, and action buttons (View Details, Edit, Delete).
- **FR-003**: System MUST provide an "Add Promotion" button that opens a creation modal with general information fields (name, type, start/end date, status).
- **FR-004**: System MUST support three promotion types: Price Discount (single product), Quantity Discount (Buy X Get Y Free), and Pack Discount (bundle pricing).
- **FR-005**: For Price Discount, the system MUST allow selection of a single product via searchable dropdown, choice of discount type (percentage or fixed amount), discount value input, and an optional maximum discount limit.
- **FR-006**: For Quantity Discount, the system MUST allow product selection, buy quantity (X) input, and free quantity (Y) input, and MUST automatically calculate total required quantity and free quantity logic. The promotion MUST apply repeatedly per multiple of the required quantity (e.g., Buy 2 Get 1 Free with 6 units = 2 free units).
- **FR-007**: For Pack Discount, the system MUST allow multi-product selection (minimum 2 products), bundle price input, and optionally display original total price and savings amount. The bundle MUST apply per complete set of all included products (one of each); if multiples of each product are present, the bundle repeats accordingly.
- **FR-008**: System MUST validate all promotion form inputs before saving, including: required field checks, date range validity (end date after start date), numeric value constraints (no negative values, percentage ≤ 100), and minimum product count for bundles.
- **FR-009**: System MUST provide a "View Details" modal per promotion that displays type-specific information (price discount details, quantity discount breakdown, or bundle composition and savings).
- **FR-010**: System MUST allow admins to edit existing promotions, pre-populating the form with current data.
- **FR-011**: System MUST allow admins to delete promotions via soft delete — marking the promotion as archived and hiding it from the active promotions list while retaining the record for historical transaction references, reporting, and auditing. A confirmation prompt MUST be shown, with an additional warning when deleting active promotions.
- **FR-012**: System MUST automatically apply active, valid (within date range) promotions during checkout calculations.
- **FR-013**: System MUST apply only one promotion per product/transaction when multiple promotions overlap, selecting the most beneficial for the customer.
- **FR-014**: System MUST NOT apply promotions outside their defined start/end date range.
- **FR-015**: System MUST use visual badges or labels to distinguish between different promotion types in the list view.
- **FR-016**: System MUST store all promotion rules and configurations in the database, making the logic backend-driven.
- **FR-017**: System MUST display appropriate error messages with clear guidance when form validation fails.
- **FR-018**: System MUST support the Promotions page design to be consistent with existing Admin Panel pages (layout, spacing, typography, styling conventions).
- **FR-019**: When a promotion is applied at checkout, the POS screen MUST display a line-item annotation showing the original price struck through, the discounted/new price, and a badge with the promotion name.
- **FR-020**: System MUST automatically mark promotions as inactive when their end date passes. Admins can manually deactivate a promotion early, but reactivation requires extending the end date to a future date.

### Key Entities

- **Promotion**: The core entity representing a promotion campaign. Key attributes: name, type, status (Active/Inactive — auto-transitions to Inactive when end date passes), start date, end date, creation timestamp, deleted_at (soft delete timestamp, null when active). Status lifecycle: Created → Active (when start date reached and status set to Active) → Inactive (auto-deactivated when end date passes, or manually deactivated by admin) → Archived (soft-deleted, hidden from list but retained for history).
- **Price Discount Rule**: Configuration specific to price discount promotions. Key attributes: linked product, discount type (percentage/fixed), discount value, optional maximum discount cap. Related to a single Promotion.
- **Quantity Discount Rule**: Configuration specific to quantity discount promotions. Key attributes: linked product, buy quantity (X), free quantity (Y), computed total quantity. Related to a single Promotion.
- **Pack Discount Rule**: Configuration specific to pack/bundle promotions. Key attributes: list of included products, bundle price, computed original total, computed savings. Related to a single Promotion.
- **Product** (existing entity): Referenced by promotion rules for discount application. Key relationship: a product can be part of multiple promotions but only one applies at checkout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can create any of the three promotion types in under 2 minutes from start to finish.
- **SC-002**: All active promotions are correctly applied at checkout with 100% accuracy (correct discount amount calculated).
- **SC-003**: The Promotions page loads and displays up to 100 promotions within 2 seconds.
- **SC-004**: 95% of admin users can successfully create a promotion on their first attempt without requiring help documentation.
- **SC-005**: Form validation catches 100% of invalid inputs (negative values, invalid date ranges, missing required fields) before submission.
- **SC-006**: Promotion details modal accurately displays all type-specific information matching the stored promotion configuration.
- **SC-007**: Expired promotions are never applied at checkout (0% false application rate).
- **SC-008**: The Promotions page is visually indistinguishable in design quality and consistency from other existing admin pages.

## Clarifications

### Session 2026-02-24

- Q: Should quantity discount (Buy X Get Y Free) apply multiple times when customer buys multiples of the required quantity? → A: Repeating — promotion applies multiple times per transaction (e.g., 6 units with Buy 2 Get 1 Free = 2 free units).
- Q: How should applied promotions be displayed to the cashier on the POS screen? → A: Line-item annotation — discounted line shows original price struck through, new price, and promotion name badge.
- Q: Should promotions be automatically deactivated when their end date passes? → A: Auto-deactivate — system automatically marks promotions as inactive when end date passes.
- Q: For Pack/Bundle Discount, should the bundle apply per complete set (repeating) or only once? → A: One of each — bundle applies per complete set of all included products; repeats if multiples of each product are present in the cart.
- Q: Should promotion deletion be soft delete (archive) or hard delete (permanent removal)? → A: Soft delete — mark as archived/deleted, hide from active list, retain for historical transaction references.

## Assumptions

- The platform already has a product catalog with searchable products available for selection in promotion forms.
- The existing Admin Panel design system (layout, components, typography, spacing) is well-established and reusable for the new Promotions page.
- Promotions are non-stackable by default — only one promotion applies per product in a single transaction. The most beneficial promotion for the customer is selected automatically.
- Promotion changes (edits/deletes) apply to new transactions only; in-progress sales retain the original promotion terms at the time of sale start.
- Data retention: promotions are soft-deleted (archived) rather than permanently removed, preserving historical transaction references for reporting and auditing.
- The checkout system already exists and exposes an extension point where promotion discount logic can be integrated.
- Currency and pricing follow the application's existing formatting and precision standards.
