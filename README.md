# BizFlow

It is a multi-tenant inventory, billing, dealer, and ledger management platform designed for distributors and small businesses.

It provides a centralized system for managing inventory, suppliers, customers, invoices, payments, and business analytics from a single dashboard.


---

## What BizFlow Provides

### 📦 Inventory Management

* Product Catalog management
* Inventory tracking
* Low-stock monitoring
* Out-of-stock tracking
* Dealer-linked products
* Custom unit support

### 🧾 Billing & Invoicing

* Purchase invoices (`stock_in`)
* Sales invoices (`stock_out`)
* Invoice editing
* Payment tracking
* Invoice printing
* Dealer-linked billing workflow

### 🤝 Dealer Management

* Customer management
* Supplier management
* Dealer profiles
* Invoice history
* Dealer ledgers
* Receivable and payable tracking

### 📊 Dashboard & Insights

* Revenue insights
* Purchase insights
* Outstanding dues
* Inventory insights
* Date-range analytics
* Drill-down reporting

### 📑 Reporting

* Business reports
* Invoice exports
* ZIP invoice downloads

---

## Tech Stack

### Frontend

* React 19
* Vite
* React Router
* TanStack React Query
* Context API
* Tailwind CSS

### Backend

* Express.js
* Sequelize ORM
* JWT Authentication
* Cookie-based session handling

### Database

* Supabase ( uses PosgresSQL internally ) // using just as a hosted db

### Infrastructure

* Supabase Storage (QR uploads)
* Render Deployment

---

## Core Business Concepts

```text
Tenant
 └── Dealers
      ├── Customers (stock_out)
      └── Suppliers (stock_in)

Product Catalog
      │
      ▼
Inventory

Dealers
      │
      ▼
Invoices
      │
      ▼
Payments
      │
      ▼
Ledger
```

### Tenant

A business account using BizFlow.

### Dealer

Represents either:

* Customer (`stock_out`)
* Supplier (`stock_in`)

### Product Catalog

Master list of products available to the business.

### Inventory

Tracks currently available stock.

### Invoice

Generated bill linked to a dealer.

### Ledger

Financial history of a dealer including invoices and payments.

---

## Local Development

### Requirements

* Node.js 20+
* npm
* db (supabase project or a hosted postgreSQL)

### Clone Repository

```bash
git clone <your-fork-or-repository-url>
cd bizflow
```

---

## Backend Setup

Install dependencies:

```bash
cd backend
npm install
```

Create a `.env.dev and .env.prod` file:

```env
(Adjust these according to dev or prod env)
PORT=8080
JWT_SECRET=your-secret
JWT_EXPIRES_IN=90d
SUPABASE_CONNECTION_STRING=
SUPABASE_PASSWORD=

CORS_ORIGINS=http://localhost:5173 ( for ex. for prod env u will put your hosted frontend link here)
``` 

Start backend:

```bash
npm run dev
npm run prod
```

Backend runs on:

```text
http://localhost:8080
```

---

## Frontend Setup

Install dependencies:

```bash
cd frontend
npm install
```

Create a `.env.dev and .env.prod` file:

```env

(Adjust according to dev or prod env)

VITE_API_URL=http://localhost:8080 ( for ex. in prod you will put your hosted backend link from render.com or platform u choose )
VITE_STOCK_IN=stock_in
VITE_STOCK_OUT=stock_out
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_QR_BUCKET=images
```

Start frontend:

```bash
npm run dev
npm run prod
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Important Business Rules

### Dealer-First Billing

Every invoice must belong to exactly one dealer.

### Invoice Snapshot Rule

Dealer information is copied into the invoice when it is created.

Updating dealer information must never modify historical invoices.

### Inventory Rules

```text
Stock In  → Increase inventory quantity

Stock Out → Decrease inventory quantity
```

### Payment Rules

```text
No payment       → Pending

Partial payment  → Partial

Full payment     → Paid
```

### Ledger Rules

Dealer ledgers are generated from:

* Invoices
* Payments

and represent the complete financial history of a dealer.

---

## Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/my-feature
```

3. Make your changes
4. Test locally
5. Commit your changes

```bash
git commit -m "feat: add dealer report export"
```

6. Push your branch
7. Open a Pull Request

If you are planning a major change, consider opening an issue first to discuss the implementation approach.

---

## Roadmap

### Completed

* Dealer Management System
* Dealer Ledger System
* Inventory Management
* Product Catalog
* Dashboard Analytics
* Invoice Editing
* Dealer-First Billing Flow
* Payment Tracking
* Separate Purchase/Sales Invoice Sequences
* Print Improvements

### Planned

* Forgot Password (not fully working yet )
* Email Recovery Flow
* Enhanced Reporting
* Excel Export* 
* Tenant inviting employees flow

---

## Notes

BizFlow is designed to help distributors and small businesses manage inventory, billing, customers, suppliers, and financial tracking from a single platform.

Contributions, feedback, bug reports, and feature suggestions are welcome.
