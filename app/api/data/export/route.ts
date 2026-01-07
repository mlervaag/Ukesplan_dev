import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = {
            dinners: await db.query.dinners.findMany(),
            ingredients: await db.query.ingredients.findMany(),
            weekPlans: await db.query.weekPlans.findMany(),
            weekPlanDays: await db.query.weekPlanDays.findMany(),
            shoppingListItems: await db.query.shoppingListItems.findMany(),
            todoTemplates: await db.query.todoTemplates.findMany(),
            todos: await db.query.todos.findMany(),
            eventLog: await db.query.eventLog.findMany(),
            exportedAt: new Date().toISOString(),
            version: '4.0.0',
            schemaVersion: 3,
        };

        return new NextResponse(JSON.stringify(data, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="middager-export.json"',
                'Cache-Control': 'no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
