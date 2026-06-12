# BizFlow Change Log

## 2026-04-12 - Dashboard Drilldowns, Date Filters, Out-of-Stock Insights, and Bill-State Creation Fix

### Requested Changes

- Make dashboard KPI cards clearly clickable and open relevant detailed pages.
- Show out-of-stock insight and allow direct drilldown to matching inventory cards.
- Add dashboard insight filters for `Today`, `This Month`, `This Year`, and custom `From/To` date range.
- Update dashboard copy to communicate business tracking at a glance.
- Fix invoice creation bill state so newly created bills without payment are `pending` (not `partial`).

### Implemented Updates

#### 1) Dashboard clickable drilldowns and visible click affordance

- Wired KPI cards to navigate into filtered detail pages:
  - invoices views for stock-in/stock-out/all/open dues
  - inventory view for out-of-stock list
- Added explicit in-card hint text (`Click to view details ->`) and stronger hover/focus cues.

#### 2) Out-of-stock metric and inventory deep filtering

- Added dashboard summary field for out-of-stock count (`product_qty <= 0`).
- Added inventory API support for stock status filters:
  - `out_of_stock`
  - `low_stock`
- Added Inventory UI stock-status filter and deep-link handling from dashboard.
- Added full-width out-of-stock chip on inventory cards when qty is zero or below.

#### 3) Dashboard period filters (today/month/year/custom)

- Added range-type support to dashboard summary API:
  - `today`, `month`, `year`, `custom`
- Added validation for custom date inputs (`YYYY-MM-DD`, from <= to).
- Added Dashboard filter controls:
  - range dropdown + custom `From/To` inputs
- Summary card subtitles and status chip now reflect selected period label.

#### 4) Bill-state creation correctness fix

- Corrected invoice creation logic to avoid zero-payment bills being overwritten as `partial`.
- New behavior:
  - `amount === 0` => `pending`
  - `0 < amount < grand_total` => `partial`
  - `amount === grand_total` => `paid`

### Files Updated

- `backend/src/controllers/dashboardController.js`
- `backend/src/controllers/inventoryController.js`
- `backend/src/controllers/viewInvoiesController.js`
- `backend/src/controllers/generateInvoiceController.js`
- `frontend/src/features/Dashboard.jsx`
- `frontend/src/features/Inventory.jsx`
- `frontend/src/features/ViewBills.jsx`
- `frontend/src/ui/ProductCard.jsx`
- `frontend/src/styles/dashboard.css`
- `frontend/src/styles/inventory.css`
- `frontend/src/styles/productCard.css`

### Expected Behavior After Change

- Dashboard works as a navigational command center with obvious clickable cards.
- Users can analyze insights by today/month/year/custom ranges.
- Out-of-stock insight opens directly into filtered inventory cards.
- Bills created with no upfront payment correctly start in `pending` state.

## 2026-04-03 - Stock In Search Items First-Add Default Rate Fix

### Issue

- In Generate Bill (stock-in), first-time add from search items could use `0` rate instead of visible default rate.

### Root Cause

- Rate resolution treated empty-string state as numeric `0` and used that during first add.
- Item key extraction relied on event target, which can be inconsistent.

### Fix Implemented

- Switched to stable item id resolution from `currentTarget` with fallback to row id.
- Added robust explicit-rate detection:
  - use typed rate only when non-empty and numeric
  - otherwise use default item base rate shown in UI
- Standardized reset actions to use the resolved item id.

### Files Updated

- `frontend/src/ui/BillCardItem.jsx`

### Expected Behavior

- First add of stock-in search item now uses the displayed default rate correctly.
- Subsequent adds continue to work with expected rate behavior.

## 2026-04-03 - Full User + Company Profile Section with Owner-Based Edit Rules

### Requested Change

- Add a profile section showing full current user and company details.
- Allow tenant/company edits only for owner users.
- Allow non-owner users to edit only their own user details.

### Implemented Updates

- Backend auth/profile APIs:
  - added `PATCH /api/v1/auth/me` to update current user profile (email and optional password change with current password verification)
  - added `PATCH /api/v1/auth/tenant-profile` for owner-only company/tenant profile updates
  - enforced tenant-owner permission checks server-side for tenant edits
- Frontend auth context:
  - added `updateMyProfile()`
  - added `updateTenantProfile()`
- User profile UI:
  - added full profile modal with two sections:
    - current user details and self-edit form
    - company/tenant details with role-aware editing
  - non-owner users can view company details but cannot edit them
  - owner users can edit full company details (including bank/IFSC/QR) and upload QR to Supabase

### Files Updated

- `backend/src/controllers/authController.js`
- `backend/src/routes/authRoutes.js`
- `frontend/src/auth/contexts/AuthProvider.jsx`
- `frontend/src/ui/UserProfile.jsx`
- `frontend/src/styles/userProfile.css`

### Expected Behavior

- Profile shows comprehensive user + company details.
- Owner can update both user and tenant/company details.
- Non-owner can update only own user details; tenant/company section is view-only.

## 2026-04-03 - Invoice Template Column Width Rebalance

### Requested Change

- Product name column should take more space in invoice template.
- Reduce serial number and other table columns to minimum practical widths.

### Implemented Updates

- Added explicit table `colgroup` sizing in invoice template for predictable column distribution.
- Increased Product column width and tightened Sn/QTY/HSN/tax/discount/rate/amount columns.
- Kept numeric columns nowrap and allowed product text to use the extra width.

### Files Updated

- `frontend/src/ui/InvoiceTemplate.jsx`
- `frontend/src/styles/invoiceTemplate.css`

### Expected Behavior

- Product names now have visibly more horizontal space.
- Narrow columns like serial number use less space and no longer crowd product text.

## 2026-04-03 - Stock In Generate Bill Fix (product_catalog_id Mapping)

### Issue

- Generating stock-in bill failed with:
  - `product_catalog_id is required for stock_in item: ...`

### Root Cause

- Stock-in selected items carried product catalog `id`, but payload builder only sent `item.product_catalog_id`.
- For catalog rows, `product_catalog_id` was often empty, so backend received null and rejected request.

### Fix Implemented

- Added stock-in mapping fallback in bill payload creation:
  - `product_catalog_id = item.product_catalog_id || item.id`
- Added frontend pre-submit guard to block submit if any stock-in item lacks catalog mapping.
- Ensured item-add flow preserves `product_catalog_id` when adding/updating bill items.

### Files Updated

- `frontend/src/features/generateBill/BillDetails.jsx`
- `frontend/src/ui/BillCardItem.jsx`

### Expected Behavior

- Stock-in bill generation sends valid `product_catalog_id` for each item.
- The earlier backend validation error no longer appears for correctly selected catalog items.

## 2026-04-03 - Mandatory Product Catalog Dealer Linkage (Supplier-Scoped)

### Requested Change

- Link every product catalog item to a dealer as a mandatory field.
- Clean up product catalog data and patch API/UI flows end-to-end.

### Implemented Updates

- Backend schema enforcement:
  - added required `dealer_id` relation on product catalog model
  - startup migration guard now ensures `product_catalogs.dealer_id` column, FK, index, and NOT NULL
  - cleanup step removes product rows with missing/invalid/mismatched supplier linkage before NOT NULL enforcement
- Product Catalog API contract updates:
  - `POST /api/v1/productCatalog` and `PATCH /api/v1/productCatalog/:id` now require valid supplier `dealer_id` (`invoice_type=stock_in`)
  - `GET /api/v1/productCatalog` supports `dealer_id` filtering and returns dealer details with products
- Billing safety updates:
  - stock-in invoice generation now enforces each item has valid `product_catalog_id` linked to selected supplier dealer
  - invoice edit flow enforces same product/dealer validation for stock-in edits
- Frontend updates:
  - Product Catalog now loads supplier dealers, filters products by selected supplier, and requires supplier selection in add/edit form
  - Product cards in catalog now show linked dealer label
  - Generate Bill Search Items now requires selected supplier for stock-in and fetches supplier-filtered catalog items
  - View Bills invoice-edit source items now load stock-in products filtered by the invoice dealer
  - stock-in dealer change in bill details clears existing selected items to prevent cross-dealer mixes

### Files Updated

- `backend/src/models/productCatalogModel.js`
- `backend/src/controllers/productCatalogController.js`
- `backend/server.js`
- `backend/src/controllers/generateInvoiceController.js`
- `backend/src/controllers/viewInvoiesController.js`
- `frontend/src/features/ProductCatalog.jsx`
- `frontend/src/styles/productCatalog.css`
- `frontend/src/ui/ProductCard.jsx`
- `frontend/src/styles/productCard.css`
- `frontend/src/features/generateBill/SearchItems.jsx`
- `frontend/src/features/generateBill/BillDetails.jsx`
- `frontend/src/features/ViewBills.jsx`

### Expected Behavior After Change

- Every catalog product must be linked to a supplier dealer.
- Product create/edit fails without valid supplier linkage.
- Stock-in flows only allow products linked to the selected supplier dealer.
- Legacy unlinked/invalid product catalog rows are cleaned up during startup migration.

## 2026-04-03 - Dealers Header Layout Refinement (Inline Filter + Header Pagination)

### Requested Change

- Move customer/supplier filter beside Add Dealer in one row.
- Show pagination in the same top header area.
- Remove redundant customer/supplier chip from each dealer card.

### Implemented Updates

- Updated Dealers header structure:
  - moved dealer type tabs into the same controls row as `+ Add Dealer`
  - moved pagination from bottom section into the top controls row
- Removed dealer type chip from card UI to reduce repetition.
- Improved modal dealer-type switching behavior so type changes in modal do not close the form.
- Updated Dealers CSS for the new header control grouping and responsive behavior.

### Files Updated

- `frontend/src/features/Dealers.jsx`
- `frontend/src/styles/dealers.css`

### Expected Behavior After Change

- Dealer type switcher, add button, and pagination now appear together in the top header area.
- Dealer cards show cleaner titles without redundant type chips.
- Mobile layout keeps controls readable with responsive wrapping.

## 2026-04-03 - Dealers Screen UI Refresh (Aligned with Product Catalog Look)

### Requested Change

- Style and beautify Dealers screen to match Product Catalog screen patterns.

### Implemented Updates

- Reworked Dealers page layout to mirror Product Catalog structure:
  - search + add button header row
  - tab row for dealer type selection
  - catalog-style card grid container
- Switched Add Dealer flow to modal-style form with matching visual language.
- Redesigned dealer cards with cleaner title row, info blocks, and consistent spacing.
- Improved empty state presentation to match existing product-catalog style.
- Updated shared search component to support custom placeholder text.

### Files Updated

- `frontend/src/features/Dealers.jsx`
- `frontend/src/styles/dealers.css`
- `frontend/src/ui/SearchBar.jsx`

### Expected Behavior After Change

- Dealers page now looks visually consistent with Product Catalog and other core screens.
- Add Dealer interaction follows a cleaner modal workflow.
- Search input text and styling feel aligned with the rest of the app.

## 2026-04-03 - Phase 7 + 8: Dealer Filters in View Bills and Invoice Dealer Backfill Script

### Requested Change

- Continue and complete remaining plan phases.
- Add dealer integration in bills listing flow.
- Add hard-cutover support for invoice dealer linkage.

### Implemented Updates

#### Phase 7 (View Bills dealer integration)

- Added backend dealer filter support in invoice list API:
  - `GET /api/v1/viewInvoices?...&dealerId=...`
  - validates dealer belongs to current tenant before applying filter
- Added frontend dealer filter dropdown in View Bills header.
- Added dealer option loading in View Bills using existing dealers APIs.
- Added `View Dealer` action button on each bill card.
- Bill card dealer action opens dealer profile route:
  - `/dealers/:invoiceType/:dealerId`

#### Phase 8 (hard-cutover migration support)

- Added migration script:
  - `backend/scripts/backfillInvoiceDealers.js`
  - backfills `invoices.dealer_id` from invoice snapshot fields
  - creates missing dealers when needed
  - links invoice rows to dealers per tenant + invoice_type
  - enforces `invoices.dealer_id` not-null after successful backfill
- Added npm command:
  - `npm run migrate:invoice-dealers`
- Updated dealer profile invoice-history and ledger queries to use `invoices.dealer_id` linkage mode.

### Files Updated

- `backend/src/controllers/viewInvoiesController.js`
- `frontend/src/features/ViewBills.jsx`
- `frontend/src/ui/BillViewCard.jsx`
- `frontend/src/styles/billViewCard.css`
- `backend/scripts/backfillInvoiceDealers.js`
- `backend/package.json`

### Expected Behavior After Change

- Users can filter bills by dealer and jump directly to dealer profiles.
- Hard-cutover migration path exists for older invoices that are missing dealer links.
- Dealer history/ledger endpoints now follow dealer_id linkage instead of snapshot matching.

## 2026-04-03 - Phase 5 + 6: Dealer-Linked Invoice Contract and Strict Dealer Selection in Generate Bill

### Requested Change

- Continue implementation with Phase 5 (dealer_id invoice contract).
- Continue implementation with Phase 6 (strict dealer selection flow in Generate Bill).

### Implemented Updates

#### Backend (Phase 5)

- Updated invoice model to include required `dealer_id` field.
- Updated startup schema guard to ensure invoice `dealer_id` column, FK, and dealer index:
  - add `dealer_id` column if missing
  - add FK `invoices.dealer_id -> dealers.id`
  - add index on `(tenant_id, dealer_id, invoice_type, createdAt)`
  - enforce NOT NULL when data is safe
- Updated generate-invoice controller to:
  - require `invoiceDetails.dealer_id`
  - validate selected dealer belongs to current tenant and matching `invoice_type`
  - build invoice party snapshot fields from selected dealer instead of manual payload
  - keep existing payment and inventory logic intact

#### Frontend (Phase 6)

- Added `dealer_id` to Generate Bill draft state.
- Updated Bill Details flow to strict selection-only:
  - removed manual party-entry dependency from bill creation path
  - dealer select is now required before submit
  - address/phone/GST are read-only, auto-filled from selected dealer
  - added no-dealer empty-state CTA linking to Dealers screen
- Updated Generate Bill payload to include `dealer_id`.

### Files Updated

- `backend/src/models/invoiceModel.js`
- `backend/server.js`
- `backend/src/controllers/generateInvoiceController.js`
- `frontend/src/features/generateBill/stores/billContextStore.js`
- `frontend/src/features/generateBill/BillDetails.jsx`
- `frontend/src/styles/generateBillStyles/billDetails.css`

### Expected Behavior After Change

- Invoice creation is dealer-linked and tenant/type validated.
- Generate Bill cannot proceed without selecting an existing dealer.
- Invoice snapshot display fields remain stable and populated from dealer data.

## 2026-04-03 - Dealers Phase 4 First Draft (Ledger Summary + Statement)

### Requested Change

- Continue phase-wise implementation after Dealers list/profile rollout.
- Add ledger visibility in dealer profile.

### Implemented Updates

- Added backend ledger summary endpoint:
  - `GET /api/v1/dealers/:id/ledger/summary?invoice_type=...`
- Added backend ledger statement endpoint:
  - `GET /api/v1/dealers/:id/ledger/statement?invoice_type=...&page=...&pageSize=...`
- Statement combines invoice creation rows and payment rows into a chronological timeline.
- Added running balance computation in statement output.
- Added Dealer Profile ledger UI:
  - summary cards (`total_invoiced`, `total_paid`, `total_pending`, `invoice_count`)
  - transaction timeline with pagination
- Current linkage mode is snapshot-based until invoice `dealer_id` migration is completed.

### Files Updated

- `backend/src/controllers/dealerController.js`
- `backend/src/routes/dealerRoutes.js`
- `frontend/src/features/DealerProfile.jsx`
- `frontend/src/styles/dealerProfile.css`

### Expected Behavior After Change

- Users can review dealer-level receivable/payable movement from profile screen.
- Timeline and summary remain tenant-scoped and bill-type-scoped.

## 2026-04-03 - Dealers UI Phase 2 + Profile Phase 3 (List, Click-Through, Edit, Invoice History)

### Requested Change

- Start implementing migration plan one phase at a time.
- Add dedicated Dealers screen and clickable dealer cards.
- Redirect dealer cards to a detailed dealer profile.

### Implemented Updates

- Added frontend Dealers screen with:
  - bill-type tabs (`stock_out` / `stock_in`)
  - dealer search
  - pagination
  - add-dealer form with validation
  - empty state CTA
- Added clickable dealer cards and routing to profile page:
  - `/dealers/:invoiceType/:dealerId`
- Added frontend Dealer Profile screen with:
  - dealer detail fetch
  - dealer edit form (name, phone, gst, address, invoice_type)
  - invoice history list with search, bill-state filter, and pagination
- Added backend dealer invoice history API:
  - `GET /api/v1/dealers/:id/invoices?invoice_type=...&page=...&pageSize=...&bill_state=...&search=...`
  - currently linked via invoice snapshot fields (temporary until `dealer_id` invoice migration)
- Added app navigation entry for Dealers.

### Files Updated

- `frontend/src/App.jsx`
- `frontend/src/ui/Navbar.jsx`
- `frontend/src/features/Dealers.jsx`
- `frontend/src/features/DealerProfile.jsx`
- `frontend/src/styles/dealers.css`
- `frontend/src/styles/dealerProfile.css`
- `backend/src/controllers/dealerController.js`
- `backend/src/routes/dealerRoutes.js`

### Expected Behavior After Change

- Users can manage dealers from a dedicated screen.
- Dealer cards open detailed profile pages.
- Dealer profile supports detail edits and invoice-history visibility.

## 2026-04-03 - Dealers API Phase 1 Foundation (Pagination, Search, Detail, Update)

### Requested Change

- Start implementing migration plan phase-by-phase.
- Complete Phase 1 dealer API foundation before UI changes.

### Implemented Updates

- Expanded dealers list endpoint with pagination and search support:
  - supports `page`, `pageSize` (and `limit` alias), and `search`
  - keeps `invoice_type` filtering mandatory
- Added dealer detail endpoint:
  - `GET /api/v1/dealers/:id?invoice_type=...`
- Added dealer update endpoint:
  - `PATCH /api/v1/dealers/:id`
  - validates `invoice_type`, `name`, `phone`
  - checks tenant ownership and duplicate conflicts
- Standardized dealers response shape across handlers:
  - `status`, `result`, `meta`
- Strengthened validation and tenant isolation:
  - strict invoice type validation in list/detail/create/update handlers
  - tenant-scoped reads/writes in all dealer operations

### Files Updated

- `backend/src/controllers/dealerController.js`
- `backend/src/routes/dealerRoutes.js`

### Expected Behavior After Change

- Dealers APIs are now ready for dedicated Dealers list/profile screens.
- Frontend can consume paginated searched dealer lists without contract changes to existing save flow.
- Dealer detail/update operations are available and tenant-safe.

## 2026-04-03 - Dealers Model First Draft (Replace Local Cache in Generate Bill)

### Requested Change

- Add a new DB-backed `dealers` model.
- Replace Generate Bill local cached dealer flow with backend-driven dealers.
- Keep dealer list filtered by bill type (`stock_in` / `stock_out`).

### Implemented Updates

- Added backend `dealers` model with tenant scoping and invoice-type support.
- Added startup schema guard for `dealers` table and supporting indexes.
- Added auth-protected dealers API:
  - `GET /api/v1/dealers?invoice_type=...&limit=...`
  - `POST /api/v1/dealers` (upsert by tenant + invoice_type + name + phone)
- Mounted dealers route in backend app.
- Updated Generate Bill Bill Details dealer controls:
  - removed localStorage dealer cache logic
  - now fetches dealers from backend by current bill type
  - `Save Dealer` now upserts to backend and refreshes list
  - existing dealer select still autofills party fields

### Files Updated

- `backend/src/models/dealerModel.js`
- `backend/src/controllers/dealerController.js`
- `backend/src/routes/dealerRoutes.js`
- `backend/src/app.js`
- `backend/server.js`
- `frontend/src/features/generateBill/BillDetails.jsx`

### Expected Behavior After Change

- Dealer suggestions persist in DB per tenant instead of local browser cache.
- Dealer list updates and remains isolated by selected bill type.
- Existing Generate Bill dealer save/select UX remains intact with backend data.

## 2026-04-03 - Invoice Print Layout Refinements (Top-Right Page Tag + 2-Up A4 Readability)

### Requested Changes

- Move page indicator outside invoice content, on top-right over thick border.
- Make only invoice template printable.
- Keep invoice print structure consistent (party row in single line, 70/30 totals split).
- Print 2 logical invoice pages on one A4 sheet.
- Increase print readability by enlarging template while keeping 2-up layout.

### Implemented Updates

- Moved page label to absolute badge over top-right border:
  - `Page X/Y`
- Kept print output restricted to invoice template only and hid action controls in print.
- Preserved structural consistency in print overrides:
  - party header remains single-row
  - subtotal/totals alignment follows 70% left / 30% right split
- Added 2-up print sheet behavior:
  - groups logical pages into print sheets (2 rows, 1 column)
  - remaining pages continue on subsequent sheets automatically
- Tuned print readability with larger effective print scale and tighter page spacing/margins.

### Files Updated

- `frontend/src/ui/InvoiceTemplate.jsx`
- `frontend/src/styles/invoiceTemplate.css`

### Expected Behavior After Change

- Printed invoices are easier to read while still fitting 2 logical pages per A4 where possible.
- Page indicator appears on border top-right.
- Multi-page invoices continue correctly onto next physical sheets.

## 2026-04-03 - Invoice Output Simplification: Remove Download PDF, Keep Print Only

### Requested Change

- Remove Download PDF feature from app everywhere.
- Keep invoice export through browser print only (users can Save as PDF from print dialog).

### Implemented Updates

- Removed Download PDF button from invoice template action row.
- Removed PDF generation logic from invoice template component.
- Removed PDF-capture specific export-mode CSS overrides no longer needed.
- Kept Print Invoice action as the single supported invoice output path.

### Files Updated

- `frontend/src/ui/InvoiceTemplate.jsx`
- `frontend/src/styles/invoiceTemplate.css`

### Expected Behavior After Change

- App no longer attempts image/PDF capture based downloads.
- Users print invoice directly and can use browser `Save as PDF` when needed.

## 2026-04-03 - Invoice Template Multi-Page Item Pagination (6 Items Per Page)

### Requested Change

- If invoice items are more than 6, continue items on next page.
- Next page should keep same invoice template format.
- Serial numbers and item details should update by page.
- Add page number to invoice.

### Implemented Updates

- Split invoice items into pages of 6 rows each in invoice template rendering.
- Repeated full invoice template block for each page.
- Added page indicator in invoice metadata:
  - `Page : X / Y`
- Serial numbers now continue correctly across pages.
- Added page-break rules for print so each invoice page prints on separate physical page.
- Updated PDF export to capture and export each rendered invoice page into a multi-page PDF.

### Files Updated

- `frontend/src/ui/InvoiceTemplate.jsx`
- `frontend/src/styles/invoiceTemplate.css`

### Expected Behavior After Change

- Invoices with more than 6 items render as multiple pages with consistent layout.
- Print and PDF both preserve page boundaries and page numbering.

## 2026-04-03 - Invoice Template: Add Print Button

### Requested Change

- Add a `Print Invoice` button in invoice template action row next to back/download buttons.

### Implemented Updates

- Added `Print Invoice` button in invoice action controls.
- Added print handler using browser print (`window.print()`).
- Added print media styles to improve print output:
  - hide action button row while printing
  - remove extra background/padding/shadow wrappers for clean invoice page
  - keep invoice content full-width for print layout

### Files Updated

- `frontend/src/ui/InvoiceTemplate.jsx`
- `frontend/src/styles/invoiceTemplate.css`

### Expected Behavior After Change

- Users can print invoice directly from invoice template screen.
- Print output focuses on invoice content without UI action controls.

## 2026-04-03 - Invoice Amount Rounding (Nearest Digit)

### Requested Change

- Round decimal values in subtotal, grand total, and related amount fields to nearest digit where appropriate.

### Implemented Updates

- Updated shared invoice totals utility to round computed totals to nearest whole digit:
  - `sub_total`
  - `cgst_total`
  - `sgst_total`
  - `discount_total`
  - `grand_total`
- Updated invoice template amount formatting to render rounded amounts (no trailing decimal fractions).
- Updated bill-details total display (`Your Total`) to show rounded amount.
- Updated View Bills card pending amount display to rounded value.

### Files Updated

- `backend/src/utilities/calculateInvoiceData.js`
- `frontend/src/ui/InvoiceTemplate.jsx`
- `frontend/src/features/generateBill/BillDetails.jsx`
- `frontend/src/ui/BillViewCard.jsx`

### Expected Behavior After Change

- Totals and payable amount displays appear cleaner and rounded to nearest digit.

## 2026-04-03 - Generate Bill Show-Invoice Alignment + Container Spacing Fix

### Reported Issue

- After clicking `Show Invoice` from Generate Bill, invoice template was not centered properly.
- Parent container did not cover template/buttons correctly.
- Action buttons needed spacing improvements.

### Implemented Updates

- Added invoice-view mode class on Generate Bill container when invoice is shown.
- Switched invoice mode to centered single-column layout with vertical scrolling enabled.
- Added width constraints so invoice template sits centered and fully covered by parent layout.
- Improved invoice action-row spacing and bottom padding for back/download buttons.

### Files Updated

- `frontend/src/features/generateBill/GenerateBill.jsx`
- `frontend/src/styles/generateBillStyles/generateBill.css`
- `frontend/src/styles/invoiceTemplate.css`

### Expected Behavior After Change

- Show-Invoice view is centered, properly covered by container, and action buttons have clean spacing.

## 2026-04-03 - View Bills: Edit Invoice Modal (Party + Items with Add/Remove)

### Requested Change

- Add `Edit Invoice` button on each View Bills card.
- Open modal form to update invoice when user made mistakes in party details or invoice items.
- Allow item add/remove in edit flow.
- Keep critical fields locked.

### Implemented Updates

#### 1) Backend invoice-edit API

- Added new endpoint:
  - `PATCH /api/v1/viewInvoices/:id/edit`
- Edit scope allows:
  - party fields (buyer/seller side based on invoice type)
  - invoice items list (including qty/rate/discount edits + add/remove)
- Locked restrictions enforced server-side:
  - no invoice number/invoice type/date/payment history edits
  - fully paid invoices cannot be edited
- Recalculates totals server-side after edit:
  - `sub_total`, `discount_total`, `cgst_total`, `sgst_total`, `grand_total`
  - `pending_amount` and `bill_state` based on payments already recorded
- Added inventory delta reconciliation for item changes so stock remains consistent after edits.

#### 2) Frontend Edit Invoice modal

- Added `Edit Invoice` action button in each View Bills card.
- Added modal with:
  - editable party details
  - editable invoice items table (`qty`, `rate`, `discount`)
  - add-item selector (source based on invoice type)
  - remove-item controls
  - locked info strip for critical non-editable fields
- Wired modal save to new backend endpoint and invalidates caches on success.

### Files Updated

- `backend/src/controllers/viewInvoiesController.js`
- `backend/src/routes/viewInvoicesRotues.js`
- `frontend/src/features/ViewBills.jsx`
- `frontend/src/ui/BillViewCard.jsx`
- `frontend/src/ui/EditInvoiceModal.jsx`
- `frontend/src/styles/editInvoiceModal.css`

### Expected Behavior After Change

- Users can correct party and item mistakes from View Bills without regenerating invoice.
- Item add/remove is supported in edit modal.
- Critical invoice identity and payment history stay protected.

## 2026-04-03 - Generate Bill Bill-Details Items: Larger 3x2 Grid + Pagination

### Requested Change

- In Generate Bill -> Bill Details, added-product cards looked squeezed and hard to read.
- Make list show 6 cards in two rows and three columns.
- Keep Bill Details area scrollable when needed.
- Add pagination for added items when count exceeds 6.

### Implemented Updates

- Switched Bill Details selected-items section to paged view with `6 items per page`.
- Added pagination controls below item list to move between pages when items are more than 6.
- Updated selected-items container to a fixed 3-column grid on desktop (2 rows for 6 items).
- Added vertical scroll support for the items container with bounded max height.
- Increased bill-details card size and spacing for better readability of product details.
- Added responsive fallback:
  - 2 columns on medium screens
  - 1 column on mobile screens

### Files Updated

- `frontend/src/features/generateBill/BillDetails.jsx`
- `frontend/src/styles/generateBillStyles/billDetails.css`

### Expected Behavior After Change

- Added items are easier to read and no longer feel cramped.
- Bill Details list displays up to 6 cards per page in a clean 3x2 layout.
- Users can navigate to next pages when more items are added.

## 2026-04-03 - Model Field Length Expansion (Address and Related Text Fields)

### Requested Change

- Address fields were too restrictive; increase limits across models where appropriate.
- Ensure address-like fields support 100+ characters.

### Implemented Updates

- Increased model string limits to more practical sizes across tenant, invoice, product, inventory, and invoice item models.
- Address fields in invoice and tenant now support longer values (`255`).
- Party names/product names/brands expanded to wider limits (`120`).
- Phone fields normalized to practical string length (`20`).
- HSN and GST fields normalized to concise but sufficient lengths.
- Unit name fields increased to better support custom unit labels.

### DB Compatibility Update

- Added startup normalization in backend bootstrap to alter existing DB column sizes so deployed databases match updated model definitions.

### Files Updated

- `backend/src/models/tenantModel.js`
- `backend/src/models/invoiceModel.js`
- `backend/src/models/productCatalogModel.js`
- `backend/src/models/inventoryModel.js`
- `backend/src/models/invoiceItemsModel.js`
- `backend/server.js`

### Expected Behavior After Change

- Longer addresses and other real-world text values save without hitting old 50-char style limits.
- Existing databases are auto-migrated to the new varchar lengths on backend startup.

## 2026-04-03 - View Bills Card: Show Invoice Number

### Requested Change

- Add invoice number to each View Bills card.

### Implemented Updates

- Added `Invoice No` field in the bill card details grid.
- Value shows `invoice_number` with a safe fallback (`-`) when unavailable.

### Files Updated

- `frontend/src/ui/BillViewCard.jsx`

### Expected Behavior After Change

- Users can see invoice number directly on View Bills cards without opening invoice detail.

## 2026-04-03 - View Bills: Bill Type Filter (stock_in / stock_out)

### Requested Change

- Add filter in View Bills to filter invoices by bill type (`stock_in` / `stock_out`).

### Implemented Updates

- Added new bill-type dropdown in View Bills header with options:
  - `All Bills`
  - `Stock In`
  - `Stock Out`
- Included selected bill-type filter in frontend query key and request URL.
- Added backend support to apply `invoice_type` condition when `billType` query param is `stock_in` or `stock_out`.

### Files Updated

- `frontend/src/features/ViewBills.jsx`
- `backend/src/controllers/viewInvoiesController.js`

### Expected Behavior After Change

- Users can quickly view only stock-in bills or only stock-out bills from View Bills.
- Default behavior remains unchanged with `All Bills` selected.

## 2026-04-03 - Generate Bill Search Cards: Hide Purchase % for stock_in

### Requested Change

- In `stock_in` Search Items cards, remove `Purchase %` input because it does not make sense there.
- Keep everything else unchanged.

### Implemented Updates

- Purchase percentage input is now conditionally hidden only for `stock_in` cards.
- Existing `Rate` and `Disc %` controls remain visible and functional.
- Kept `stock_out` behavior unchanged (still shows `Purchase %` input).
- Added stock-in specific grid layout for price controls to preserve spacing.

### Files Updated

- `frontend/src/ui/BillCardItem.jsx`
- `frontend/src/styles/productCard.css`

### Expected Behavior After Change

- `stock_in` cards show only Rate + Discount controls.
- `stock_out` cards still show Purchase % + Rate + Discount controls.

## 2026-04-03 - Search Items Card: Show MRP + Rate, Seed Random Missing Rates (Testing)

### Requested Change

- Show both `MRP` and `Rate` in Generate Bill Search Items card.
- Display `Rate` just below `MRP` with smaller visual weight.
- For testing, assign random rate values where rate is not defined in DB.

### Implemented Updates

#### 1) Search Items card UI

- Updated card top-right pricing block to show:
  - `MRP: ₹...`
  - `Rate: ₹...` (smaller text below MRP)
- Kept rate calculation behavior and manual rate editing flow unchanged.

#### 2) DB/test rate backfill + inventory support

- Added startup DB patch to ensure `inventories.rate` column exists.
- Updated startup backfill to assign random test rates where missing/zero:
  - `product_catalogs.rate`
  - `inventories.rate`
- Random range currently used for testing: roughly `₹50` to `₹500`.

#### 3) Inventory sync behavior

- Inventory update utility now stores/updates `rate` from invoice items during `stock_in` flows.
- New inventory rows created from stock-in now persist `rate` when provided.

### Files Updated

- `frontend/src/ui/BillCardItem.jsx`
- `frontend/src/styles/productCard.css`
- `backend/src/models/inventoryModel.js`
- `backend/src/utilities/updateInventory.js`
- `backend/server.js`

### Expected Behavior After Change

- Search cards show both MRP and Rate clearly.
- Missing rate values are auto-filled with random test values during backend startup.
- Inventory-backed search data can now carry a dedicated rate value.

## 2026-04-03 - Product Catalog Rate + Generate Bill Purchase-% Helper

### Requested Change

- Add `rate` field in Product Catalog (model, DB, add/edit product flow).
- In Generate Bill Search Items cards, show this base rate and add an input to enter purchase percentage.
- Purchase percentage should increase base rate by that percent and auto-fill Rate field.
- Keep Rate field manually editable.
- Keep Discount default at `0%`.

### Implemented Updates

#### 1) Backend Product Catalog schema + persistence

- Added `rate` column to Product Catalog Sequelize model.
- Updated add-product and update-product controllers to accept and validate `rate`.
- Added startup DB patch to ensure existing databases get `product_catalogs.rate` column.
- Existing rows are backfilled to `0` where missing and constrained to NOT NULL.

#### 2) Frontend Product Catalog form

- Added `rate` field in Add/Edit Product modal.
- Included `rate` in submit payload for both create and update.
- Added frontend validation for non-negative numeric rate.

#### 3) Generate Bill Search Items behavior

- Search card top price now prefers Product Catalog `rate` (fallback to `mrp` for compatibility).
- Added `Purchase %` input in card controls.
- Entering purchase percentage auto-calculates `Rate = baseRate + (baseRate * percent / 100)` and updates rate input.
- Rate input remains fully editable manually.
- Discount input now defaults to `0` and reset also restores `0`.

### Files Updated

- `backend/src/models/productCatalogModel.js`
- `backend/src/controllers/productCatalogController.js`
- `backend/server.js`
- `frontend/src/features/ProductCatalog.jsx`
- `frontend/src/features/generateBill/stores/searchItemsContextStore.js`
- `frontend/src/ui/BillCardItem.jsx`
- `frontend/src/styles/productCard.css`

### Expected Behavior After Change

- Product Catalog products now persist a dedicated `rate` value.
- Generate Bill Search Items cards can quickly derive selling rate from purchase percentage.
- Users can still override Rate manually before adding item.
- Discount field starts at `0%` by default.

## 2026-04-03 - Generate Bill Qty Input UX Fix (No Forced Extra Zero)

### Reported Issue

- While typing quantity in Search Items cards, frontend was forcing/retaining `0` in a way that made editing awkward.

### Implemented Updates

- Updated qty input to allow clean manual editing without forcing `0` as the live field value.
- Added placeholder-based `0` display instead of hard binding `0` into input value.
- Added full-value select on focus so typing replaces existing value immediately.
- Updated qty reducer so empty input can be represented while editing, then existing add/inc/dec flows still normalize safely.

### Files Updated

- `frontend/src/ui/BillCardItem.jsx`
- `frontend/src/features/generateBill/stores/searchItemsContextStore.js`

### Expected Behavior After Change

- Typing quantity no longer feels like an extra `0` is being injected by frontend.
- Users can quickly overwrite qty values from keyboard and still use `+` / `-` buttons.

## 2026-04-03 - Generate Bill Search Cards: Keyboard Quantity Input

### Requested Change

- Add keyboard-editable quantity input in Search Items cards for both bill types, while keeping `+` / `-` controls.

### Implemented Updates

- Replaced static qty display in Search Items card counter with numeric input.
- Added reducer action (`SET_QTY`) for direct quantity updates.
- Kept existing increment/decrement qty actions unchanged.
- Added input styling so qty input fits cleanly between counter buttons.

### Files Updated

- `frontend/src/ui/BillCardItem.jsx`
- `frontend/src/features/generateBill/stores/searchItemsContextStore.js`
- `frontend/src/styles/productCard.css`

### Expected Behavior After Change

- Users can type qty directly from keyboard in Generate Bill Search Items cards.
- `+` / `-` buttons continue to work exactly as before.

## 2026-04-03 - Register Step Split + Supabase Old QR Cleanup

### Requested Changes

- Break register flow so each page has at most 4 fields.
- Delete previous QR image from Supabase bucket after QR is updated.

### Implemented Updates

#### 1) Register flow split into smaller parts

- Refactored registration into 3 steps:
  - Step 1 (Company): 4 fields (`cname`, `caddress`, `cphoneNumber`, `gstin`)
  - Step 2 (Payment): 4 fields (`accountNumber`, `ifscCode`, `qrUrlInput`, `qrFile`)
  - Step 3 (User): 2 fields (`email`, `password`)
- Added step-specific validation in `handleNextStep`.
- Preserved final submit payload and existing Supabase upload behavior.

#### 2) Delete old QR file on successful QR replacement

- Added helper to safely parse Supabase public URL and extract object path.
- Added helper to delete object from configured bucket.
- In profile update flow, after successful tenant update:
  - if a new QR file was uploaded and URL changed,
  - old QR object is deleted from Supabase bucket.
- Deletion failure does not block payment-detail save (warn-only behavior).

### Files Updated

- `frontend/src/auth/Register.jsx`
- `frontend/src/lib/supabaseClient.js`
- `frontend/src/ui/UserProfile.jsx`

### Expected Behavior After Change

- Register UX is cleaner and less crowded (max 4 fields per step).
- Supabase storage does not retain obsolete QR images after replacement updates.

## 2026-04-03 - View Bills Date Update Fixes (Persistence + Realtime Feedback)

### Reported Issue

- Editing `created_at` from View Bills did not persist reliably and UI did not clearly confirm updates.

### Implemented Updates

- Backend date update endpoint hardened to guarantee DB write:
  - switched to direct SQL `UPDATE ... RETURNING` for `createdAt`.
  - response now returns DB-updated timestamp explicitly.
- Added frontend realtime UX for date update:
  - immediate local card date update from API response,
  - query cache patch for `viewInvoices` list,
  - success feedback message (`Date updated successfully.`) with auto-dismiss,
  - retained error feedback path.

### Files Updated

- `backend/src/controllers/viewInvoiesController.js`
- `frontend/src/features/ViewBills.jsx`
- `frontend/src/ui/BillViewCard.jsx`
- `frontend/src/styles/billViewCard.css`

### Expected Behavior After Change

- Updating date in View Bills persists in DB and reflects immediately in card UI.
- Users receive explicit success feedback after date update.

## 2026-04-03 - View Bills Created Date Formatting Update

### Requested Change

- Show month in words on View Bills card `Created At` field; keep day and year format same.

### Implemented Updates

- Updated bill card formatter from numeric month to short month name.
- Example format now: `03-Apr-2026`.

### Files Updated

- `frontend/src/ui/BillViewCard.jsx`

## 2026-04-03 - View Bills: Edit Invoice Date (created_at)

### Requested Change

- Add option to edit invoice `created_at` date directly from View Bills section.

### Implemented Updates

- Added new backend endpoint to update invoice date per tenant invoice:
  - `PATCH /api/v1/viewInvoices/:id/date`
- Added validation for required/valid `created_at` value.
- Added date-edit controls in each View Bills card:
  - date input
  - `Update Date` button
- On successful date update, invalidates relevant query caches so list/invoice views refresh immediately.

### Files Updated

- `backend/src/controllers/viewInvoiesController.js`
- `backend/src/routes/viewInvoicesRotues.js`
- `frontend/src/features/ViewBills.jsx`
- `frontend/src/ui/BillViewCard.jsx`
- `frontend/src/styles/billViewCard.css`

### Expected Behavior After Change

- Users can update invoice date from View Bills without regenerating invoice.
- Updated date appears in bill cards and invoice template after refresh/invalidation.

## 2026-04-03 - QR Storage Finalization (Supabase `images`, No Base64 Fallback)

### Requested Change

- Store QR in Supabase bucket `images`.
- Remove base64 fallback because it slows app payloads.

### Implemented Updates

- Set default QR storage bucket to `images` in frontend storage helper.
- Removed base64 fallback from both profile update flow and register flow.
- Enforced strict Supabase upload when a QR file is selected.
- Kept manual `QR URL` input path available as alternative when user already has a hosted QR URL.

### Files Updated

- `frontend/src/lib/supabaseClient.js`
- `frontend/src/ui/UserProfile.jsx`
- `frontend/src/auth/Register.jsx`

### Setup Note Confirmed

- `VITE_SUPABASE_URL` must be the project URL (`https://<project-ref>.supabase.co`), not a publishable key string.

### Expected Behavior After Change

- QR image updates persist as hosted URLs (Supabase object URLs), not heavy base64 payloads.
- Profile/register QR file save requires valid Supabase env + storage permissions.

## 2026-04-03 - QR Update Verification + View Bills QR Refresh Fix

### Reported Issue

- Even after updating tenant payment details, invoice view in View Bills continued showing old QR.

### Root Causes Addressed

- Profile flow could preserve previous QR URL in some failure paths.
- Invoice detail query in invoice view was cached (`staleTime`), which could display stale tenant QR briefly.
- Remote QR URL could be browser-cached, showing old image bytes.

### Implemented Updates

- Profile update flow adjusted so new QR file always replaces old `qr_url` (fallback now prefers new file data URL if upload fails and no explicit URL was entered).
- Tenant payment update endpoint now reloads tenant before response, ensuring returned session contains latest persisted values.
- View invoice API now returns tenant payment update timestamp (`tenant_payment_updated_at`).
- Invoice view now:
  - always refetches invoice data on mount (`staleTime: 0`, `refetchOnMount: "always"`)
  - applies cache-busting query parameter for remote QR URLs
  - preserves data URLs unchanged.

### Files Updated

- `frontend/src/ui/UserProfile.jsx`
- `backend/src/controllers/authController.js`
- `backend/src/controllers/viewInvoiesController.js`
- `frontend/src/ui/InvoiceTemplate.jsx`

### Expected Behavior After Change

- Updating QR in profile should persist new `tenant.qr_url`.
- Opening invoice from View Bills should show latest QR without stale-cache lag.

## 2026-04-03 - Inventory Card Visual Consistency + Profile Save Feedback

### Requested Changes

- Make inventory compact cards match product catalog card size.
- Distribute inventory card details uniformly so content does not feel cramped.
- Show explicit success feedback after adding/updating payment details from profile modal.

### Implemented Updates

#### 1) Inventory card size alignment

- Standardized compact card baseline height so inventory and product catalog cards look consistent in dimensions.

#### 2) Inventory detail distribution

- Added inventory-scoped compact content layout rules to improve vertical rhythm.
- Converted inventory meta row into a two-column grid for better balance.
- Relaxed chip width constraints for inventory-only compact cards for more even spacing.

#### 3) Profile payment success feedback

- Added success state message after payment details save in profile dropdown.
- Message differentiates first-time add vs update:
  - `Payment details added successfully.`
  - `Payment details updated successfully.`
- Added auto-dismiss behavior for feedback banner.

### Files Updated

- `frontend/src/styles/productCard.css`
- `frontend/src/ui/UserProfile.jsx`
- `frontend/src/styles/userProfile.css`

### Expected Behavior After Change

- Inventory compact cards now visually match product catalog card dimensions.
- Inventory card contents appear more uniformly distributed.
- Users receive immediate positive confirmation after successful payment detail save/update.

## 2026-04-03 - Search Items In-Stock Badge (Both Bill Types)

### Requested Change

- Show `In stock` indicator on Search Items cards in both `stock_in` and `stock_out` flows.

### Implemented Updates

- Updated Search Items card condition in `BillCardItem` so `In stock` can render for both bill types.

### Files Updated

- `frontend/src/ui/BillCardItem.jsx`

## 2026-04-03 - Profile Bank Details: QR URL + Upload Fallback

### Reported Issue

- `Add Bank and QR` in profile failed when Supabase env keys were not configured.

### Implemented Updates

- Added `QR URL` input in profile modal.
- Allowed save using pasted QR URL when Supabase upload is unavailable.
- Added fallback logic: if QR file upload fails, convert file to data URL and continue.

### Files Updated

- `frontend/src/ui/UserProfile.jsx`
- `frontend/src/lib/supabaseClient.js`

## 2026-04-03 - Register Flow: QR URL + Resilient QR Save

### Reported Issue

- Registration depended too heavily on remote QR upload success.

### Implemented Updates

- Added `QR URL` input fallback in register form.
- Added fallback logic to store selected QR file as data URL if upload fails.
- Kept Supabase upload path when configuration is present and working.

### Files Updated

- `frontend/src/auth/Register.jsx`
- `frontend/src/lib/supabaseClient.js`

## 2026-04-03 - Fix: tenant-payment-details Failed Fetch (413 + CORS)

### Reported Issue

- Browser console showed:
  - `PATCH /auth/tenant-payment-details net::ERR_FAILED 413 (Payload Too Large)`
  - CORS warning due to missing `Access-Control-Allow-Origin` header

### Root Cause

- Request body exceeded default JSON parser size.
- Body parser ran before CORS middleware, so parser failures returned without CORS headers.

### Implemented Updates

- Moved CORS middleware before body parsing.
- Increased JSON request size limit to `5mb`.

### Files Updated

- `backend/src/app.js`

## 2026-04-03 - Manual Invoice Date (created_at) While Generating Bill

### Requested Change

- Add an option to manually set invoice `created_at` during bill generation.

### Implemented Updates

- Added optional `Invoice Date` field (`type="date"`) in Generate Bill form.
- On submit, selected date is converted to ISO and sent in payload as `invoiceDetails.created_at`.
- Added frontend validation for invalid selected date values.
- Backend now accepts optional `created_at`, validates it, and writes it to Sequelize `createdAt` when creating the invoice.
- Existing behavior is preserved: if no date is selected, system current timestamp is used.

### Files Updated

- `frontend/src/features/generateBill/BillDetails.jsx`
  - Added `Invoice Date (optional)` input.
  - Included `created_at` in `invoiceDetails` payload.
  - Added date parsing/validation before API call.

- `backend/src/controllers/generateInvoiceController.js`
  - Added optional `created_at` parsing and validation.
  - Applied validated date as `createdAt` during `Invoice.create(...)`.

### Expected Behavior After Change

- User can generate invoices with a custom invoice date.
- If date is omitted, invoice date remains auto-generated as current time.

## 2026-04-02 - UI Polish + Tenant Payment Setup + Generate Bill Source Fix

### 1) Inventory and Product Catalog cards (layout and pagination)

- Increased list size per page to show more cards when available.
- Final pagination value is **10 cards per page** for:
  - Inventory screen
  - Product Catalog screen
- Reworked card containers to use responsive grid behavior so empty space is reduced.
- Added extra spacing and bottom breathing room so cards do not look cramped.
- Tuned compact card spacing to reduce clutter.

### 2) Card text behavior (truncate + hover full value)

- In compact cards, long values now use ellipsis (`...`) where needed.
- Unit/HSN chips truncate gracefully and keep inline alignment.
- Full value is shown on hover via `title` tooltip.
- Brand text in inventory/product catalog now shows full value on hover.

### 3) Inventory compact card readability

- Moved inventory quantity indicator to top-right under price.
- Kept this scoped to inventory compact cards so product catalog/bill details remain usable.

### 4) Product Catalog action buttons visual tone

- Softened Edit/Delete button colors from high-contrast blue/red to muted tones.
- Hover states remain visible but less aggressive.

### 5) Tenant payment details feature (mandatory fields)

Implemented tenant-level mandatory payment setup:

- `account_number` (mandatory)
- `ifsc_code` (mandatory, validated format)
- `qr_url` (mandatory)

Backend updates:

- Tenant model extended with new fields.
- Registration now requires all three payment fields.
- Added owner-protected endpoint to update tenant payment details:
  - `PATCH /api/v1/auth/tenant-payment-details`
- Invoice details API now includes tenant bank + QR values for rendering.
- Startup DB patch added to ensure missing columns are created in existing DBs.

Frontend updates:

- Register flow now collects account number, IFSC, and QR image.
- User profile dropdown now shows bank setup status and provides an Add/Update modal.
- Invoice template now renders real account number, IFSC, and tenant QR (instead of placeholders).

### 6) Supabase SDK decision update

- Removed dependency on Supabase JS SDK usage.
- QR upload now uses plain `fetch` against Supabase Storage REST API helper.
- This keeps the implementation working without adding `@supabase/supabase-js`.

### 7) Generate Bill source mapping correction (important fix)

Corrected data source mapping in Search Items:

- `stock_in` now loads from **product catalog**.
- `stock_out` now loads from **inventory**.
- Quantity filter (only items with stock) is now applied for `stock_out` flow.
- Loading/empty labels were updated to match the corrected source.

### Files touched in this batch

- `frontend/src/features/Inventory.jsx`
- `frontend/src/features/ProductCatalog.jsx`
- `frontend/src/features/generateBill/SearchItems.jsx`
- `frontend/src/ui/ProductCard.jsx`
- `frontend/src/ui/InvoiceTemplate.jsx`
- `frontend/src/ui/UserProfile.jsx`
- `frontend/src/auth/Register.jsx`
- `frontend/src/auth/contexts/AuthProvider.jsx`
- `frontend/src/styles/inventory.css`
- `frontend/src/styles/productCatalog.css`
- `frontend/src/styles/productCard.css`
- `frontend/src/styles/userProfile.css`
- `frontend/src/styles/login.css`
- `frontend/src/lib/supabaseClient.js`
- `backend/src/models/tenantModel.js`
- `backend/src/controllers/authController.js`
- `backend/src/controllers/viewInvoiesController.js`
- `backend/src/routes/authRoutes.js`
- `backend/server.js`

## 2026-04-02 - Generate Bill Search Cards (Stock In Inventory Qty + Card Separation)

### Requested Change

- On Generate Bill screen, when bill type is `stock_in`, search cards should show inventory item quantity.
- Ensure cards in Search Items are properly separated visually.

### Implemented Updates

- Switched Search Items data source logic to use inventory endpoint for `stock_in` bill type.
- Kept product catalog endpoint for non-`stock_in` bill types.
- Added inventory quantity badge on each search card when current bill type is `stock_in`.
- Improved Search Items grid spacing behavior for consistent card separation.
- Added an explicit border on search cards inside Search Items for clearer visual separation.

### Files Updated

- `frontend/src/features/generateBill/SearchItems.jsx`
  - Uses `isStockIn` gate.
  - Fetches from `inventory` for `stock_in`, else `productCatalog`.
  - Applies inventory-only quantity filter when `stock_in`.
  - Updated loading and empty-state labels accordingly.
- `frontend/src/ui/BillCardItem.jsx`
  - Reads current invoice type from bill context.
  - Renders `In stock: <qty>` chip for `stock_in` cards.
- `frontend/src/styles/generateBillStyles/searchItems.css`
  - Added `grid-auto-rows: max-content`.
  - Set explicit row/column gaps.
  - Added `.bill-item-card` border/margin rule in Search Items container.
- `frontend/src/styles/productCard.css`
  - Added styles for `.bill-item-inventory-row` and `.bill-item-inventory-pill`.

### Expected Behavior After Change

- Selecting `stock_in` in Generate Bill shows inventory-backed cards in Search Items.
- Each inventory card shows current quantity as an `In stock` chip.
- Cards appear consistently separated with visible spacing and borders.

## 2026-04-02 - Backend DB Startup Lifecycle Fix (ConnectionManager Closed Error)

### Reported Issue

- Error while logging in: `ConnectionManager.getConnection was called after the connection manager was closed!`

### Root Cause

- Backend was calling `app.listen(...)` before DB initialization finished.
- If DB init failed once, catch block ran `sequelize.close()` but process continued, leaving server reachable with a closed Sequelize connection manager.

### Implemented Fix

- Refactored backend startup to a `bootstrapServer()` function.
- App now authenticates and syncs Sequelize before starting HTTP listener.
- On startup failure, backend closes Sequelize safely and exits process with non-zero code.
- Added fallback port default (`8080`) to prevent undefined port startup state.

### Files Updated

- `backend/server.js`
  - Replaced listen-first startup with DB-first bootstrap flow.
  - Added guarded shutdown and `process.exit(1)` on init failure.

### Expected Behavior After Change

- Server only accepts requests when DB connection is healthy.
- Login and other queries no longer hit a closed Sequelize connection manager from partial startup.

## 2026-04-02 - Product Catalog Custom Unit Name + Unit Field Styling

### Requested Change

- In Product Catalog -> Add Product modal, allow users to add/select a custom unit name if it is not present in dropdown options.
- Make unit name field background gray (matching the other modal fields).

### Implemented Updates

- Added a `+ Add custom unit` option in the unit name dropdown.
- When custom option is selected, a text input appears to capture user-defined unit name.
- Added validation for custom unit name length (max 50 chars) and empty value checks.
- Preserved compatibility for edit mode:
  - If existing unit is default (`pcs`, `box`, `jar`), dropdown selects it directly.
  - If existing unit is custom, form auto-selects custom mode and pre-fills custom input.
- Updated add/update payload to always send the resolved unit name.
- Updated backend models to store `unit_name` as string (instead of enum) so custom units are accepted across product catalog, inventory, and invoice items.
- Added startup schema normalization in backend bootstrap to convert existing DB `unit_name` columns from enum to `VARCHAR(50)` for legacy databases.
- Styled modal `select` field with gray background to match input fields.

### Files Updated

- `frontend/src/features/ProductCatalog.jsx`
  - Added custom unit option workflow (`CUSTOM_UNIT_OPTION`).
  - Added conditional custom unit input.
  - Added resolved unit-name validation and submission mapping.
  - Added edit-mode handling for pre-existing custom units.
- `frontend/src/styles/productCatalog.css`
  - Added `.container-addProd select` style with gray background and matching padding/border radius.
- `backend/src/models/productCatalogModel.js`
  - Changed `unit_name` from `ENUM` to `STRING(50)`.
- `backend/src/models/inventoryModel.js`
  - Changed `unit_name` from `ENUM` to `STRING(50)`.
- `backend/src/models/invoiceItemsModel.js`
  - Changed `unit_name` from `ENUM` to `STRING(50)`.
- `backend/server.js`
  - Added `normalizeUnitNameColumns()` to alter legacy enum columns (`product_catalogs`, `inventories`, `invoice_items`) to `VARCHAR(50)` during startup.

### Expected Behavior After Change

- Users can select default unit options or choose custom and type a new unit.
- Custom unit names are accepted by backend APIs and persist in database records.
- Unit name dropdown now visually matches other gray modal fields.
