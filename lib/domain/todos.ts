import { db } from '@/lib/db';
import { todoTemplates, todos, eventLog, weekPlanDays } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getDateForWeekDay, isTemplateEligibleForDate } from '@/lib/utils/date';
import { startOfDay, format } from 'date-fns';

export interface TodoTemplateInput {
    title: string;
    dayOfWeek: number;
    time?: string | null;
    responsible: 'he' | 'she' | 'both';
    intervalWeeks?: number;
    endDate?: string | null;
}

export interface TodoInput {
    weekPlanDayId: string;
    title: string;
    time?: string | null;
    responsible: 'he' | 'she' | 'both';
}

/**
 * Validation for todo-related inputs
 */
function validateTodoInput(input: { title: string, time?: string | null, responsible: string }) {
    const title = (input.title || '').trim();
    if (!title) throw new Error('Tittel er påkrevd');
    if (title.length > 120) throw new Error('Tittel kan være maks 120 tegn');

    if (input.time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(input.time)) throw new Error('Ugyldig tidsformat (HH:MM)');
    }

    if (!['he', 'she', 'both'].includes(input.responsible)) {
        throw new Error('Ugyldig ansvarlig (he, she, both)');
    }

    return { title };
}

/**
 * Template CRUD
 */
export async function createTodoTemplate(input: TodoTemplateInput) {
    const { title } = validateTodoInput(input);
    const dayOfWeek = input.dayOfWeek;
    if (dayOfWeek < 1 || dayOfWeek > 7) throw new Error('Ugyldig ukedag (1-7)');

    return await db.transaction(async (tx) => {
        const [template] = await tx.insert(todoTemplates).values({
            title,
            dayOfWeek,
            time: input.time || null,
            responsible: input.responsible,
            intervalWeeks: input.intervalWeeks || 1,
            startDate: startOfDay(new Date()), // Recurrence starts today
            endDate: input.endDate ? new Date(input.endDate) : null,
        }).returning();

        await tx.insert(eventLog).values({
            eventType: 'todo_template_created',
            payload: { templateId: template.id, title: template.title },
        });

        return template;
    });
}

export async function updateTodoTemplate(id: string, input: TodoTemplateInput) {
    const { title } = validateTodoInput(input);

    return await db.transaction(async (tx) => {
        const [updated] = await tx.update(todoTemplates)
            .set({
                title,
                dayOfWeek: input.dayOfWeek,
                time: input.time || null,
                responsible: input.responsible,
                intervalWeeks: input.intervalWeeks || 1,
                endDate: input.endDate ? new Date(input.endDate) : null,
                updatedAt: new Date(),
            })
            .where(eq(todoTemplates.id, id))
            .returning();

        await tx.insert(eventLog).values({
            eventType: 'todo_template_updated',
            payload: { templateId: id, title },
        });

        return updated;
    });
}

export async function deleteTodoTemplate(id: string) {
    return await db.transaction(async (tx) => {
        await tx.delete(todoTemplates).where(eq(todoTemplates.id, id));

        await tx.insert(eventLog).values({
            eventType: 'todo_template_deleted',
            payload: { templateId: id },
        });
    });
}

/**
 * Todo CRUD (Ad-hoc)
 */
export async function createAdHocTodo(input: TodoInput) {
    const { title } = validateTodoInput(input);

    return await db.transaction(async (tx) => {
        const [todo] = await tx.insert(todos).values({
            weekPlanDayId: input.weekPlanDayId,
            title,
            time: input.time || null,
            responsible: input.responsible,
            source: 'adhoc',
        }).returning();

        await tx.insert(eventLog).values({
            eventType: 'todo_created',
            payload: { todoId: todo.id, title, weekPlanDayId: input.weekPlanDayId },
        });

        return todo;
    });
}

export async function updateTodo(id: string, updates: Partial<TodoInput & { completed: boolean }>) {
    if (updates.title !== undefined || updates.responsible !== undefined || updates.time !== undefined) {
        validateTodoInput({
            title: updates.title ?? 'Valid',
            responsible: updates.responsible ?? 'both',
            time: updates.time
        });
    }

    return await db.transaction(async (tx) => {
        const [oldTodo] = await tx.select().from(todos).where(eq(todos.id, id)).limit(1);
        if (!oldTodo) throw new Error('Gjøremål ikke funnet');

        const [updated] = await tx.update(todos)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(todos.id, id))
            .returning();

        if (updates.completed !== undefined && updates.completed !== oldTodo.completed) {
            await tx.insert(eventLog).values({
                eventType: updates.completed ? 'todo_completed' : 'todo_uncompleted',
                payload: { todoId: id, title: updated.title },
            });
        }

        return updated;
    });
}

export async function deleteTodo(id: string) {
    return await db.transaction(async (tx) => {
        const [todo] = await tx.select().from(todos).where(eq(todos.id, id)).limit(1);
        await tx.delete(todos).where(eq(todos.id, id));

        if (todo) {
            await tx.insert(eventLog).values({
                eventType: 'todo_deleted',
                payload: { todoId: id, title: todo.title },
            });
        }
    });
}

/**
 * Recurring Generation
 */
export async function generateRecurringTodos(days: { id: string, dayOfWeek: number }[], year: number, week: number, tx?: any) {
    // 1. Fetch all active templates
    const allTemplates = await (tx || db).select().from(todoTemplates);

    const results = [];
    const dbOrTx = tx || db;

    for (const day of days) {
        const dateForDay = getDateForWeekDay(year, week, day.dayOfWeek);

        const eligibleTemplates = allTemplates.filter((t: any) =>
            t.dayOfWeek === day.dayOfWeek &&
            isTemplateEligibleForDate(t, dateForDay)
        );

        for (const template of eligibleTemplates) {
            // Use ON CONFLICT DO NOTHING (via unique index on templateId + weekPlanDayId)
            const [todo] = await dbOrTx.insert(todos)
                .values({
                    weekPlanDayId: day.id,
                    templateId: template.id,
                    title: template.title,
                    time: template.time,
                    responsible: template.responsible,
                    source: 'recurring',
                })
                .onConflictDoNothing({
                    target: [todos.templateId, todos.weekPlanDayId]
                })
                .returning();

            if (todo) {
                results.push(todo);
                await dbOrTx.insert(eventLog).values({
                    eventType: 'recurring_todo_generated',
                    payload: { todoId: todo.id, templateId: template.id, weekPlanDayId: day.id },
                });
            }
        }
    }
    return results;
}

export async function setTodoHidden(id: string, hidden: boolean) {
    return await db.transaction(async (tx) => {
        const [updated] = await tx.update(todos)
            .set({ hidden, updatedAt: new Date() })
            .where(eq(todos.id, id))
            .returning();

        if (updated) {
            await tx.insert(eventLog).values({
                eventType: hidden ? 'todo_hidden' : 'todo_restored',
                payload: { todoId: id, title: updated.title },
            });
        }

        return updated;
    });
}

export async function hideTodosForWeek(year: number, week: number) {
    return await db.transaction(async (tx) => {
        const weekTodos = await getTodosForWeek(year, week);
        const ids = weekTodos.map(t => t.id);

        if (ids.length === 0) return 0;

        const result = await tx.update(todos)
            .set({ hidden: true, updatedAt: new Date() })
            .where(sql`${todos.id} IN ${ids}`)
            .returning();

        await tx.insert(eventLog).values({
            eventType: 'week_todos_cleared',
            payload: { year, week, count: result.length },
        });

        return result.length;
    });
}

export async function getTodosForWeek(year: number, week: number, includeHidden: boolean = false) {
    // This is mainly for the standalone todos page and export
    // Inner join with week_plan_days and week_plans
    return await db.query.todos.findMany({
        with: {
            weekPlanDay: {
                with: {
                    weekPlan: true
                }
            }
        },
        where: (todos, { and, eq, sql }) => {
            const weekFilter = sql`${todos.weekPlanDayId} IN (
                SELECT id FROM week_plan_days WHERE week_plan_id IN (
                    SELECT id FROM week_plans WHERE year = ${year} AND week = ${week}
                )
            )`;
            return includeHidden ? weekFilter : and(weekFilter, eq(todos.hidden, false));
        }
    });
}

/**
 * Formats todos for clipboard export.
 * Format: YYYY-MM-DD [HH:MM] | <title> | <Magnus|Nansy|Begge> [ (ferdig)]
 */
export function formatTodosForClipboard(todosList: any[]): string {
    const responsibleMap: Record<string, string> = {
        he: 'Magnus',
        she: 'Nansy',
        both: 'Begge'
    };

    const activeTodos = todosList.filter(t => !t.hidden);

    return activeTodos
        .map(todo => {
            // Get date for the day if available via weekPlanDay
            let dateStr = '';
            if (todo.weekPlanDay?.weekPlan) {
                dateStr = format(
                    getDateForWeekDay(
                        todo.weekPlanDay.weekPlan.year,
                        todo.weekPlanDay.weekPlan.week,
                        todo.weekPlanDay.dayOfWeek
                    ),
                    'yyyy-MM-dd'
                );
            }

            const timeStr = todo.time ? ` ${todo.time}` : '';
            const respLabel = responsibleMap[todo.responsible] || 'Begge';
            const completedSuffix = todo.completed ? ' (ferdig)' : '';

            return `${dateStr}${timeStr} | ${todo.title} | ${respLabel}${completedSuffix}`;
        })
        .join('\n');
}
