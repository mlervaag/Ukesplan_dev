# Ukesplan (v4.2)

A mobile-first dinner planning, shopping list, and recurring tasks app for families. Built with Next.js 14, deployed on Vercel.

## Features

### 🍽️ Dinner Library
- Create and manage dinner recipes with ingredients
- Free-text units (stk, kg, dl, etc.)
- Auto-complete suggestions based on history
- Custom emoji icons for each dinner
- Notes field for cooking instructions

### 📅 Week Planner
- 7-day grid view (Monday–Sunday)
- Drag-free tap-to-assign interface
- **Todos integration**: Each day shows dinner + todos
- Copy entire week to the next
- Historical snapshots preserved even if dinners are deleted

### ✅ Todos (Gjøremål)
- **Recurring templates**: Define tasks that repeat weekly or bi-weekly
- **Ad-hoc todos**: Add one-time tasks directly to any day
- **Responsible assignment**: Magnus, Nansy, or Begge (Both)
- **Time scheduling**: Optional HH:MM time for each task
- **Hidden/Restore**: "Tøm liste" hides items, restorable later
- **Clipboard export**: ISO format for iOS Shortcuts integration

### 🛒 Shopping List (Handleliste)
- **Auto-populate** from week plan ingredients
- **Manual add** with smart suggestions
- **Conservative merge**: Only items with matching name AND unit are combined
- **Hide/Restore**: Completed items move to a collapsible "hidden" section
- **Session reset**: "Tøm og send uke" clears hidden memory for a fresh start
- **Clipboard export**: Copies as `* {qty} {unit} {name}` for Apple Reminders

### 📱 iOS Shortcuts Integration
Both Todos and Shopping List support deep linking to iOS Shortcuts:
- **Todos shortcut**: Must be named exactly `"Gjøremål til Påminnelser"`
- **Shopping List shortcut**: Must be named exactly `"Middager til Påminnelser"`

**How it works:**
1. Tap "Kopier liste" to copy items to clipboard
2. Tap "Åpne Påminnelser" / "Send til Påminnelser" to launch the shortcut
3. The shortcut should split clipboard by newline and create reminders

**Clipboard format (Todos):**
```
2026-01-07 14:30 | Handle mat | Magnus
2026-01-08 | Rydde garasjen | Begge (ferdig)
```

### ⚙️ Settings & Data Safety
- **Theme**: Light, Dark, or System
- **Logout**: End session and redirect to login
- **Export JSON**: Full backup (schemaVersion 3)
- **Import JSON**: Validated restore with UUID checks and content validation
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
git clone https://github.com/your-repo/ukesplan.git
cd ukesplan

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
│   │   ├── todo-templates/# Recurring todo templates
│   │   ├── todos/        # Todo CRUD + clear-week
│   │   └── week-plans/   # Week plan operations
│   ├── gjoremal/         # Todos page + recurring templates
│   ├── handleliste/      # Shopping list page
│   ├── innstillinger/    # Settings page
│   ├── middager/         # Dinner list + detail pages
│   ├── ukeplan/          # Week planner page
│   └── login/            # Login page
├── components/
│   ├── dinners/          # Dinner-related UI
│   ├── layout/           # Navigation, headers, MoreMenu
│   ├── shopping-list/    # Shopping list UI
│   ├── todos/            # Todos UI (list, actions, templates)
│   ├── ui/               # Shared components (Button, Modal, Toast)
│   └── week-plan/        # Week planner UI (DayCell, DayTodosBlock)
├── lib/
│   ├── db/               # Drizzle client, schema, migrations
│   ├── domain/           # Business logic (dinners, shopping, weekPlans, todos)
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
- `GET /api/week-plans?year=&week=` — Get or create week plan (includes todos)
- `POST /api/week-plans/assign` — Assign dinner to day
- `POST /api/week-plans/clear-day` — Clear day assignment
- `POST /api/week-plans/copy` — Copy week to next

### Todos
- `GET /api/todos?year=&week=&includeHidden=` — Get todos for a week
- `POST /api/todos` — Create ad-hoc todo
- `PATCH /api/todos/[id]` — Update todo (completion, hidden, etc.)
- `DELETE /api/todos/[id]` — Delete todo
- `POST /api/todos/clear-week` — Hide all todos for a week

### Todo Templates
- `GET /api/todo-templates` — List all recurring templates
- `POST /api/todo-templates` — Create template
- `PATCH /api/todo-templates/[id]` — Update template
- `DELETE /api/todo-templates/[id]` — Delete template

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
- `GET /api/data/export` — Download JSON backup (schemaVersion 3)
- `POST /api/data/import` — Restore from JSON (validates content)
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
6. **Snapshot preservation**: Week plans store `dinnerNameSnapshot` and `dinnerIconSnapshot`
7. **JSON 401**: All unauthorized API requests return JSON, never redirect

### Input Validation
- Dinner name: max 120 chars
- Ingredient name: max 120 chars
- Unit: max 20 chars
- Notes: max 1000 chars
- Todo title: max 120 chars
- Time format: HH:MM (24-hour)
- Responsible: `he`, `she`, or `both`
- intervalWeeks: 1–52

### Security
- Cookie-based auth with `httpOnly`, `Secure`, and `sameSite: strict` flags
- Timing-safe password comparison (`crypto.timingSafeEqual`)
- 1-second delay on failed login attempts (brute force mitigation)
- JSON 401 responses for API routes (no redirects)
- Transactional import with full validation before commit

## Database Schema

### Tables
- `dinners` — Dinner recipes with name, notes, icon
- `ingredients` — Linked to dinners with quantity and unit
- `week_plans` — Year/week indexed plans
- `week_plan_days` — 7 days per plan with dinner snapshots
- `todo_templates` — Recurring task definitions
- `todos` — Task occurrences with hidden flag, unique on (template_id, week_plan_day_id)
- `shopping_list_items` — Items with normalized key for merging
- `event_log` — Audit trail for all mutations

### Migrations
Located in `lib/db/migrations/`:
- `0000_right_giant_man.sql` — Initial schema
- `0001_add_todos.sql` — Todos and templates tables
- `0002_add_hidden_to_todos.sql` — Hidden column for soft clear

## AI Readiness

The app logs all major user actions to an `event_log` table:
- `dinner_created`, `dinner_updated`, `dinner_deleted`
- `dinner_assigned`, `day_cleared`
- `shopping_items_added`, `shopping_item_removed`, `shopping_item_restored`
- `shopping_list_cleared`, `shopping_list_reset_with_week`
- `week_copied`
- `todo_template_created`, `todo_template_updated`, `todo_template_deleted`
- `todo_created`, `todo_completed`, `todo_uncompleted`, `todo_deleted`
- `todo_hidden`, `todo_restored`, `week_todos_cleared`
- `recurring_todo_generated`
- `data_imported`

Hidden `.ai-suggestion` placeholders in `DayCell` provide context for future AI features.

## License

Private project. All rights reserved.
