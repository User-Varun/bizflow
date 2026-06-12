# BizFlow Frontend Design Doc (V1)

Date: 25 March 2026
Status: Frontend architecture baseline
Scope: Frontend only (React + Vite + React Router + React Query)

## Table of Contents

- [BizFlow Frontend Whole Picture (Brief)](#bizflow-frontend-whole-picture-brief)
- [1) Focus Areas](#1-focus-areas)
- [2) Core UI and State Rules](#2-core-ui-and-state-rules)
- [3) Routes, Screens, and Responsibilities](#3-routes-screens-and-responsibilities)
- [4) API Integration Contract (Frontend View)](#4-api-integration-contract-frontend-view)
- [5) Server State Strategy (React Query)](#5-server-state-strategy-react-query)
- [6) Client State Strategy (Context and Reducers)](#6-client-state-strategy-context-and-reducers)
- [7) Auth and Session UX](#7-auth-and-session-ux)
- [8) Dashboard Module (Frontend)](#8-dashboard-module-frontend)
- [9) Inventory Module (Frontend)](#9-inventory-module-frontend)
- [10) Product Catalog Module (Frontend)](#10-product-catalog-module-frontend)
- [11) Generate Bill Module (Frontend)](#11-generate-bill-module-frontend)
- [12) View Bills Module (Frontend)](#12-view-bills-module-frontend)
- [13) Error, Loading, and Empty State Rules](#13-error-loading-and-empty-state-rules)
- [14) Multi-Tenant and Security Guardrails (Frontend)](#14-multi-tenant-and-security-guardrails-frontend)
- [15) Definition of Done (Frontend)](#15-definition-of-done-frontend)

## BizFlow Frontend Whole Picture (Brief)

BizFlow frontend is a tenant-aware business UI that supports authentication, catalog/inventory management, invoice generation, invoice viewing, and operational dashboard metrics.

Main frontend modules:

- Auth and onboarding UI: login flow, protected route handling, user session context.
- Dashboard UI: tenant-scoped summary cards and quick operational insights.
- Product catalog UI: create/read/delete catalog items and search/select for billing.
- Inventory UI: list and inspect stock quantities and related product details.
- Generate bill UI: build stock_in or stock_out invoices with item-level controls.
- View bills UI: list and inspect invoices with pending status visibility.

Request lifecycle in one line:

- screen mounts -> React Query fetches tenant-scoped data -> component renders loading/error/success states -> user action mutates server -> related queries invalidate and refresh.

Core guarantees:

- all server state reads/writes go through React Query and requestJSON.
- UI state is separate from server state (do not duplicate API data in reducers).
- feature-level state is colocated in feature stores/hooks.
- every screen handles loading, error, and empty states explicitly.

## 1) Focus Areas

- Clear separation between server state and UI state.
- Reliable API integration with reusable request helper.
- Predictable render behavior under loading/error conditions.
- Reusable feature components for billing workflows.
- Tenant-safe behavior by relying on backend auth context and cookies.

## 2) Core UI and State Rules

- Use React Query for server data fetching, caching, mutations, retries, and invalidation.
- Use Context plus useReducer for feature-local draft state (for example, invoice form state while editing).
- Avoid storing API response collections in reducers when React Query already owns that data.
- Keep presentational components stateless where practical.
- Use feature hooks to encapsulate data and mutation logic.

## 3) Routes, Screens, and Responsibilities

Primary screens in current frontend:

- Login screen: authenticate tenant/user and establish session.
- Dashboard screen: show summary metrics and business snapshot.
- Product catalog screen: manage reusable product master data.
- Inventory screen: display stock records and quantities.
- Generate bill screen: select products, quantity/rate adjustments, tax values, submit invoice.
- View bills screen: list invoices and inspect status/details.

Route guard:

- ProtectedRoute ensures unauthenticated users are redirected away from protected modules.

## 4) API Integration Contract (Frontend View)

HTTP client helper:

- requestJSON handles credentials, content-type, JSON parsing, and normalized error throwing.

Expected response envelope pattern:

- status (string)
- result (payload object/array)
- optional metadata (length, pagination info later)

Error handling:

- UI should display error.message from requestJSON if present.
- fallback error text should be shown if no specific message exists.

## 5) Server State Strategy (React Query)

Query key conventions:

- auth/session: ["auth", "session"]
- dashboard summary: ["dashboard", "summary"]
- product catalog: ["productCatalog", { search, page }]
- inventory: ["inventory", { filters }]
- invoices: ["viewBills", { filters, page }]

Mutation conventions:

- create/update/delete actions use useMutation.
- onSuccess invalidates relevant query keys only.
- optimistic updates are optional and should be introduced only for stable CRUD paths.

Stale time recommendations:

- dashboard: 15 to 30 seconds
- product catalog/inventory: 30 to 60 seconds
- invoice detail pages: 30 seconds

Search strategy:

- when backend does not support server-side search params, fetch list with React Query and filter via select/useMemo client-side.
- when backend search endpoint exists, include search term in queryKey and query params.

## 6) Client State Strategy (Context and Reducers)

Use Context plus useReducer for:

- generate bill draft fields (invoice parties, taxes, pending flags, item draft edits)
- transient UI behavior (open/close panels, temporary local toggles)

Do not use Context reducer for:

- canonical server collections (products, inventory, invoice lists)
- server loading/error lifecycle

Recommended feature stores:

- billContextStore for invoice draft data only.
- searchItemsContextStore only if item-card local controls need cross-component sharing.

## 7) Auth and Session UX

Flow:

- login request sent with credentials include.
- session-aware routes rely on protected routing and user context.
- logout clears session and route access.

Frontend requirements:

- unauthorized API responses trigger user-friendly redirect or session reset.
- auth context should expose current user role and tenant-safe identifiers needed by UI.

## 8) Dashboard Module (Frontend)

Purpose:

- quickly visualize month-wise totals and pending business indicators.

UI states:

- skeleton/loader while fetching.
- cards/charts when successful.
- retry action on error.

Data contract:

- consumes tenant-scoped summary from backend dashboard endpoint.

## 9) Inventory Module (Frontend)

Purpose:

- read inventory list and support stock inspection/update flows.

UX requirements:

- filter/search by name, brand, HSN, or quantity status.
- clear empty state for no records.
- mutation success feedback and list refresh.

## 10) Product Catalog Module (Frontend)

Purpose:

- maintain reusable product records for billing.

UX requirements:

- create product form with validation.
- list cards/table with fast search.
- delete action with confirmation.

Integration:

- read list via React Query.
- mutations invalidate ["productCatalog"] keys.

## 11) Generate Bill Module (Frontend)

Purpose:

- compose stock_in/stock_out invoice draft and submit transactionally to backend.

Feature responsibilities:

- SearchItems fetches catalog products and supports interactive search/select.
- BillDetails captures invoice-level fields (parties, taxes, pending flags, totals).
- item cards capture qty/rate edits and feed bill draft.

Submission contract:

- payload shape must align with backend generate bill controller requirements.
- validation happens both client-side (fast feedback) and server-side (authoritative).

## 12) View Bills Module (Frontend)

Purpose:

- show invoice history with status and detailed drill-down.

UX requirements:

- filter by invoice type, bill state, date range, and invoice number.
- paginated list for large tenant data.
- clear tags for pending/partial/paid states.

## 13) Error, Loading, and Empty State Rules

- Every data screen must explicitly handle isLoading, isError, and empty results.
- No component should assume query data exists before guard checks.
- show concise retry affordance for recoverable fetch errors.
- keep error boundaries for unexpected render crashes as last resort.

## 14) Multi-Tenant and Security Guardrails (Frontend)

- Frontend must never send tenant_id for authorization decisions.
- tenant scoping is backend-owned via authenticated session/cookie.
- always call APIs with credentials include through requestJSON.
- avoid leaking tenant-sensitive data into local storage unless explicitly required and encrypted.

## 15) Definition of Done (Frontend)

- React Query is the single source of truth for server state.
- Generate bill screen supports search, item edits, and safe submit flow.
- Product catalog, inventory, dashboard, and view bills screens have stable loading/error/empty states.
- Query key structure is consistent and invalidations refresh only relevant data.
- No runtime crash from undefined query data access on first render.
- Auth-protected routes correctly block unauthenticated navigation.
- Frontend API contracts align with backend response envelopes and validation rules.
