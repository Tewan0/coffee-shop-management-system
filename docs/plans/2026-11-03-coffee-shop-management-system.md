# Coffee Shop Management System Implementation Plan

**Goal:** Build a production-grade Coffee Shop Management System for small coffee shops featuring an Owner POS, Menu Management, Sales History, and Analytics Dashboard, powered by a Go (Gin) REST backend, Next.js (App Router) frontend, and Firebase Cloud Firestore + Firebase Authentication (Google Sign-In).

**Architecture:** Monorepo with distinct `frontend/` (Next.js App Router, Tailwind CSS, shadcn/ui, Recharts) and `backend/` (Go Gin REST API with clean layer architecture: handlers, services, repositories, middleware). Frontend never communicates directly with Firestore for data; all business logic, validation, transaction-based order processing, and authorization are handled in Go. Authentication is handled by Firebase Auth Google Sign-In on the client, with ID Tokens verified in Go via Firebase Admin SDK against `OWNER_EMAIL`. All currency is computed in integer Satang (1 Baht = 100 Satang).

**Tech Stack:** 
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts, Firebase Client SDK (Auth only).
- Backend: Go 1.24+, Gin Framework, Firebase Admin SDK for Go, Cloud Firestore Client, Google API Go Client.
- Database & Auth: Firebase Cloud Firestore, Firebase Authentication with Google Sign-In.

---

## Global Constraints

- **Monorepo Structure**: Separate `frontend/` and `backend/` directories.
- **Single Backend Authority**: Next.js is frontend-only (no Next.js API Routes / Server Actions bypassing Go).
- **Direct Database Prohibition**: Frontend must never read/write Cloud Firestore directly; all data ops go through Go REST API.
- **Single User Role**: Store Owner only. Unauthorized Google accounts receive HTTP 403 Forbidden. Unauthenticated requests receive HTTP 401 Unauthorized.
- **Integer Satang Currency**: Prices and amounts stored as integers in Satang to eliminate floating-point inaccuracies.
- **Zero Frontend Trust for Pricing**: Go backend must re-query active products from Firestore in orders transaction to compute unit prices and totals.
- **Timezone**: All daily summaries and sales calculations adhere to `Asia/Bangkok` (UTC+7).
- **Security & Secrets**: Never hardcode credentials. Service account keys reside strictly on the backend via `GOOGLE_APPLICATION_CREDENTIALS`.

---

## Review Focus

1. **Tampered POS Cart Price/Subtotal**: Frontend sends modified prices or negative quantities. Expectation: Backend discards client prices, validates `quantity > 0`, loads active product prices from Firestore, and calculates server-side totals.
2. **Deactivated Product Ordered**: Product is set to inactive or deleted while in POS cart. Expectation: Order transaction fails with clear 400 Bad Request error.
3. **Non-Owner Google Sign-In**: Valid Google user signs in whose email is not in `OWNER_EMAIL`. Expectation: Backend returns 403 Forbidden; frontend displays unauthorized message and logs out.
4. **Timezone Boundary at Midnight**: Sales made at 23:59 UTC+7 vs 00:01 UTC+7. Expectation: Grouping correctly assigns orders to Asia/Bangkok date buckets.
5. **Duplicate Order Submission**: POS button double-clicked quickly. Expectation: Frontend disables button during submission and backend creates atomic orders.

---

## Task Breakdown

### Task 1: Scaffolding Monorepo & Backend Foundation (Phase 1)
- [ ] Initialize directory structure: `frontend/`, `backend/`, `docs/`, `firestore.rules`.
- [ ] Initialize Go module `coffee-shop-backend` in `backend/`.
- [ ] Install Go dependencies: Gin, Firebase Admin SDK, Cloud Firestore Client, godotenv.
- [ ] Implement clean architecture skeleton: `cmd/server/main.go`, `internal/config`, `internal/models`, `internal/routes`.
- [ ] Add public health check endpoint `GET /health`.
- [ ] Verify `go build` and test `GET /health`.

### Task 2: Frontend Setup with Next.js & UI Components (Phase 1)
- [ ] Initialize Next.js App Router project in `frontend/` with TypeScript and Tailwind CSS.
- [ ] Install `lucide-react`, `recharts`, `firebase`, `clsx`, `tailwind-merge`.
- [ ] Configure warm coffee shop theme (espresso, cream, warm amber) and Prompt font.
- [ ] Create UI primitives: Button, Input, Card, Badge, Dialog, Table, Skeleton, Toast.
- [ ] Configure `frontend/.env.example` and API client helper (`src/lib/api.ts`).
- [ ] Verify `npm run build` passes.

### Task 3: Firebase Configuration & Backend Repository Layer (Phase 2)
- [ ] Define Firestore models in `backend/internal/models/`: `User`, `Product`, `Order`, `OrderItem`.
- [ ] Write `firestore.rules` (deny client read/write directly) and `firestore.indexes.json`.
- [ ] Create repository interfaces: `ProductRepository`, `OrderRepository`, `UserRepository`.
- [ ] Implement Firestore repository in `backend/internal/repositories/firestore/` with transaction support.
- [ ] Implement in-memory/mock repository in `backend/internal/repositories/mock/` for unit tests and local testing when credentials are not yet linked.
- [ ] Verify Go compilation and write tests for repository contracts.

### Task 4: Google Authentication & Owner Authorization (Phase 3)
- [ ] Implement backend Auth Middleware (`backend/internal/middleware/auth.go`): verifies Firebase ID Token, checks `email_verified`, matches `OWNER_EMAIL`.
- [ ] Implement `GET /api/v1/auth/me` endpoint.
- [ ] Set up Firebase Client SDK in `frontend/src/lib/firebase.ts`.
- [ ] Create `AuthContext` and `useAuth` hook with Google Sign-In (`signInWithPopup`), token synchronization, and logout.
- [ ] Build `/login` page with coffee-themed branding, Google button, loading state, error alerts.
- [ ] Add route protection in Next.js layout (redirect to `/login` if unauthenticated).

### Task 5: Menu Management (Phase 4)
- [ ] Implement backend Product Service & Handlers:
  - `GET /api/v1/products` (filter category, search, activeOnly)
  - `POST /api/v1/products`
  - `PUT /api/v1/products/:id`
  - `PATCH /api/v1/products/:id/status` (toggle active)
- [ ] Backend validation: valid categories (Coffee, Tea, Other Drinks, Bakery), name required, priceSatang >= 0.
- [ ] Build Frontend `/menu` page:
  - Product list with category filters and search.
  - Add/Edit product modal with price input in Baht (converting to satang).
  - Active/Inactive toggle switch.
  - Confirmation modal for status changes.

### Task 6: POS & Order Processing (Phase 5)
- [ ] Implement backend Order Service & Handler:
  - `POST /api/v1/orders` (atomic transaction, server-side price lookup, validation of items & active status).
- [ ] Unit tests for Order Service (tampered price ignored, inactive product rejected, empty cart rejected).
- [ ] Build Frontend `/pos` page:
  - Product catalog grid with category filters and quick search.
  - Interactive Cart sidebar: quantity adjustment, item deletion, live subtotal/total in Baht.
  - Order confirmation dialog with bill summary.
  - Double-click prevention (submission state lock) & instant toast feedback.

### Task 7: Dashboard & Sales History (Phase 6)
- [ ] Implement backend endpoints:
  - `GET /api/v1/dashboard/summary` (Today's revenue, order count, items sold, best seller, 7-day sales grouped by Asia/Bangkok date, recent orders).
  - `GET /api/v1/orders` (paginated, date range filtered, newest first).
  - `GET /api/v1/orders/:id` (order details with items breakdown).
- [ ] Build Frontend `/` (Dashboard):
  - 4 Key Metric Cards.
  - Recharts 7-Day Revenue bar/line chart.
  - Recent sales table.
- [ ] Build Frontend `/orders` (Sales History):
  - Date filter controls (start date, end date).
  - Orders table with Thai timestamp formatting and total Baht.
  - Order details modal showing snapshot of unit prices and quantities.

### Task 8: Verification, Polish & Documentation (Phase 7)
- [ ] Run Go unit test suite (`go test -v ./...`).
- [ ] Run Next.js production build (`npm run build`) and linting.
- [ ] Create detailed `README.md` covering architecture, setup guides, environment variables, API docs, and verification status.
- [ ] Deliver complete project summary to the user.

