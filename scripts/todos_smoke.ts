/**
 * Smoke test for Todos domain logic.
 * Run with: npx tsx scripts/todos_smoke.ts
 */
import { hideTodosForWeek, getTodosForWeek } from '../lib/domain/todos';
import { db } from '../lib/db';
import { todos, weekPlans, weekPlanDays } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function smokeTest() {
    console.log('🚀 Starting Todos Smoke Test...');

    try {
        // 1. Setup - Create a dummy week and todo
        const year = 2029; // Far future
        const week = 1;

        console.log('--- Setting up test data ---');
        let [plan] = await db.insert(weekPlans).values({ year, week }).onConflictDoNothing().returning();
        if (!plan) {
            plan = await db.query.weekPlans.findFirst({ where: (wp, { and, eq }) => and(eq(wp.year, year), eq(wp.week, week)) }) as any;
        }

        let [day] = await db.insert(weekPlanDays).values({ weekPlanId: plan.id, dayOfWeek: 1 }).onConflictDoNothing().returning();
        if (!day) {
            day = await db.query.weekPlanDays.findFirst({ where: (wpd, { eq }) => eq(wpd.weekPlanId, plan.id) }) as any;
        }

        const [todo] = await db.insert(todos).values({
            weekPlanDayId: day.id,
            title: 'SMOKE_TEST_TODO',
            responsible: 'both',
            hidden: false
        }).returning();

        console.log(`✅ Created test todo: ${todo.id}`);

        // 2. Test Hide
        console.log('--- Testing hideTodosForWeek ---');
        const count = await hideTodosForWeek(year, week);
        console.log(`✅ Hidden ${count} todos`);

        // 3. Test Retrieval
        console.log('--- Testing getTodosForWeek ---');
        const active = await getTodosForWeek(year, week, false);
        const all = await getTodosForWeek(year, week, true);

        const isHidden = all.find(t => t.id === todo.id)?.hidden === true;
        const notInActive = !active.find(t => t.id === todo.id);

        if (isHidden && notInActive) {
            console.log('✅ Retrieval logic confirmed: hidden items excluded by default.');
        } else {
            throw new Error(`Retrieval logic failed! isHidden=${isHidden}, notInActive=${notInActive}`);
        }

        // 4. Cleanup
        console.log('--- Cleaning up ---');
        await db.delete(todos).where(eq(todos.id, todo.id));

        console.log('✨ Smoke test PASSED');
        process.exit(0);
    } catch (error) {
        console.error('❌ Smoke test FAILED:', error);
        process.exit(1);
    }
}

smokeTest();
