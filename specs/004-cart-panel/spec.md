# Feature Specification: Cart Panel Redesign

**Feature Branch**: `004-cart-panel`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Build a cart panel redesign: header with searchable customer select, body with scrollable current cart (80%) and subtotal/promo savings (20%), footer with total price, payment method options (cash, e-pay, card, credit), and complete buy button always visible. Ticket-style design."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - View and Manage Cart Items (Priority: P1)

A cashier scans or adds products during a sale. The cart panel displays all added items in a scrollable list occupying the upper portion (~80%) of the panel body. Each cart item shows the product name, unit price, quantity, and line total. When items exceed the visible area, the cashier scrolls vertically to see the full list. The cashier can remove individual items from the cart.

**Why this priority**: The core purpose of the cart panel is to give the cashier a clear, real-time view of what the customer is purchasing. Without this, no checkout can happen.

**Independent Test**: Can be fully tested by adding multiple products and verifying they appear in the scrollable list with correct details, and that removing an item updates the list immediately.

**Acceptance Scenarios**:

1. **Given** an empty cart, **When** a product is added, **Then** it appears in the cart list showing product name, unit price, quantity (1), and line total.
2. **Given** a cart with items, **When** the same product is added again, **Then** the quantity increments and the line total updates.
3. **Given** a cart with more items than fit in the visible area, **When** the cashier scrolls, **Then** all remaining items are accessible.
4. **Given** a cart with items, **When** the cashier removes an item, **Then** it disappears from the list and totals update.
5. **Given** an empty cart, **When** no products have been added, **Then** the cart area displays an empty state message (e.g., "No items yet").
6. **Given** a cart item with quantity > 1, **When** the cashier presses the − button, **Then** the quantity decrements by 1 and the line total updates.
7. **Given** a cart item with quantity 1, **When** the cashier presses the − button, **Then** the item is removed from the cart.
8. **Given** a cart item, **When** the cashier presses the + button, **Then** the quantity increments by 1 and the line total updates.

---

### User Story 2 - Complete a Purchase with Payment Method Selection (Priority: P1)

After adding items to the cart, the cashier selects one of four payment methods — cash, e-pay, card, or credit — displayed as selectable options at the bottom of the panel. The "Complete Purchase" button is always visible (even with an empty cart, though disabled or showing an appropriate state). Once a payment method is chosen and the button is pressed, the sale is processed.

**Why this priority**: Completing a sale is the fundamental business transaction. The payment method selection and checkout button are critical to closing every sale.

**Independent Test**: Can be fully tested by adding items, selecting each payment method, pressing the complete button, and verifying the sale is processed correctly for each method.

**Acceptance Scenarios**:

1. **Given** an empty cart, **When** the panel loads, **Then** the "Complete Purchase" button is visible but disabled (or shows a visual cue that it cannot be pressed).
2. **Given** a cart with items, **When** the cashier views the footer, **Then** cash is pre-selected as the default payment method, and the total is displayed in a large, prominent font.
3. **Given** a cart with items, **When** the cashier selects "credit" as payment method, **Then** the selection highlights "credit" and the sale will be recorded as credit (unpaid/on-account) for the linked customer.
4. **Given** a cart with items and a payment method selected, **When** the cashier presses "Complete Purchase", **Then** the sale is finalized and the cart is cleared.

---

### User Story 3 - Search and Select a Customer (Priority: P2)

The cart panel header contains a searchable customer selector. The cashier types a name or phone number to filter the customer list and selects one. This links the sale to that customer, which is especially important for credit sales and loyalty tracking.

**Why this priority**: Customer linking is essential for credit sales (buying on account) and loyalty point tracking, but a sale can proceed without a customer for cash transactions.

**Independent Test**: Can be fully tested by typing a customer name/phone in the search field, verifying the filtered results appear, selecting a customer, and confirming the selection is displayed in the header.

**Acceptance Scenarios**:

1. **Given** the cart panel header, **When** the cashier clicks the customer select field, **Then** a searchable dropdown appears showing available customers.
2. **Given** the customer dropdown is open, **When** the cashier types a partial name or phone number, **Then** the list filters in real-time to show matching customers.
3. **Given** a filtered customer list, **When** the cashier selects a customer, **Then** the selected customer's name is displayed in the header and the sale is linked to that customer.
4. **Given** a customer is selected, **When** the cashier clears the selection, **Then** the field returns to its default placeholder state and the sale is unlinked from any customer.
5. **Given** no customer is selected and payment method is "credit", **When** the cashier attempts to complete the purchase, **Then** the system prevents checkout and prompts to select a customer first (credit requires a known customer).

---

### User Story 4 - View Subtotal, Promotional Savings, and Grand Total (Priority: P2)

The bottom portion (~20%) of the panel body displays a financial summary: the subtotal of all cart items, any promotional savings/discounts applied, and the difference. The footer section below shows the grand total in a large, prominent font. This ticket-style layout gives the cashier a clear financial picture at a glance.

**Why this priority**: Financial transparency ensures pricing accuracy and builds customer trust, and displaying promotions motivates upselling.

**Independent Test**: Can be fully tested by adding items with known prices, applying a promotion, and verifying the subtotal, savings, and total values are all correctly calculated and displayed.

**Acceptance Scenarios**:

1. **Given** a cart with items, **When** the cashier views the summary section, **Then** the subtotal (sum of all line totals) is displayed.
2. **Given** a cart with items that qualify for a promotion, **When** the promotion is applied, **Then** the savings amount is displayed below the subtotal with a clear label.
3. **Given** a cart with no applicable promotions, **When** the cashier views the summary section, **Then** no savings line is shown (clean, uncluttered view).
4. **Given** a cart with items and promotions, **When** the cashier views the footer, **Then** the grand total (subtotal minus savings) is displayed in a large, prominent font.

---

### User Story 5 - Clear Entire Cart (Priority: P3)

The cashier can clear all items from the cart at once, resetting the panel to its empty state. This covers scenarios like a customer changing their mind or starting over.

**Why this priority**: A convenience feature that improves cashier efficiency but is not critical for basic transactions.

**Independent Test**: Can be fully tested by adding items, pressing a clear/trash action, confirming the cart is emptied, and verifying totals reset to zero.

**Acceptance Scenarios**:

1. **Given** a cart with items, **When** the cashier initiates "clear cart", **Then** a confirmation prompt appears to prevent accidental clearing.
2. **Given** the confirmation prompt is shown, **When** the cashier confirms, **Then** all items are removed and the panel returns to its empty state.
3. **Given** the confirmation prompt is shown, **When** the cashier cancels, **Then** the cart remains unchanged.

---

### Edge Cases

- What happens when a product with zero stock is in the cart and the cashier tries to check out? The system must show a stock error and prevent the sale.
- What happens when "credit" is selected but no customer is linked? The system must block checkout and prompt the cashier to select a customer.
- What happens when the customer list is empty or the search yields no results? The dropdown must show a "No customers found" message.
- What happens when the cart has a single item and it is removed? The panel returns to the empty state and the complete button becomes disabled.
- What happens when a very long product name is in the cart? The name must be truncated with ellipsis to avoid layout overflow.
- What happens when the cart contains dozens of items? The scrollable area handles large lists smoothly without performance degradation.
- What happens when the cashier presses + but the item is already at maximum available stock? The + button is disabled and a brief toast notification informs the cashier.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The cart panel MUST be structured into three distinct vertical sections: header (customer selector), body (cart items list + financial summary), and footer (total, payment methods, complete button).
- **FR-002**: The header MUST contain a searchable customer selector that filters customers by name or phone number as the cashier types.
- **FR-003**: The body MUST be split into two sub-sections: the upper portion (~80% of body) for cart items, and the lower portion (~20% of body) for the financial summary (subtotal, savings).
- **FR-004**: The cart items section MUST be independently scrollable when items overflow the visible area.
- **FR-005**: Each cart item row MUST display: product name, unit price, quantity (with inline +/− buttons for adjustment), and line total. If a promotion applies to the item, a small discount label/badge (e.g., "−15%" or "−$2.00") MUST be shown beneath or beside the line total.
- **FR-006**: Each cart item row MUST provide an action to remove that item from the cart.
- **FR-018**: Each cart item row MUST provide +/− buttons to increment or decrement quantity. Decrementing to zero MUST remove the item from the cart.
- **FR-019**: The + button MUST be disabled when the cart item quantity equals the product's available stock. A brief toast notification MUST inform the cashier that maximum stock has been reached.
- **FR-020**: Cart item rows with an applied promotion MUST display a small discount label/badge showing the savings amount or percentage. Items without promotions MUST NOT show any discount indicator.
- **FR-021**: The cart panel MUST support keyboard shortcuts: Enter to trigger "Complete Purchase" (when cart is non-empty), and Escape to clear the customer selection.
- **FR-007**: The financial summary section MUST display the subtotal (sum of all line totals).
- **FR-008**: The financial summary section MUST display promotional savings when applicable, and hide the savings line when no promotions apply.
- **FR-009**: The footer MUST display the grand total (subtotal minus savings) in a large, prominent font.
- **FR-010**: The footer MUST display four mutually exclusive payment method options: cash, e-pay, card, and credit, rendered as icon + label pill/chip buttons in a 2×2 grid layout for compact, touch-friendly selection.
- **FR-011**: Cash MUST be the default pre-selected payment method.
- **FR-012**: The "Complete Purchase" button MUST be visible at all times (from initial load), but MUST be disabled when the cart is empty.
- **FR-013**: When "credit" is selected as payment method, the system MUST require a customer to be selected before allowing checkout.
- **FR-014**: The cart panel MUST provide a "clear all items" action with a confirmation step to prevent accidental clearing.
- **FR-015**: The cart panel MUST follow a ticket/receipt-style visual design — clean, vertically stacked, with clear section separators.
- **FR-016**: When the cart is empty, the cart items area MUST show an empty state visual/message (e.g., icon + "No items yet").
- **FR-017**: Product names that exceed the available width MUST be truncated with ellipsis.

### Key Entities

- **Cart Item**: Represents a product added to the current sale. Key attributes: product reference, quantity, unit price, discount, line total.
- **Customer**: An optional entity linked to the sale. Key attributes: name, phone, email, loyalty points, total debt. Especially relevant for credit sales.
- **Promotion Application Result**: Represents calculated promotional discounts. Key attributes: list of item-level discounts, bundle discounts, total savings amount.
- **Payment Method**: One of four accepted types — cash, e-pay, card, or credit — determining how the sale is settled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cashiers can complete a full sale (add items, select customer, choose payment, checkout) in under 30 seconds for a 5-item cart.
- **SC-002**: 100% of cart items are visible via scrolling when the cart exceeds the visible area.
- **SC-003**: Customer search returns filtered results within 1 second of typing.
- **SC-004**: The grand total updates instantly (< 200ms perceived) when items are added, removed, or promotions change.
- **SC-005**: 95% of cashiers can identify the total amount and payment method at a glance without scrolling the footer area.
- **SC-006**: Zero accidental cart clears occur due to the required confirmation step.
- **SC-007**: Credit sales are blocked 100% of the time when no customer is selected.

## Clarifications

### Session 2026-02-26

- Q: Can the cashier adjust item quantity from the cart panel? → A: Yes — show +/− buttons on each cart item row to adjust quantity inline.
- Q: How should the four payment method options be presented visually? → A: Icon + label pill/chip buttons in a 2×2 grid (compact, touch-friendly).
- Q: What should happen when incrementing quantity would exceed available stock? → A: Disable the + button when quantity equals available stock and show a brief toast notification.
- Q: Should individual cart item rows show their applied promotion/discount? → A: Yes — show a small discount label/badge on discounted items (e.g., "−15%" or "−$2.00" beneath the line total).
- Q: Should the cart panel support keyboard shortcuts for key actions? → A: Yes — Enter to complete purchase, Escape to deselect customer.

## Assumptions

- The existing customer list is pre-loaded and available for search/select without additional server calls (client-side data).
- Promotional savings are computed externally (by the promotion engine) and passed into the cart panel as a result object.
- The panel width is fixed at approximately 340px, consistent with the existing POS layout.
- The "e-pay" option maps to the existing "mobile" payment method type in the data model.
- The "Complete Purchase" flow triggers the existing checkout simulation and receipt logic already present in the POS page.
- Cart state management (add, remove, clear, quantities) is handled by the existing sale store — the cart panel is a presentation layer.
