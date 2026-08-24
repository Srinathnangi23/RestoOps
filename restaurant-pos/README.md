# Restaurant POS & Smart Management System

A full-stack restaurant management system: cashier POS + billing, inventory &
recipe-driven automatic stock deduction, expense tracking, and an owner
dashboard with real profit/loss calculated from actual sales data.

Stack: **React (Vite)** frontend · **Node.js / Express** backend ·
**PostgreSQL** database · **JWT** auth with role-based access (ADMIN / CASHIER).

This is a separate, independent project from any previous Expense Tracker app.

---

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a hosted instance — Supabase, Neon, Railway, etc.)
- npm

## 2. Database setup

```bash
# create the database
createdb restaurant_pos

# load schema + demo data
psql -d restaurant_pos -f database/schema.sql
psql -d restaurant_pos -f database/seed.sql
```

## 3. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env with your real DB credentials and a random JWT_SECRET
npm install
npm run seed:users   # creates admin@restaurant.com / cashier@restaurant.com (password: Password123)
npm run dev          # starts on http://localhost:5000
```

## 4. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev           # starts on http://localhost:5173
```

Open http://localhost:5173 and log in with:

| Role    | Email                  | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@restaurant.com    | Password123 |
| Cashier | cashier@restaurant.com  | Password123 |

## 5. How the core flow works

1. Cashier adds items to the cart on the POS screen.
2. On checkout, the backend opens a single **database transaction** that:
   validates every recipe ingredient has enough stock → creates the order and
   order items → records the payment → deducts each ingredient from
   `inventory` → writes `inventory_transactions` rows → computes COGS →
   marks the order `COMPLETED`.
3. If any step fails (e.g. insufficient stock), the **entire transaction rolls
   back** — no partial sale, no partial inventory deduction.
4. The Owner Dashboard and Profit & Loss pages query this same data live —
   nothing is hard-coded.

## 6. Pushing to GitHub

```bash
cd restaurant-pos
git init
git add .
git commit -m "Initial commit: Restaurant POS & Smart Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.env` files are excluded via `.gitignore` — never commit real credentials.
Push `.env.example` only, and set the real values as secrets on your
deployment platform instead.

## 7. Deployment (recommended split)

Because this app has a Postgres database + a stateful Node backend + a static
frontend, the simplest reliable combo is:

- **Database**: [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free managed Postgres) — run `schema.sql` and `seed.sql` against it.
- **Backend**: [Railway](https://railway.app) or [Render](https://render.com) — deploy `backend/` as a Node web service, set the `DB_*` and `JWT_SECRET` env vars from step 6.
- **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — deploy `frontend/`, set `VITE_API_URL` to your deployed backend's `/api` URL.

All three connect to the same GitHub repo (steps above), and each platform
auto-redeploys on every push to `main` once connected.

## 8. Project structure

```
restaurant-pos/
├── backend/        Express API, PostgreSQL access, business logic
├── frontend/        React (Vite) app — POS, dashboard, admin pages
├── database/        schema.sql, seed.sql
└── README.md
```

## 9. Notes on scope

This build covers the full connected flow end-to-end (auth, menu, categories,
ingredients, recipes with live cost/margin calculation, POS + cart + checkout,
transactional inventory deduction, stock purchase/wastage/adjustments with a
full transaction log, expenses, profit & loss, dashboard, reports with CSV
export, and role-based order history). Kitchen Order Ticket (KOT) screen and
thermal-printer-specific formatting were not included in this pass — the
receipt is print-ready via the browser's print dialog and can be extended to
a KOT board using the same `orders`/`order_items` tables if you want that
added next.
