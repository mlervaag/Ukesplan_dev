# ROADMAP_TODOS.md — Adding Todos to Middager

> **Status:** Draft for review  
> **Author:** Product Architecture Review  
> **Last Updated:** 2026-01-07  
> **Revision:** 2 (locked decisions applied)

---

## A) Goals and Non-Goals

### Goals

1. **Day-level todos in week plan** — Each day displays both dinner and a list of todos as two vertical blocks
2. **Recurring todo templates** — Users can define weekly repeating tasks with responsible person assignment
3. **Ad hoc todos** — Quick one-off todos added directly to specific days
4. **Weekly todo export** — A dedicated view for this week's todos with clipboard copy and iOS Shortcuts integration
5. **Multi-user safety** — Respect existing SWR/cache patterns, avoid race conditions
6. **Event logging** — All todo operations logged for parity with dinners (MVP requirement)

### Non-Goals

- No changes to dinner or shopping list semantics
- No user accounts or per-user views (continue shared household model)
- No push notifications (continue iOS Shortcuts pattern)
- No todo templates beyond weekly recurrence in MVP
- No todo subtasks or checklists within a todo

### Invariants to Preserve

| # | Invariant | How preserved |
|---|-----------|---------------|
| 1 | Shopping list session + hidden semantics | No changes to shopping list schema or domain |
| 2 | Conservative merge (name + unit) | Shopping list untouched |
| 3 | Week plan copy uses snapshots | Dinner snapshots unchanged; see Copy Week Behavior below |
| 4 | `/api/*` unauthorized returns JSON 401 | Middleware unchanged; new routes auto-protected |
| 5 | Export/import transactional + schemaVersioned | Deferred to final iteration after data model stabilizes |

### Copy Week Behavior (Locked Decision)

When `copyWeek` is invoked:
- **Dinners:** Copy as today (dinner snapshots are copied, not regenerated)
- **Recurring todos:** NOT copied — they auto-generate for the target week based on templates
- **Ad hoc todos:** NOT copied — they are day-specific and do not transfer

**Consequence:** A copied week will have the same dinners but a fresh set of recurring todos generated from current templates. Any ad hoc todos from the source week are left behind.

---

## B) Data Model Proposal

### New Tables

#### `todo_templates` — Recurring todo definitions

```typescript
// lib/db/schema.ts addition
export const todoTemplates = pgTable('todo_templates', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),                     // max 120 chars
    dayOfWeek: integer('day_of_week').notNull(),        // 1-7 (Mandag-Søndag)
    time: text('time'),                                  // HH:MM format, nullable
    responsible: text('responsible').notNull(),          // 'he' | 'she' | 'both'
    repeatPattern: text('repeat_pattern').notNull().default('weekly'), // 'weekly' for MVP
    intervalWeeks: integer('interval_weeks').default(1), // 1 = every week, 2 = every other
    startDate: timestamp('start_date').notNull(),        // recurrence eligibility anchor
    endDate: timestamp('end_date'),                      // nullable, recurrence stops after
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### `todos` — Concrete todo occurrences

```typescript
export const todos = pgTable('todos', {
    id: uuid('id').primaryKey().defaultRandom(),
    weekPlanDayId: uuid('week_plan_day_id').notNull()
        .references(() => weekPlanDays.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
        .references(() => todoTemplates.id, { onDelete: 'set null' }), // null for ad-hoc
    title: text('title').notNull(),                      // snapshot from template or ad-hoc input
    time: text('time'),                                   // HH:MM format, nullable
    responsible: text('responsible').notNull(),           // 'he' | 'she' | 'both'
    completed: boolean('completed').default(false),
    position: integer('position').notNull().default(0),  // for ordering within day
    source: text('source').notNull().default('adhoc'),   // 'adhoc' | 'recurring'
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Relations

```typescript
export const todosRelations = relations(todos, ({ one }) => ({
    weekPlanDay: one(weekPlanDays, {
        fields: [todos.weekPlanDayId],
        references: [weekPlanDays.id],
    }),
    template: one(todoTemplates, {
        fields: [todos.templateId],
        references: [todoTemplates.id],
    }),
}));

// Extend existing weekPlanDaysRelations
export const weekPlanDaysRelations = relations(weekPlanDays, ({ one, many }) => ({
    weekPlan: one(weekPlans, { ... }), // existing
    dinner: one(dinners, { ... }),     // existing
    todos: many(todos),                 // NEW
}));
```

### Week Identity

Todos are linked to `weekPlanDays.id`, which is already scoped to a specific `weekPlans` record (year + week). This maintains consistency with existing patterns.

### Idempotency Strategy for Recurring Todos (Locked: Option A with startDate)

**Approach:** Generate recurring todo occurrences on-demand when a week plan is fetched.

1. When `getOrCreateWeekPlan(year, week)` is called, after creating/fetching the week plan:
2. Compute the actual date for each day in the week (using existing `lib/utils/date.ts` helpers)
3. For each day, query `todoTemplates` where:
   - `dayOfWeek` matches
   - `startDate <= day's actual date`
   - `endDate` is null OR `endDate >= day's actual date`
   - `intervalWeeks` eligibility: `Math.floor((dayDate - startDate) / 7) % intervalWeeks === 0`
4. For each matching template, check if a `todos` record exists with that `templateId` + `weekPlanDayId`
5. If not, insert a new todo occurrence with `source: 'recurring'`, snapshotting title/time/responsible

**Idempotency guarantee:** The `templateId + weekPlanDayId` combination uniquely identifies a recurring occurrence. Re-fetching the same week will not create duplicates.

**Why startDate-based:**
- No need to track "template_start_week" as arbitrary anchor
- Interval calculation is intuitive (weeks since template was created)
- Handles templates created mid-week correctly

---

## C) API Design

### New Routes

| Route | Method | Semantics |
|-------|--------|-----------|
| `app/api/todo-templates/route.ts` | GET | List all recurring templates |
| `app/api/todo-templates/route.ts` | POST | Create new template (sets `startDate` to today) |
| `app/api/todo-templates/[id]/route.ts` | GET | Get single template |
| `app/api/todo-templates/[id]/route.ts` | PATCH | Update template |
| `app/api/todo-templates/[id]/route.ts` | DELETE | Delete template |
| `app/api/todos/route.ts` | GET | Get todos for a week (`?year=&week=`) |
| `app/api/todos/route.ts` | POST | Create ad-hoc todo |
| `app/api/todos/[id]/route.ts` | PATCH | Update todo (title, time, completed) |
| `app/api/todos/[id]/route.ts` | DELETE | Delete todo |
| `app/api/week-plans/route.ts` | GET | **Modify**: Include todos in response, trigger recurring generation |

### Auth & Cache Headers

All new routes follow existing patterns from `app/api/dinners/route.ts`:
- `export const dynamic = 'force-dynamic';`
- Response headers: `{ 'Cache-Control': 'no-store, must-revalidate' }`
- Middleware auto-protects `/api/*` → JSON 401 on unauthorized

### Example: week-plans GET response extension

```json
{
  "id": "...",
  "year": 2026,
  "week": 2,
  "days": [
    {
      "id": "day-uuid",
      "dayOfWeek": 1,
      "dinnerId": "...",
      "dinnerNameSnapshot": "Taco",
      "dinnerIconSnapshot": "🌮",
      "todos": [
        {
          "id": "todo-uuid",
          "title": "Vaske bad",
          "time": "09:00",
          "responsible": "she",
          "completed": false,
          "source": "recurring"
        }
      ]
    }
  ]
}
```

---

## D) UX Design

### Bottom Navigation Strategy (Locked Decision)

Current repo pattern from `components/layout/BottomNav.tsx`:
```typescript
const navItems = [
    { label: 'Ukeplan', href: '/ukeplan', icon: Calendar },
    { label: 'Handleliste', href: '/handleliste', icon: ShoppingCart },
    { label: 'Middager', href: '/middager', icon: Utensils },
    { label: 'Innstillinger', href: '/innstillinger', icon: Settings },
];
```

**New layout (4 primary tabs):**
| Position | Label | Icon | Route |
|----------|-------|------|-------|
| 1 | Ukeplan | `Calendar` | `/ukeplan` |
| 2 | Handleliste | `ShoppingCart` | `/handleliste` |
| 3 | Gjøremål | `CheckSquare` | `/gjoremal` |
| 4 | Mer | `MoreHorizontal` | Opens sheet |

**"Mer" sheet contents:**
- Middager → `/middager`
- Faste gjøremål → `/gjoremal/faste`
- Innstillinger → `/innstillinger`

**Rationale:**
- Todos (weekly export list) gets primary real estate as it's a frequent action
- Dinners and recurring templates are less frequent, moved to More
- Settings was already low-frequency, stays in More
- Preserves 4-icon bottom nav for clean mobile UX

### Week Plan Day Cell Layout (Locked Decision: Two Vertical Blocks)

**Updated DayCell structure:**

```
┌─────────────────────────────────────┐
│ Mandag                        [···] │  ← header (existing)
├─────────────────────────────────────┤
│                                     │
│        🌮 Taco                      │  ← DINNER BLOCK
│                                     │  ← tappable to open DinnerPicker
├─────────────────────────────────────┤
│                                     │
│  ☑ 09:00 Vaske bad (H)             │  ← TODOS BLOCK
│  ☐ Sette ut søppel (B)              │
│  ────────────────────               │
│  [+ Legg til]                       │  ← add ad-hoc todo
│                                     │
└─────────────────────────────────────┘
```

**Key points:**
- Two distinct vertical blocks, no side-by-side columns on mobile
- Dinner block: centered icon + name, tappable for picker
- Todos block: checkbox list with time/responsible badges
- Each todo row: `[checkbox] [time if set] [title] [responsible badge]`
- Tapping todo opens edit overlay
- "+ Legg til" opens AddTodoOverlay

### Add Todo Overlay (Ad Hoc)

Use existing `components/ui/Modal.tsx` with `fullScreen` mode for keyboard safety.

**Fields:**
- Title (required, max 120 chars)
- Time (optional, HH:MM picker)
- Responsible (required, segmented control: Han | Henne | Begge)

**Pattern:** Match `components/dinners/DinnerForm.tsx` input styling and validation.

### Recurring Todo Management

**Accessed via:** Mer → "Faste gjøremål"

**Page layout:** `app/gjoremal/faste/page.tsx`

```
┌─────────────────────────────────────┐
│ Faste gjøremål              [+ Ny]  │
├─────────────────────────────────────┤
│ Mandag                              │
│   • 09:00 Vaske bad (H)        [✎] │
│   • Levere Joakim (Han)        [✎] │
├─────────────────────────────────────┤
│ Tirsdag                             │
│   • Tømme oppvaskmaskin (B)    [✎] │
├─────────────────────────────────────┤
│ ...                                 │
└─────────────────────────────────────┘
```

**Add/Edit Template Overlay fields:**
- Title (required)
- Day of week (required, weekday picker)
- Time (optional)
- Responsible (required)
- Repeat: Every week / Every other week
- End date (optional)

Note: `startDate` is set automatically to today on creation; not user-editable.

### Weekly Todo List Export Page

**Route:** `app/gjoremal/page.tsx`  
**Bottom nav:** "Gjøremål" tab (primary)

**Layout matches `app/handleliste/page.tsx` pattern:**

```
┌─────────────────────────────────────┐
│ Ukens gjøremål                      │
├─────────────────────────────────────┤
│ Mandag                              │
│   ☐ 09:00 Vaske bad (H)            │
│   ☑ Sette ut søppel (B)            │
├─────────────────────────────────────┤
│ Tirsdag                             │
│   ☐ Tømme oppvaskmaskin (Han)      │
├─────────────────────────────────────┤
│ ...                                 │
├─────────────────────────────────────┤
│ [Kopier liste]                      │  ← primary button
│ [Send til Påminnelser]              │  ← iOS Shortcuts deep link
│ ℹ️ Lag en snarvei som leser...      │
└─────────────────────────────────────┘
```

### Clipboard Line Format

One line per todo, matching shopping list simplicity:

```
Vaske bad 09:00 (henne)
Sette ut søppel (begge)
Tømme oppvaskmaskin (han)
```

Format: `{title} {time if set} ({responsible})`

### Responsible Badge Rendering

| Value | Display | Badge |
|-------|---------|-------|
| `he` | Han | `H` pill (blue) |
| `she` | Henne | `H` pill (pink) |
| `both` | Begge | `B` pill (purple) |

---

## E) Event Logging (MVP Requirement)

All todo operations MUST be logged to `eventLog` table for parity with dinner operations.

### Minimum Event Coverage

| Event Type | When | Payload |
|------------|------|---------|
| `todo_created` | Ad-hoc todo created | `{ todoId, weekPlanDayId, title, source: 'adhoc' }` |
| `todo_completed` | Todo marked as done | `{ todoId, title }` |
| `todo_uncompleted` | Todo unmarked | `{ todoId, title }` |
| `todo_deleted` | Todo deleted | `{ todoId, title }` |
| `todo_template_created` | Recurring template created | `{ templateId, title, dayOfWeek }` |
| `todo_template_updated` | Template edited | `{ templateId, title }` |
| `todo_template_deleted` | Template deleted | `{ templateId, title }` |
| `recurring_todo_generated` | Recurring instance created | `{ todoId, templateId, weekPlanDayId }` |

---

## F) Iteration Plan

### Iteration 1: Data Model Foundation

**Scope:**
- Add `todoTemplates` and `todos` tables to schema
- Create migration file
- Basic domain service (`lib/domain/todos.ts`) with validation

**Files touched:**
- `lib/db/schema.ts`
- `lib/db/migrations/0001_*.sql` (new)
- `lib/domain/todos.ts` (new)

**Risks:**
- Migration failure → Mitigation: additive-only migration, no existing data affected

**Verification:**
1. `npm run build` succeeds
2. Run migration: `npx drizzle-kit push:pg`
3. Query new tables directly: `SELECT * FROM todos` returns empty

**Definition of Done:**
- Schema compiles
- Migration applies cleanly
- No TypeScript errors

---

### Iteration 2: Todo API Routes

**Scope:**
- `GET/POST /api/todo-templates`
- `GET/PATCH/DELETE /api/todo-templates/[id]`
- `GET/POST /api/todos`
- `PATCH/DELETE /api/todos/[id]`
- Extend `GET /api/week-plans` to include todos in response
- Implement recurring generation with startDate-based logic

**Files touched:**
- `app/api/todo-templates/route.ts` (new)
- `app/api/todo-templates/[id]/route.ts` (new)
- `app/api/todos/route.ts` (new)
- `app/api/todos/[id]/route.ts` (new)
- `lib/domain/todos.ts`
- `lib/domain/weekPlans.ts` (extend `getOrCreateWeekPlan`)

**Risks:**
- Recurring generation logic complexity → Mitigation: start with weekly-only (intervalWeeks=1)
- Race condition on concurrent week fetches → Mitigation: check-before-insert pattern

**Verification:**
1. `curl -X GET /api/todo-templates` returns JSON 401 without cookie
2. `curl -X GET /api/todo-templates` returns `[]` with valid cookie
3. Create template via POST, verify GET returns it
4. Fetch week plan, verify `days[].todos` array exists
5. Create template for Monday with startDate=today, fetch current week, verify todo auto-generated
6. Re-fetch same week, verify no duplicate todos

**Definition of Done:**
- All routes return correct status codes and cache headers
- Recurring generation is idempotent

---

### Iteration 3: Week Plan UI — Day Cell Todos

**Scope:**
- Extend `DayCell.tsx` to show two vertical blocks (dinner + todos)
- Add "+" button to add ad-hoc todo
- Create `AddTodoOverlay.tsx` (fullScreen Modal)
- Wire up todo creation and toggle completion
- Implement event logging for todo operations

**Files touched:**
- `components/week-plan/DayCell.tsx`
- `components/week-plan/TodoItem.tsx` (new)
- `components/week-plan/AddTodoOverlay.tsx` (new)
- `app/ukeplan/page.tsx`
- `lib/domain/todos.ts` (add event logging)

**Risks:**
- Day cell height explosion → Mitigation: limit visible todos, scroll within cell
- Mobile keyboard covers form → Mitigation: use `fullScreen` Modal

**Verification:**
1. Open ukeplan, verify each day shows two blocks (dinner above, todos below)
2. Tap "+ Legg til", overlay opens with keyboard visible
3. Submit todo, it appears in todos block
4. Tap checkbox, todo toggles completed
5. Reload page, completed state persists
6. Check eventLog via `/api/events`, verify todo_created and todo_completed entries

**Definition of Done:**
- Day cells display dinner + todos in two vertical blocks
- Ad-hoc todo creation works
- Completion toggle works
- Events logged

---

### Iteration 4: Bottom Nav + Recurring Template Management + Weekly Export

**Scope:**
- Restructure bottom nav: Ukeplan | Handleliste | Gjøremål | Mer
- Create More menu sheet component
- Create `app/gjoremal/page.tsx` (weekly todo list with export)
- Create `app/gjoremal/faste/page.tsx` (recurring templates)
- Add/edit template overlay
- Implement clipboard copy and iOS Shortcuts deep link

**Files touched:**
- `components/layout/BottomNav.tsx`
- `components/layout/MoreMenu.tsx` (new)
- `app/gjoremal/page.tsx` (new)
- `app/gjoremal/faste/page.tsx` (new)
- `components/todos/TemplateForm.tsx` (new)
- `components/todos/TodoListActions.tsx` (new)
- `lib/domain/todos.ts` (add `formatTodosForClipboard`)

**Risks:**
- Bottom nav changes break existing flows → Mitigation: keep all routes accessible (via Mer)
- Template editing UX complexity → Mitigation: keep fields minimal

**Verification:**
1. Bottom nav shows 4 icons: Ukeplan, Handleliste, Gjøremål, Mer
2. Tap Mer, sheet opens with Middager, Faste gjøremål, Innstillinger
3. Tap "Faste gjøremål", page loads
4. Create template for Wednesday, navigate to current week, verify todo appears
5. Open Gjøremål tab, see this week's todos grouped by day
6. Tap "Kopier liste", verify clipboard contains formatted text
7. Tap "Send til Påminnelser", verify Shortcuts app opens

**Definition of Done:**
- Navigation restructured with Mer menu
- Templates can be created/edited/deleted
- Weekly todo export works
- iOS Shortcuts integration works

---

### Iteration 5: Export/Import + Schema Version Bump

**Scope:**
- Add `todos` and `todoTemplates` to export
- Add to import with backwards compatibility
- Bump schemaVersion to 3
- Handle import of schemaVersion 2 files (no todos = empty arrays)

**Files touched:**
- `app/api/data/export/route.ts`
- `app/api/data/import/route.ts`

**Risks:**
- Import/export backwards compatibility → Mitigation: treat missing tables as empty arrays

**Verification:**
1. Export data, verify JSON includes `todos: []` and `todoTemplates: []`
2. Export with some templates and todos, verify they appear in JSON
3. Import old schemaVersion 2 file, verify success (no todos imported)
4. Import new schemaVersion 3 file with todos, verify round-trip

**Definition of Done:**
- Export includes new tables
- Import handles v2 and v3
- Round-trip export/import preserves todos

---

## G) Open Questions (Reduced)

1. **Todo ordering:** Should todos within a day be orderable via drag-and-drop, or is creation order sufficient for MVP?  
   *Recommendation: Creation order for MVP.*

2. **Completed todo visibility in export:** Should completed todos appear in clipboard export, or be filtered out?  
   *Recommendation: Include with strikethrough or (done) suffix.*

3. **Template deletion orphans:** If a template is deleted, should existing generated occurrences be deleted or preserved as orphan ad-hoc todos?  
   *Recommendation: Preserve (FK sets templateId to null).*

4. **Time format:** HH:MM 24-hour only, or support 12-hour with AM/PM?  
   *Recommendation: 24-hour only for MVP.*

5. **Interval weeks MVP scope:** Should "every other week" be fully functional in MVP, or stub the UI?  
   *Recommendation: Fully functional, logic is already spec'd.*

6. **Shortcut naming:** What should the expected iOS Shortcut be named?  
   *Recommendation: "Gjøremål til Påminnelser"*

