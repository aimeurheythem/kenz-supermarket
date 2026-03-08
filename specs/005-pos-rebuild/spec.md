# Feature Specification: Professional POS Page Rebuild

**Feature Branch**: `005-pos-rebuild`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Rebuild the POS page, add all BIG FEATURES that all POS systems use, make it MORE PROFESSIONAL MORE CLEAN, make the total PRICE MORE BIGGER, inspired from a tablet POS layout with client info panel, numeric keypad, product display, cart/ticket area, and action buttons grid"

## Clarifications

### Session 2026-03-04

- Q: Should sensitive actions (void sale, process return, apply large discount) require manager authorization? → A: Yes — manager PIN required for voids, returns, and discounts above a configurable threshold.
- Q: What kinds of manual discounts can a cashier apply and at what scope? → A: Both line-level (per item) and cart-level (whole transaction) discounts, each as either a percentage or fixed amount.
- Q: How should ticket numbers behave — global forever, daily reset, or per-session reset? → A: Daily reset — ticket number resets to 1 at the start of each business day.
- Q: Is there a limit on how many transactions a cashier can hold simultaneously? → A: Maximum 5 per cashier session, with a visual indicator showing usage (e.g., "3/5 holds").
- Q: Should split payment (combining multiple payment methods on one transaction) be supported? → A: Yes — allow combining two or more payment methods on a single transaction (e.g., $30 cash + $20 card).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Professional Multi-Zone POS Layout (Priority: P1)

As a cashier, I want a clean, professional POS screen divided into distinct functional zones (product/search area, cart/ticket area, totals display, and action shortcuts), so that every tool I need is visible at a glance without scrolling or navigating away.

**Why this priority**: The layout is the foundation — every other feature depends on zones being correctly placed and sized. Inspired by the reference image: left panel for client info + product details + numeric keypad, center panel for the cart ticket, right panel for action button grid, and a prominent bottom totals bar.

**Independent Test**: Can be tested by opening the POS page on a 1024×768+ screen and verifying all zones render in their designated positions without overlap or scrolling.

**Acceptance Scenarios**:

1. **Given** a cashier opens the POS page, **When** the page loads, **Then** they see a top header bar (store name/logo, cashier name, date/time), a left panel (client info card, selected product detail card, numeric keypad), a center panel (search/scan input at top, scrollable cart ticket list, subtotal/VAT/discount/total at bottom), a right panel (grid of action shortcut buttons), and a large prominent total price display.
2. **Given** the window is resized to a smaller breakpoint, **When** the layout adjusts, **Then** zones stack or collapse gracefully — the cart and total remain always visible.
3. **Given** a cashier is on the POS page, **When** they look at the total price, **Then** the total is displayed in a very large, bold font (significantly larger than the current design) making it readable from a distance.

---

### User Story 2 — Fast Product Entry via Search, Scan, and Numeric Keypad (Priority: P1)

As a cashier, I want to add products to the cart quickly by scanning a barcode, typing in the search bar, or punching a product code on an on-screen numeric keypad, so that I can handle any checkout scenario without delays.

**Why this priority**: Speed of product entry is the #1 factor in checkout throughput; supporting all three input methods covers hardware-scanner stores, keyboard-based setups, and touchscreen-only terminals.

**Independent Test**: Can be tested by adding 10 products using each method (scan, search, keypad code) and verifying all appear correctly in the cart.

**Acceptance Scenarios**:

1. **Given** the search bar is focused, **When** the cashier types a product name or partial barcode, **Then** matching products appear in a real-time dropdown within 300ms.
2. **Given** the numeric keypad is visible, **When** the cashier types a product code and presses enter/confirm, **Then** the product is added to the cart (or an error toast shown if not found).
3. **Given** a hardware barcode scanner is connected, **When** a barcode is scanned, **Then** the product is instantly added to the cart with an audible/visual confirmation.
4. **Given** a product is already in the cart, **When** the same product is scanned/entered again, **Then** the quantity increments by 1 rather than adding a duplicate line.

---

### User Story 3 — Rich Cart/Ticket Display with Inline Editing (Priority: P1)

As a cashier, I want the cart to look like a professional receipt/ticket showing each line item with product name, reference, quantity, unit price, line total, and inline controls to adjust quantity or remove items, so that I can review and correct orders before finalizing.

**Why this priority**: The cart is the core transaction artifact — accuracy and readability prevent errors and returns.

**Independent Test**: Can be tested by adding 5 items, modifying quantities, removing one, and verifying all totals update correctly.

**Acceptance Scenarios**:

1. **Given** products are in the cart, **When** the cashier views the cart panel, **Then** each line shows: item number, product name, unit price, quantity (editable), line discount (if any), and line total.
2. **Given** a cart line exists, **When** the cashier taps the quantity field and types a new number (or uses +/- buttons), **Then** the line total and cart total update instantly.
3. **Given** a cart line exists, **When** the cashier taps the remove/delete button, **Then** the item is removed with a brief animation and totals recalculate.
4. **Given** items are in the cart, **When** the cashier scrolls the cart, **Then** the header row (column labels) and the totals bar remain pinned and visible.

---

### User Story 4 — Prominent Totals Bar with Subtotal, VAT, Discount, and Grand Total (Priority: P1)

As a cashier, I want a large, always-visible totals bar at the bottom of the cart showing subtotal, VAT amount, discount amount, and a very large grand total, so that I and the customer can always see the running total clearly.

**Why this priority**: The total price visibility is a core user request — it must be significantly bigger than the current design and readable from 2+ meters away (customer-facing).

**Independent Test**: Can be tested by adding items and verifying each line in the totals bar (subtotal, VAT %, discount, total) updates in real time.

**Acceptance Scenarios**:

1. **Given** the cart has items, **When** the totals bar is visible, **Then** it shows Subtotal, VAT (with percentage), Discount (combining automatic promotions + manual line/cart discounts, in accent color), and TOTAL on separate rows.
2. **Given** the TOTAL amount, **When** displayed, **Then** the font size is at least 3× larger than the subtotal text — bold, high-contrast, and the most dominant visual element on the page.
3. **Given** the cart is empty, **When** the totals bar is visible, **Then** all values display as 0.00 in the configured currency.

---

### User Story 5 — Client/Customer Info Panel (Priority: P2)

As a cashier, I want a dedicated client information panel (visible in the left zone) showing the selected customer's name, ID, address, phone, and email, along with quick-action buttons (search customer, edit, add new), so that I can associate transactions with loyalty customers or walk-ins.

**Why this priority**: Customer association enables loyalty tracking, credit sales, and personalized service — a key differentiator for professional POS systems.

**Independent Test**: Can be tested by selecting a customer, verifying their info displays, and completing a sale tied to that customer.

**Acceptance Scenarios**:

1. **Given** no customer is selected, **When** the POS page loads, **Then** the client panel shows "Walk-in Customer" with placeholder fields and a "Search Customer" button.
2. **Given** the cashier clicks "Search Customer", **When** they type a name or phone number, **Then** matching customers appear and the cashier can select one.
3. **Given** a customer is selected, **When** the panel updates, **Then** it displays the customer's name, client number, address, phone, and email.
4. **Given** a customer is selected, **When** the cashier clicks "Clear", **Then** the panel reverts to "Walk-in Customer".

---

### User Story 6 — Selected Product Detail Card (Priority: P2)

As a cashier, I want to see a detail card for the currently selected/last-scanned product showing its image/thumbnail, name, variant info (color/size if applicable), reference number, barcode, price, and current stock level, so that I can confirm I'm adding the correct item.

**Why this priority**: Visual confirmation reduces mis-scans and wrong-item errors — especially important for stores with many similar products.

**Independent Test**: Can be tested by scanning a product and verifying the detail card populates with correct info.

**Acceptance Scenarios**:

1. **Given** a product is scanned or selected, **When** the detail card updates, **Then** it shows: product image (or placeholder), name, variant info, reference number, barcode, selling price, and stock quantity.
2. **Given** a product has low stock (below threshold), **When** displayed, **Then** the stock quantity is highlighted in a warning color.
3. **Given** no product has been selected yet, **When** the POS loads, **Then** the detail card shows an empty placeholder state.

---

### User Story 7 — Action Shortcuts Grid (Priority: P2)

As a cashier, I want a grid of large, clearly labeled shortcut buttons on the right side of the screen for common actions (hold sale, recall held sale, open cash drawer, reprint last receipt, apply discount, void sale, price check, daily report, settings, returns/refunds, gift cards, end shift), so that I can perform any action with a single tap.

**Why this priority**: Professional POS systems provide one-tap access to all operations — this eliminates menu-diving and speeds up edge-case workflows.

**Independent Test**: Can be tested by tapping each shortcut button and verifying it triggers the correct action or opens the correct modal.

**Acceptance Scenarios**:

1. **Given** the action grid is visible, **When** the cashier views it, **Then** they see a grid of at least 12 clearly labeled icon+text buttons covering all common POS actions.
2. **Given** the cashier taps "Hold Sale", **When** items are in the cart, **Then** the current cart is saved/parked and the cart is cleared for a new transaction.
3. **Given** the cashier taps "Recall Sale", **When** held sales exist, **Then** a list of held/parked sales appears and the cashier can select one to restore into the cart.
4. **Given** the cashier taps "Void Sale", **When** a cart has items, **Then** a manager PIN prompt appears, and upon valid PIN entry the cart is cleared and the void is logged with the authorizing manager's ID.
5. **Given** the cashier taps "Reprint Receipt", **When** a previous sale exists, **Then** the last receipt is displayed/printed.

---

### User Story 8 — Hold and Recall Transactions (Priority: P2)

As a cashier, I want to park/hold the current transaction and start a new one, then recall the held transaction later, so that I can handle customers who need to step away or fetch a forgotten item.

**Why this priority**: Hold/recall is a standard POS feature that prevents checkout bottlenecks when customers aren't ready to pay.

**Independent Test**: Can be tested by holding a cart with 3 items, starting a fresh sale, completing it, then recalling the held sale and completing it.

**Acceptance Scenarios**:

1. **Given** a cart with items, **When** the cashier holds the transaction, **Then** the cart is saved with a timestamp and customer (if selected), and the cart resets to empty.
2. **Given** one or more held transactions exist, **When** the cashier taps "Recall", **Then** a list shows each held sale with its item count, total, and time held.
3. **Given** the cashier selects a held transaction, **When** they confirm recall, **Then** the held items are restored to the cart and the hold is removed from the list.
4. **Given** the current cart has items, **When** the cashier tries to recall a held sale, **Then** the system warns that the current cart will be replaced (or offers to merge).
5. **Given** the cashier already has 5 held transactions, **When** they try to hold another, **Then** the system shows a warning that the maximum hold limit is reached and the action is blocked.

---

### User Story 9 — Returns and Refunds (Priority: P2)

As a cashier, I want to process a return/refund by looking up the original transaction and selecting items to return, so that customer returns are handled quickly and inventory is updated.

**Why this priority**: Returns are a daily occurrence in retail — handling them inside the POS avoids workarounds and ensures accurate inventory and financial records.

**Independent Test**: Can be tested by completing a sale, then initiating a return for one of the items and verifying inventory restocks and a refund record is created.

**Acceptance Scenarios**:

1. **Given** the cashier taps "Returns/Refunds", **When** the return flow opens, **Then** they can search for the original sale by receipt number, date, or customer.
2. **Given** an original sale is found, **When** the cashier views it, **Then** they see all line items and can select which items (and quantities) to return.
3. **Given** items are selected for return, **When** the return is confirmed, **Then** the system prompts for a manager PIN, and upon valid entry creates a refund record, restocks the returned items, and shows a return receipt.
4. **Given** a partial return, **When** only some items are returned, **Then** the refund amount reflects only the returned items (including any prorated discounts).

---

### User Story 10 — Ticket Number and Sale Metadata (Priority: P3)

As a store manager, I want each transaction to have a unique, sequential ticket number displayed prominently on the cart/ticket area, so that sales can be easily referenced, looked up, and audited.

**Why this priority**: Ticket numbering is essential for record-keeping, receipts, and customer reference — a basic professional requirement.

**Independent Test**: Can be tested by completing 3 sales and verifying each has a unique incremented ticket number.

**Acceptance Scenarios**:

1. **Given** a new transaction starts, **When** the cart area is displayed, **Then** a ticket number (e.g., "Ticket n° 042") is shown at the top of the cart panel, where the number is sequential within the current business day.
2. **Given** a sale is completed, **When** the next transaction starts, **Then** the ticket number increments by 1.
3. **Given** the receipt is printed, **When** the customer views it, **Then** the ticket number and date appear prominently on the receipt (together forming a unique reference).
4. **Given** a new business day begins, **When** the first transaction starts, **Then** the ticket number resets to 1.

---

### User Story 11 — On-Screen Numeric Keypad (Priority: P3)

As a cashier on a touchscreen terminal, I want an on-screen numeric keypad for entering product codes, quantities, and manual prices, so that I don't need a physical keyboard.

**Why this priority**: Touchscreen-only terminals are common in retail — the numeric keypad (as shown in the reference image) is essential for these setups.

**Independent Test**: Can be tested by entering a product code via the keypad and verifying the product is found and added.

**Acceptance Scenarios**:

1. **Given** the keypad is visible, **When** the cashier taps number buttons, **Then** the digits appear in the keypad display field.
2. **Given** digits are entered, **When** the cashier taps the backspace button, **Then** the last digit is removed.
3. **Given** digits are entered, **When** the cashier taps the clear button, **Then** all digits are cleared.
4. **Given** a valid product code is entered, **When** the cashier taps the confirm/enter button, **Then** the product is looked up and added to the cart.

---

### User Story 12 — Header Bar with Store Branding and Session Info (Priority: P3)

As a store owner, I want the POS header to display the store name/logo, the logged-in cashier's name, and the current date and time, so that the screen looks professional and all printed receipts reference the correct shift.

**Why this priority**: Branding and session context are table-stakes for a professional POS — reinforces store identity and provides audit context.

**Independent Test**: Can be tested by logging in and verifying the header shows the correct store name, cashier name, and live clock.

**Acceptance Scenarios**:

1. **Given** a cashier is logged in, **When** the POS page loads, **Then** the header shows the store name/logo (centered or left), the cashier's full name, and a live clock showing current date and time.
2. **Given** the clock is running, **When** a minute passes, **Then** the displayed time updates in real time.

---

### Edge Cases

- What happens when the cart has more than 50 items? The cart must remain scrollable with sticky headers/totals and no performance degradation.
- What happens when the cashier tries to add a product with zero stock? A clear "out of stock" message is shown and the item is not added.
- What happens during a network or database interruption mid-checkout? The system shows an error, preserves the cart contents, and allows retry.
- What happens when two cashiers hold transactions simultaneously? Each hold is scoped to the cashier's session and does not conflict.
- What happens when a return is attempted for a sale older than the store's return policy? The system warns but allows manager override.
- What happens when the cashier tries to apply a discount that exceeds the item price? The system caps the discount at the item price and warns.
- What happens when a cashier applies a discount above the configured threshold? A manager PIN prompt appears; the discount is only applied after valid authorization.
- What happens when the currency formatting changes (e.g., switching locale)? All displayed prices update immediately without page reload.
- What happens when a cashier applies a partial payment and then cancels? The partial payment is reverted and the full balance is restored.
- What happens when a split payment is applied but the total of all payment entries is less than the grand total? The system blocks finalization and shows the remaining balance that must be covered.

## Requirements *(mandatory)*

### Functional Requirements

#### Layout & Visual Design
- **FR-001**: The POS page MUST be divided into distinct visual zones: header bar, left panel (client info + product detail + numeric keypad), center panel (search input + cart/ticket list + totals), and right panel (action shortcuts grid).
- **FR-002**: The grand total MUST be displayed in a font size at least 3× larger than the subtotal, using bold weight and high contrast — it must be the most visually dominant element on the page.
- **FR-003**: The totals section MUST show Subtotal, VAT (with configurable percentage), Discount (in accent/highlight color), and Grand Total on separate lines.
- **FR-004**: The layout MUST be responsive — on smaller screens, zones should stack vertically with the cart and total always visible.
- **FR-005**: The header bar MUST display: store name/logo, currently logged-in cashier name, and a live date/time clock.

#### Product Entry
- **FR-006**: The system MUST support three product entry methods: barcode scan (hardware scanner), text search (name/barcode), and numeric keypad (product code).
- **FR-007**: The search MUST show real-time results as the cashier types, with results appearing within 300ms.
- **FR-008**: The on-screen numeric keypad MUST include digits 0–9, backspace, clear (C), and confirm/enter buttons, laid out in a standard calculator grid.
- **FR-009**: When a product is scanned or selected, the product detail card in the left panel MUST update to show: product image (or placeholder), name, variant info, reference, barcode, price, and stock quantity.

#### Cart / Ticket
- **FR-010**: Each cart line item MUST display: line number, product name, unit price, quantity (editable via +/- buttons or direct input), line discount, and line total.
- **FR-011**: The cart MUST support inline quantity editing — tapping quantity opens an editable field or uses +/- stepper controls.
- **FR-012**: The cart header (column labels) and totals bar MUST remain pinned/sticky when the cart list scrolls.
- **FR-013**: Each transaction MUST be assigned a unique, sequential ticket number displayed at the top of the cart panel.
- **FR-014**: Removing a cart item MUST trigger a brief exit animation and immediately recalculate totals.

#### Customer Management
- **FR-015**: The client info panel MUST show: customer name, client number, address, phone, and email — or "Walk-in Customer" when no customer is selected.
- **FR-016**: Users MUST be able to search, select, and clear a customer from the client panel.
- **FR-017**: The selected customer MUST be associated with the completed sale record.

#### Payment & Checkout
- **FR-018**: The system MUST support at least four payment methods: cash, card, mobile, and store credit.
- **FR-019**: For cash payments, the system MUST calculate and display change due.
- **FR-019a**: The system MUST support split payment — allowing the cashier to apply two or more payment methods to a single transaction, assigning a specific amount to each method, with the total of all payments equaling or exceeding the grand total.
- **FR-019b**: During split payment, the system MUST display the remaining balance after each partial payment is applied.
- **FR-020**: The checkout flow MUST include a confirmation step before finalizing the transaction.
- **FR-021**: Upon successful checkout, a receipt MUST be generated (showing all payment methods used) and optionally printed or displayed.

#### Hold / Recall
- **FR-022**: Users MUST be able to hold (park) the current transaction, saving all cart items and selected customer.
- **FR-023**: Users MUST be able to view a list of held transactions (showing item count, total, timestamp, and customer) and recall any one into the active cart.
- **FR-024**: Recalling a held transaction when the active cart is not empty MUST prompt a warning/confirmation.
- **FR-024a**: A maximum of 5 held transactions per cashier session MUST be enforced; the POS MUST display a visual indicator of current hold usage (e.g., "3/5 holds") and block further holds when the limit is reached.

#### Manual Discounts
- **FR-025**: Cashiers MUST be able to apply a manual discount at two scopes: line-level (single cart item) and cart-level (entire transaction).
- **FR-026**: Each manual discount MUST support two modes: percentage (e.g., 10%) and fixed amount (e.g., $5.00).
- **FR-027**: Line-level discounts MUST be visible on the cart line item row; cart-level discounts MUST appear as a separate line in the totals section.
- **FR-028**: The totals bar MUST correctly combine automatic promotion savings and manual discounts into the displayed Discount total.

#### Authorization
- **FR-029**: Void sale, process return, and applying a discount above a configurable threshold MUST require manager PIN authorization before the action is executed.
- **FR-030**: The manager PIN prompt MUST log the authorizing manager's identity alongside the authorized action in the audit trail.

#### Returns & Refunds
- **FR-031**: Users MUST be able to initiate a return by searching for the original sale (by receipt number, date, or customer).
- **FR-032**: Users MUST be able to select specific items and quantities from the original sale to return.
- **FR-033**: Processing a return MUST create a refund record, restock returned items, and generate a return receipt.

#### Action Shortcuts
- **FR-034**: The right-side action grid MUST contain at least 12 shortcut buttons for: hold sale, recall sale, void sale, apply discount, reprint receipt, open cash drawer, price check, returns/refunds, daily report, settings, end shift, and gift card/loyalty.
- **FR-035**: Each shortcut button MUST display a clear icon and short label, large enough for touch input (minimum 48×48px tap target).

#### Keyboard Shortcuts
- **FR-036**: The POS page MUST support keyboard shortcuts for common actions: F1–F12 for action grid items, Enter to confirm, Escape to cancel/clear, and arrow keys for cart navigation.

### Key Entities

- **Transaction (Sale)**: A completed or in-progress sale record containing line items, one or more payment entries (method + amount for each), customer reference, cashier, ticket number, timestamp, and status (active, held, completed, voided, returned).
- **Cart Item (Line Item)**: A single product entry in a transaction — product reference, quantity, unit price, line discount (percentage or fixed), line total.
- **Held Transaction**: A temporarily parked transaction preserving all cart items, customer selection, and metadata until recalled.
- **Return/Refund**: A reverse transaction linked to an original sale, containing the returned items, refund amount, and reason.
- **Customer**: A store customer with name, ID number, contact info, and purchase history — can be associated with a transaction.
- **Ticket Number**: A sequential identifier for each transaction within a business day, resetting to 1 daily. Combined with the date, it forms a unique sale reference (e.g., 2026-03-04 #042).

## Assumptions

- The store name/logo is configurable from the existing settings module.
- VAT percentage is configurable from the existing settings module (default 21% based on reference image).
- The numeric keypad is an on-screen UI component — it does not replace hardware keyboard input, which continues to work in parallel.
- Gift card and loyalty features are exposed as action buttons but may initially open placeholder modals indicating "Coming Soon" if the underlying functionality is not yet built.
- The "open cash drawer" action triggers an event that the Electron layer handles for hardware integration; on web it shows a notification.
- Held transactions are stored locally per cashier session and do not persist across application restarts (session-scoped). Maximum 5 held transactions per cashier at any time.
- The discount threshold for requiring manager authorization is configurable in settings (default: any discount > 10% of item price).
- Ticket numbers reset to 1 at the start of each business day; uniqueness across days is ensured by combining ticket number with the transaction date.
- The current barcode scanning, product search, checkout, and receipt infrastructure is preserved and enhanced — this is a UI/UX rebuild, not a backend rewrite.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cashiers can complete a standard 5-item sale (scan → review → pay → receipt) in under 45 seconds.
- **SC-002**: The grand total text is readable from at least 2 meters away on a standard 15" POS display.
- **SC-003**: All three product entry methods (scan, search, keypad) successfully add items to the cart with zero navigation — all are accessible from the main POS view.
- **SC-004**: 100% of the 12+ action shortcuts are reachable with a single tap/click from the main POS screen.
- **SC-005**: Holding and recalling a transaction takes less than 3 seconds each.
- **SC-006**: Processing a return (lookup → select items → confirm) takes under 60 seconds.
- **SC-007**: The POS layout renders correctly on screens from 1024×768 up to 1920×1080 without horizontal scrolling or overlapping zones.
- **SC-008**: 95% of cashiers can locate any action (hold, void, return, discount) within 5 seconds on their first use without training.
- **SC-009**: The page loads and becomes interactive within 2 seconds on a standard terminal.
