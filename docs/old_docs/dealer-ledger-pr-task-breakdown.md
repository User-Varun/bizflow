# BizFlow Dealer-Ledger PR Task Breakdown

Date: 2026-04-03
Branch: migration/dealer-ledger-flow
Reference: dealer-ledger-migration-design.md

## How to Use

- Each phase is a PR-sized unit.
- Do not start next phase until exit criteria of current phase is met.
- Keep API and UI checkboxes separate for clear review.

## Phase 1 - Dealer API Foundation

PR Goal: Stabilize dealer CRUD and listing contract for UI consumption.

### API

- [ ] Add dealer list pagination and search query params.
- [ ] Add dealer detail endpoint by dealer id.
- [ ] Add dealer update endpoint (name/address/phone/gst).
- [ ] Add strict tenant ownership validation in all dealer handlers.
- [ ] Add invoice_type validation in all dealer endpoints.
- [ ] Add response envelope consistency (status, result, meta).

### UI

- [ ] No UI changes in this PR.

### Files

- backend/src/controllers/dealerController.js
- backend/src/routes/dealerRoutes.js
- backend/src/models/dealerModel.js

### Exit Criteria

- [ ] Dealer APIs are usable for list screen and profile screen.
- [ ] Postman/manual tests pass for list, detail, update.

## Phase 2 - Dealers List Screen + Navigation

PR Goal: Add first-class Dealers screen with tabbed cards and add flow.

### API

- [ ] Integrate Phase 1 list endpoint in frontend data layer.

### UI

- [ ] Add Dealers route in app router.
- [ ] Add Dealers nav item in navbar.
- [ ] Implement two tabs: stock_out and stock_in.
- [ ] Implement search input and pagination controls.
- [ ] Implement dealer cards with key summary fields.
- [ ] Implement add dealer form/modal with validation.
- [ ] Add empty state and create-dealer CTA.

### Files

- frontend/src/App.jsx
- frontend/src/ui/Navbar.jsx
- frontend/src/features/Dealers.jsx
- frontend/src/styles/dealers.css

### Exit Criteria

- [ ] Dealers screen is reachable from nav.
- [ ] Add dealer works and list refreshes correctly.
- [ ] Tab switching fetches correct dealer type.

## Phase 3 - Dealer Profile Screen (Details + Invoice History)

PR Goal: Click dealer card to open profile and show dealer-specific invoice history.

### API

- [ ] Add dealer invoice history endpoint with pagination.
- [ ] Add invoice history filters (date range, bill_state).
- [ ] Return dealer master details and history metadata in profile responses.

### UI

- [ ] Implement dealer profile route with dealer id.
- [ ] Make dealer cards clickable to profile route.
- [ ] Show profile header (name, phone, gst, address).
- [ ] Add edit dealer action in profile view.
- [ ] Render invoice history list/cards with pagination.

### Files

- backend/src/controllers/dealerController.js
- backend/src/routes/dealerRoutes.js
- frontend/src/features/DealerProfile.jsx
- frontend/src/features/Dealers.jsx
- frontend/src/styles/dealerProfile.css

### Exit Criteria

- [ ] Clicking any dealer card opens correct profile.
- [ ] Invoice history matches view bills records.

## Phase 4 - Dealer Ledger APIs + Profile Ledger UI

PR Goal: Add dealer ledger summary and chronological statement by invoice type.

### API

- [ ] Add dealer ledger summary endpoint.
- [ ] Add dealer ledger statement endpoint (invoice rows + payment rows).
- [ ] Add running balance calculation logic by invoice type.
- [ ] Ensure stock_out and stock_in ledgers stay separated.
- [ ] Add server-side pagination for statement rows.

### UI

- [ ] Add ledger summary cards in dealer profile.
- [ ] Add ledger statement timeline/table section.
- [ ] Add filter controls for statement (date range and bill_state).
- [ ] Add loading, empty, and error states for ledger blocks.

### Files

- backend/src/controllers/dealerController.js
- backend/src/routes/dealerRoutes.js
- backend/src/models/paymentModel.js
- frontend/src/features/DealerProfile.jsx
- frontend/src/styles/dealerProfile.css

### Exit Criteria

- [ ] Ledger summary reconciles with invoice pending/payment totals.
- [ ] Statement rows are chronological and reproducible.

## Phase 5 - Invoice Contract: dealer_id Required

PR Goal: Make invoices dealer-linked while preserving immutable snapshots.

### API

- [ ] Add dealer_id to invoice model/contract.
- [ ] Require dealer_id in generate invoice payload.
- [ ] Validate dealer ownership and invoice_type match before create.
- [ ] Snapshot dealer fields to invoice at write time.
- [ ] Keep existing payment/inventory calculation logic unchanged.

### UI

- [ ] Update invoice submission payload shape to include dealer_id.
- [ ] Preserve snapshot-based display behavior in invoice views.

### Files

- backend/src/models/invoiceModel.js
- backend/src/controllers/generateInvoiceController.js
- frontend/src/features/generateBill/BillDetails.jsx
- frontend/src/ui/InvoiceTemplate.jsx

### Exit Criteria

- [ ] Invoice create fails without dealer_id.
- [ ] Invoice create succeeds with dealer_id for both bill types.

## Phase 6 - Generate Bill Strict Dealer Selection Flow

PR Goal: Force dealer selection before bill creation; remove manual party entry workflow.

### API

- [ ] Keep generate endpoint error messages explicit for missing/invalid dealer_id.

### UI

- [ ] Remove free-form party input dependency from generate-bill flow.
- [ ] Add required dealer selector control in Bill Details.
- [ ] Block submit until dealer selected.
- [ ] Show CTA to open Dealers screen when no dealers exist.
- [ ] Keep item selection and pricing workflow unchanged.

### Files

- frontend/src/features/generateBill/BillDetails.jsx
- frontend/src/features/generateBill/stores/billContextStore.js
- frontend/src/features/generateBill/GenerateBill.jsx

### Exit Criteria

- [ ] User cannot generate invoice without dealer selection.
- [ ] Existing item and payment UX still works.

## Phase 7 - View Bills Dealer Integration

PR Goal: Connect bills listing and cards to dealer context.

### API

- [ ] Add dealer filter support in invoices list endpoint.
- [ ] Include dealer reference in list/detail responses.

### UI

- [ ] Add dealer filter in View Bills screen.
- [ ] Add link from bill card to dealer profile.
- [ ] Keep existing bill state/date/edit behavior unchanged.

### Files

- backend/src/controllers/viewInvoiesController.js
- backend/src/routes/viewInvoicesRotues.js
- frontend/src/features/ViewBills.jsx
- frontend/src/ui/BillViewCard.jsx

### Exit Criteria

- [ ] User can filter bills by dealer.
- [ ] Card-to-profile navigation works.

## Phase 8 - Migration + Rollout + Hard Cutover

PR Goal: Backfill old invoices and enforce dealer linkage constraints.

### API

- [ ] Add migration script/backfill procedure for invoice dealer_id.
- [ ] Deduplicate legacy dealer records during backfill.
- [ ] Enforce non-null dealer_id and FK constraints post-backfill.
- [ ] Add verification SQL checks for tenant consistency.

### UI

- [ ] No functional UI changes in this PR.
- [ ] Add release note for dealer-first billing behavior.

### Files

- backend/server.js
- backend/src/models/invoiceModel.js
- changes_log.md

### Exit Criteria

- [ ] All invoices linked to dealer_id.
- [ ] No regression in payments, inventory, invoice print.
- [ ] Deployment order followed: migration -> backend -> frontend.

## QA Matrix (Cross-Phase)

- [ ] Create dealer in stock_out and stock_in tabs.
- [ ] Generate bill with selected dealer in both bill types.
- [ ] Add payment and verify ledger timeline update.
- [ ] Edit dealer details and verify old invoice print remains unchanged.
- [ ] Validate pagination, search, and tenant isolation in all dealer APIs.
