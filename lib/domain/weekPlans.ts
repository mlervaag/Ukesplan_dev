import { db } from '@/lib/db';
import { weekPlans, weekPlanDays, dinners, ingredients, eventLog } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateRecurringTodos } from './todos';

export async function getOrCreateWeekPlan(year: number, week: number) {
    return await db.transaction(async (tx) => {
        let plan = await tx.query.weekPlans.findFirst({
            where: and(eq(weekPlans.year, year), eq(weekPlans.week, week)),
            with: {
                days: {
                    with: {
                        todos: true,
                    },
                },
            },
        });

        if (plan) {
            // Check if we need to generate recurring todos for an existing plan
            await generateRecurringTodos(plan.days, year, week, tx);
            // Re-fetch to include newly generated todos if any? 
            // Better to just push them to the plan.days[].todos or re-fetch once at the end.
            // For simplicity and correctness with IDs, re-fetch.
            plan = await tx.query.weekPlans.findFirst({
                where: and(eq(weekPlans.year, year), eq(weekPlans.week, week)),
                with: {
                    days: {
                        with: {
                            todos: true,
                        },
                    },
                },
            }) as any;
        }

        if (!plan) {
            const [newPlan] = await tx.insert(weekPlans).values({
                year,
                week,
            }).returning();

            // Initialize 7 days
            const days = [];
            for (let i = 1; i <= 7; i++) {
                const [day] = await tx.insert(weekPlanDays).values({
                    weekPlanId: newPlan.id,
                    dayOfWeek: i,
                }).returning();
                days.push(day);
            }

            // Generate recurring todos for the new plan
            await generateRecurringTodos(days, year, week, tx);

            // Re-fetch to get the full structure with todos
            plan = await tx.query.weekPlans.findFirst({
                where: eq(weekPlans.id, newPlan.id),
                with: {
                    days: {
                        with: {
                            todos: true,
                        },
                    },
                },
            }) as any;
        }

        return plan;
    });
}

export async function assignDinnerToDay(dayId: string, dinnerId: string | null) {
    return await db.transaction(async (tx) => {
        let dinnerNameSnapshot = null;
        let dinnerIconSnapshot = null;
        if (dinnerId) {
            const dinner = await tx.query.dinners.findFirst({
                where: eq(dinners.id, dinnerId),
            });
            dinnerNameSnapshot = dinner?.name ?? null;
            dinnerIconSnapshot = dinner?.icon ?? null;
        }

        const [updatedDay] = await tx.update(weekPlanDays)
            .set({
                dinnerId,
                dinnerNameSnapshot,
                dinnerIconSnapshot,
                updatedAt: new Date(),
            })
            .where(eq(weekPlanDays.id, dayId))
            .returning();

        await tx.insert(eventLog).values({
            eventType: 'dinner_assigned',
            payload: { dayId, dinnerId, dinnerName: dinnerNameSnapshot, dinnerIcon: dinnerIconSnapshot },
        });

        return updatedDay;
    });
}

export async function copyWeek(fromYear: number, fromWeek: number, toYear: number, toWeek: number) {
    return await db.transaction(async (tx) => {
        const fromPlan = await tx.query.weekPlans.findFirst({
            where: and(eq(weekPlans.year, fromYear), eq(weekPlans.week, fromWeek)),
            with: {
                days: true,
            },
        });

        if (!fromPlan) throw new Error('Source week not found');

        const toPlan = await getOrCreateWeekPlan(toYear, toWeek);
        if (!toPlan) throw new Error('Could not create target week plan');

        for (const fromDay of fromPlan.days) {
            const toDay = toPlan.days.find(d => d.dayOfWeek === fromDay.dayOfWeek);
            if (toDay) {
                await tx.update(weekPlanDays)
                    .set({
                        dinnerId: fromDay.dinnerId,
                        dinnerNameSnapshot: fromDay.dinnerNameSnapshot,
                        dinnerIconSnapshot: fromDay.dinnerIconSnapshot,
                        updatedAt: new Date(),
                    })
                    .where(eq(weekPlanDays.id, toDay.id));
            }
        }

        await tx.insert(eventLog).values({
            eventType: 'week_copied',
            payload: { from: `${fromYear}-W${fromWeek}`, to: `${toYear}-W${toWeek}` },
        });

        return toPlan;
    });
}
