# BizFlow Dealer-Ledger Migration Design

Date: 2026-04-03
Branch: migration/dealer-ledger-flow (backend + frontend)
Status: Draft for migration execution

## 1) Purpose

This document describes:

- what changed from the current invoice flow to the dealer-first flow,
- what is being migrated in this branch,
- a brief summary of the app flow,
- and end-to-end user journeys after migration.

## 2) Change Summary (What Changed)

### 2.1 Previous Flow

- Dealers were optional in billing flow.
- Generate Bill allowed manual party details (name/address/phone/gst).
- Dealer list in Generate Bill acted like suggestions.
- Invoices were centered around party text fields.

### 2.2 New Direction

- Dealers become first-class records per tenant.
- Generate Bill becomes dealer-first (strict dealer selection before submit).
- Dealer list becomes a dedicated screen with bill-type tabs:
  - stock_out (customers)
  - stock_in (suppliers)
- Dealer cards become clickable and open Dealer Profile.
- Dealer Profile includes:
  - dealer master details
  - invoice history
  - ledger summary and timeline (separate by invoice type)

### 2.3 Data and Contract Direction

- Invoices will be linked to dealers via dealer_id.
- Existing invoice party fields remain as immutable snapshot fields for print/audit stability.
- Ledger is separated by bill type:
  - stock_out -> receivable statement
  - stock_in -> payable statement

## 3) Scope of This Migration

### 3.1 Backend

- Add/expand dealer APIs for list, detail, update, history, and ledger.
- Update invoice creation to require dealer_id.
- Keep payment and inventory reconciliation behavior unchanged.
- Support hard cutover migration for invoice dealer linkage.

### 3.2 Frontend

- Add new Dealers screen in navigation.
- Add Dealer Profile screen.
- Convert Generate Bill to strict dealer selection flow.
- Keep invoice template rendering stable via snapshot fields.

## 4) Target App Flow (Brief)

1. User logs in to tenant workspace.
2. User opens Dealers screen and manages suppliers/customers by type.
3. User clicks a dealer card to view Dealer Profile (details, history, ledger).
4. User opens Generate Bill, selects bill type, selects existing dealer, adds items, and submits invoice.
5. System creates invoice linked to dealer_id and stores immutable party snapshot fields.
6. User opens View Bills for invoice list, payment updates, and print.
7. Dealer ledger reflects invoice and payment transactions chronologically.

## 5) User Journeys

### Journey A: Add Dealer Then Bill

1. Go to Dealers.
2. Pick tab (stock_out or stock_in).
3. Add dealer details.
4. Open Generate Bill.
5. Select matching bill type.
6. Select dealer from list.
7. Add items and submit.
8. View generated invoice.

Expected result:

- bill is created only when a dealer is selected,
- invoice links to dealer_id,
- snapshot fields remain stable for future print.

### Journey B: Dealer Profile and Ledger Review

1. Go to Dealers.
2. Click a dealer card.
3. See profile details and edit if needed.
4. Review invoice history for that dealer.
5. Review ledger summary and transaction timeline.

Expected result:

- user can inspect pending and paid movement by dealer,
- statements remain separated by invoice type.

### Journey C: Payment Follow-Up

1. Go to View Bills.
2. Open invoice and add payment.
3. System updates pending amount and bill state.
4. Dealer ledger reflects new payment row and updated balance.

Expected result:

- payment lifecycle (pending -> partial -> paid) remains unchanged,
- dealer statement stays consistent with invoice and payment records.

## 6) Migration Strategy

1. Prepare DB migration for dealer_id linkage on invoices.
2. Backfill dealer_id from existing invoice party snapshots.
3. Validate no null dealer_id remains.
4. Enforce constraints (dealer_id required).
5. Deploy backend API changes.
6. Deploy frontend Dealers and dealer-first billing flow.

## 7) Risks and Guardrails

- Risk: duplicate dealer records during backfill.
  - Guardrail: deduplicate by tenant + invoice_type + name + phone before enforce.

- Risk: historical invoice display drift.
  - Guardrail: keep immutable snapshot fields on invoice.

- Risk: broken billing flow if no dealer exists.
  - Guardrail: explicit empty-state CTA from Generate Bill to Dealers screen.

## 8) Definition of Done

- Dealers screen exists with type tabs and clickable cards.
- Dealer Profile exists with details, history, and ledger.
- Generate Bill requires dealer selection before submit.
- Invoice create API requires dealer_id.
- Backfilled invoices are linked and constraints enforced.
- Payment and inventory behavior remain regression-safe.
