import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dinners, ingredients, weekPlans, weekPlanDays, shoppingListItems, eventLog } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: any): boolean {
    return typeof id === 'string' && UUID_REGEX.test(id);
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // 1. Schema Version Check (accept 1 or 2 for backwards compatibility)
        if (data.schemaVersion !== 1 && data.schemaVersion !== 2) {
            return NextResponse.json({
                error: 'Ugyldig filformat eller versjon. Kun versjon 1 eller 2 støttes.'
            }, { status: 400 });
        }

        // 2. Structural & UUID Validation
        const tables = [
            { key: 'dinners', uuidFields: ['id'] },
            { key: 'ingredients', uuidFields: ['id', 'dinnerId'] },
            { key: 'weekPlans', uuidFields: ['id'] },
            { key: 'weekPlanDays', uuidFields: ['id', 'weekPlanId', 'dinnerId'] },
            { key: 'shoppingListItems', uuidFields: ['id'] },
            { key: 'eventLog', uuidFields: ['id'] }
        ];

        for (const table of tables) {
            const rows = data[table.key];
            if (!Array.isArray(rows)) {
                return NextResponse.json({
                    error: `Mangler tabell: ${table.key}`
                }, { status: 400 });
            }

            for (const row of rows) {
                for (const field of table.uuidFields) {
                    const val = row[field];
                    // Optional fields like dinnerId in weekPlanDays can be null
                    if (val !== null && val !== undefined && !isValidUuid(val)) {
                        return NextResponse.json({
                            error: `Ugyldig UUID i ${table.key}.${field}: ${val}`
                        }, { status: 400 });
                    }
                }
            }
        }

        // 3. Transactional Import
        await db.transaction(async (tx) => {
            // A. Wipe everything first
            await tx.delete(ingredients);
            await tx.delete(weekPlanDays);
            await tx.delete(weekPlans);
            await tx.delete(dinners);
            await tx.delete(shoppingListItems);
            await tx.delete(eventLog);

            // B. Re-insert in order (dependencies first)
            // Note: We use .values(rows) directly as we trust the validated structure
            if (data.dinners.length > 0) await tx.insert(dinners).values(data.dinners);
            if (data.ingredients.length > 0) await tx.insert(ingredients).values(data.ingredients);
            if (data.weekPlans.length > 0) await tx.insert(weekPlans).values(data.weekPlans);
            if (data.weekPlanDays.length > 0) await tx.insert(weekPlanDays).values(data.weekPlanDays);
            if (data.shoppingListItems.length > 0) await tx.insert(shoppingListItems).values(data.shoppingListItems);
            if (data.eventLog && data.eventLog.length > 0) await tx.insert(eventLog).values(data.eventLog);

            // Log successful import
            await tx.insert(eventLog).values({
                eventType: 'data_imported',
                payload: {
                    timestamp: new Date().toISOString(),
                    schemaVersion: 1,
                    counts: {
                        dinners: data.dinners.length,
                        shopping: data.shoppingListItems.length
                    }
                }
            });
        });

        return NextResponse.json({ success: true }, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('Import hardening error:', error);
        return NextResponse.json({
            error: 'Import feilet. Kontroller filen og prøv igjen.',
            details: String(error)
        }, { status: 500 });
    }
}
