# Middager

A mobile-first dinner planning and shopping list app for two concurrent users. Built with Next.js 14, deployed on Vercel.

## Features

### 🍽️ Dinner Library
- Create and manage dinner recipes with ingredients
- Free-text units (stk, kg, dl, etc.)
- Auto-complete suggestions based on history
- Notes field for cooking instructions

### 📅 Week Planner
- 7-day grid view (Monday–Sunday)
- Drag-free tap-to-assign interface
- Copy entire week to the next
- Historical snapshots preserved even if dinners are deleted

### 🛒 Shopping List
- **Auto-populate** from week plan ingredients
- **Manual add** with smart suggestions
- **Conservative merge**: Only items with matching name AND unit are combined
- **Hide/Restore**: Completed items move to a collapsible "hidden" section
- **Session reset**: "Tøm og send uke" clears hidden memory for a fresh start
- **Clipboard export**: Copies as `* {qty} {unit} {name}` for Apple Reminders

### ⚙️ Settings & Data Safety
- **Export JSON**: Full backup of all data
- **Import JSON**: Validated restore with UUID checks
- **Delete all dinners**: Preserves week plan snapshots
- **Reset app**: 2-step confirmation, wipes all data

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Vercel Postgres |
| ORM | Drizzle |
| Styling | Tailwind CSS |
| Data Fetching | SWR (revalidate on focus, no polling) |

## Getting Started

### Prerequisites
- Node.js 18+
- Vercel account (for Postgres)

### Installation

```bash
# Clone
git clone https://github.com/your-repo/middager.git
cd middager

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your Vercel Postgres credentials and ACCESS_SECRET

# Push schema to database
npx drizzle-kit push

# Run dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Vercel Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Direct connection for migrations |
| `ACCESS_SECRET` | Shared password for the access gate |

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Login/logout
│   │   ├── data/         # Export, import, reset
│   │   ├── dinners/      # CRUD for dinners
│   │   ├── events/       # Event log API
│   │   ├── shopping-list/# Shopping list operations
│   │   └── week-plans/   # Week plan operations
│   ├── handleliste/      # Shopping list page
│   ├── innstillinger/    # Settings page
│   ├── middager/         # Dinner list + detail pages
│   ├── ukeplan/          # Week planner page
│   └── login/            # Login page
├── components/
│   ├── dinners/          # Dinner-related UI
│   ├── layout/           # Navigation, headers
│   ├── shopping-list/    # Shopping list UI
│   ├── ui/               # Shared components (Button, Modal, Toast)
│   └── week-plan/        # Week planner UI
├── lib/
│   ├── ai/               # AI integration placeholders
│   ├── db/               # Drizzle client and schema
│   ├── domain/           # Business logic (dinners, shopping, weekPlans)
│   └── utils/            # Helpers (date, toast)
└── middleware.ts         # Auth gate
```

## API Reference

All API routes are protected by the auth middleware and return JSON. Unauthorized requests receive `401 { error: 'unauthorized' }`.

### Dinners
- `GET /api/dinners` — List all dinners
- `POST /api/dinners` — Create dinner
- `GET /api/dinners/[id]` — Get dinner by ID
- `PUT /api/dinners/[id]` — Update dinner
- `DELETE /api/dinners/[id]` — Delete dinner
- `DELETE /api/dinners` — Delete all dinners

### Week Plans
- `GET /api/week-plans?year=&week=` — Get or create week plan
- `POST /api/week-plans/assign` — Assign dinner to day
- `POST /api/week-plans/clear-day` — Clear day assignment
- `POST /api/week-plans/copy` — Copy week to next

### Shopping List
- `GET /api/shopping-list` — Get active and hidden items
- `POST /api/shopping-list/add` — Add items manually
- `PATCH /api/shopping-list/[id]` — Update item
- `PATCH /api/shopping-list/[id]/hide` — Hide/restore item
- `DELETE /api/shopping-list` — Clear session
- `POST /api/shopping-list/clear-send` — Atomic clear + send week
- `POST /api/shopping-list/send-day` — Send day ingredients
- `POST /api/shopping-list/send-week` — Send week ingredients

### Data Management
- `GET /api/data/export` — Download JSON backup
- `POST /api/data/import` — Restore from JSON
- `POST /api/data/reset` — Wipe all data

### Events (Internal)
- `GET /api/events?limit=&offset=&type=&from=&to=` — Paginated event log

## Design Principles

### V4 Invariants
1. **Truthful UI**: No fake data, no placeholders, clear error states
2. **Conservative merge**: Name + Unit must match for quantity merge
3. **Hidden exclusion**: Hidden items stay hidden within a session
4. **Session reset**: Clear deletes ALL items (fresh start)
5. **No polling**: SWR revalidates on focus only
6. **Snapshot preservation**: Week plans store `dinnerNameSnapshot`

### Input Validation
- Dinner name: max 80 chars
- Ingredient name: max 80 chars
- Unit: max 20 chars
- Notes: max 2000 chars

### Security
- Cookie-based auth with `httpOnly` and `Secure` flags
- Timing-safe password comparison
- JSON 401 responses for API routes (no redirects)

## AI Readiness

The app logs all major user actions to an `event_log` table:
- `dinner_created`, `dinner_updated`
- `dinner_assigned`
- `shopping_items_added`, `shopping_item_removed`, `shopping_item_restored`
- `shopping_list_cleared`, `shopping_list_reset_with_week`
- `week_copied`

Hidden `.ai-suggestion` placeholders in `DayCell` provide context for future AI features.

## License

Private project. All rights reserved.
