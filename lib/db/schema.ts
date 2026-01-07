import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const dinners = pgTable('dinners', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    notes: text('notes'),
    icon: text('icon'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const dinnersRelations = relations(dinners, ({ many }) => ({
    ingredients: many(ingredients),
}));

export const ingredients = pgTable('ingredients', {
    id: uuid('id').primaryKey().defaultRandom(),
    dinnerId: uuid('dinner_id').notNull().references(() => dinners.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
    unit: text('unit').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow(),
});

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
    dinner: one(dinners, {
        fields: [ingredients.dinnerId],
        references: [dinners.id],
    }),
}));

export const weekPlans = pgTable('week_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    year: integer('year').notNull(),
    week: integer('week').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
    unq: unique().on(t.year, t.week),
}));

export const weekPlansRelations = relations(weekPlans, ({ many }) => ({
    days: many(weekPlanDays),
}));

export const weekPlanDays = pgTable('week_plan_days', {
    id: uuid('id').primaryKey().defaultRandom(),
    weekPlanId: uuid('week_plan_id').notNull().references(() => weekPlans.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(), // 1-7 (Mandag-Søndag)
    dinnerId: uuid('dinner_id').references(() => dinners.id, { onDelete: 'set null' }),
    dinnerNameSnapshot: text('dinner_name_snapshot'),
    dinnerIconSnapshot: text('dinner_icon_snapshot'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
    unq: unique().on(t.weekPlanId, t.dayOfWeek),
}));

export const weekPlanDaysRelations = relations(weekPlanDays, ({ one, many }) => ({
    weekPlan: one(weekPlans, {
        fields: [weekPlanDays.weekPlanId],
        references: [weekPlans.id],
    }),
    dinner: one(dinners, {
        fields: [weekPlanDays.dinnerId],
        references: [dinners.id],
    }),
    todos: many(todos),
}));

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
}, (t) => ({
    unq: unique().on(t.templateId, t.weekPlanDayId),
}));

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

export const shoppingListItems = pgTable('shopping_list_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    normalizedKey: text('normalized_key').notNull(),
    displayName: text('display_name').notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
    unit: text('unit').notNull().default(''),
    source: text('source').notNull(), // 'auto' or 'manual'
    position: integer('position').notNull().default(0),
    hidden: boolean('hidden').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const eventLog = pgTable('event_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});
