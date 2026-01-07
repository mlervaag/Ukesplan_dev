import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dinners, ingredients, weekPlans, weekPlanDays, shoppingListItems, eventLog } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        await db.transaction(async (tx) => {
            // Delete in order to satisfy FK constraints if any (though most are cascade/set-null)
            await tx.delete(ingredients);
            await tx.delete(weekPlanDays);
            await tx.delete(weekPlans);
            await tx.delete(dinners);
            await tx.delete(shoppingListItems);

            // Log the reset itself
            await tx.insert(eventLog).values({
                eventType: 'app_reset',
                payload: {
                    timestamp: new Date().toISOString(),
                    reason: 'User requested full reset via settings'
                },
            });
        });

        return NextResponse.json({ success: true }, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('Reset app error:', error);
        return NextResponse.json({
            error: 'Failed to reset app',
            details: String(error)
        }, { status: 500 });
    }
}
