import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dinners, ingredients, weekPlans, weekPlanDays, shoppingListItems, todoTemplates, todos, eventLog } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: any): boolean {
    return typeof id === 'string' && UUID_REGEX.test(id);
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // 1. Schema Version Check (accept 1, 2 or 3 for backwards compatibility)
        if (![1, 2, 3].includes(data.schemaVersion)) {
            return NextResponse.json({
                error: 'Ugyldig filformat eller versjon. Kun versjon 1, 2 eller 3 støttes.'
            }, { status: 400 });
        }

        const tables = [
            { key: 'dinners', uuidFields: ['id'] },
            { key: 'ingredients', uuidFields: ['id', 'dinnerId'] },
            { key: 'weekPlans', uuidFields: ['id'] },
            { key: 'weekPlanDays', uuidFields: ['id', 'weekPlanId', 'dinnerId'] },
            { key: 'shoppingListItems', uuidFields: ['id'] },
            { key: 'todoTemplates', uuidFields: ['id'], optional: true },
            { key: 'todos', uuidFields: ['id', 'weekPlanDayId', 'templateId'], optional: true },
            { key: 'eventLog', uuidFields: ['id'] }
        ];

        const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

        for (const table of tables) {
            const rows = data[table.key];
            if (!rows && (table as any).optional) continue;
            if (!Array.isArray(rows)) {
                return NextResponse.json({
                    error: `Mangler tabell: ${table.key}`
                }, { status: 400 });
            }

            for (const row of rows) {
                // UUID Validation
                for (const field of table.uuidFields) {
                    const val = row[field];
                    if (val !== null && val !== undefined && !isValidUuid(val)) {
                        return NextResponse.json({
                            error: `Ugyldig UUID i ${table.key}.${field}: ${val}`
                        }, { status: 400 });
                    }
                }

                // Table-specific validation & normalization
                if (table.key === 'dinners') {
                    if (!row.name || typeof row.name !== 'string') return NextResponse.json({ error: 'Ugyldig middagsnavn' }, { status: 400 });
                    row.name = row.name.trim().slice(0, 120);
                    if (row.notes) row.notes = row.notes.trim().slice(0, 1000);
                    if (row.icon) row.icon = String(row.icon).trim().slice(0, 50);
                }

                if (table.key === 'ingredients') {
                    if (!row.name || typeof row.name !== 'string') return NextResponse.json({ error: 'Ugyldig ingrediensnavn' }, { status: 400 });
                    row.name = row.name.trim().slice(0, 120);
                    if (row.unit) row.unit = String(row.unit).trim().slice(0, 20);
                    const qty = parseFloat(row.quantity);
                    if (isNaN(qty) || qty < 0.01 || qty > 99999) return NextResponse.json({ error: 'Ugyldig mengde' }, { status: 400 });
                }

                if (table.key === 'weekPlans') {
                    if (typeof row.year !== 'number' || row.year < 2000 || row.year > 2100) return NextResponse.json({ error: 'Ugyldig år' }, { status: 400 });
                    if (typeof row.week !== 'number' || row.week < 1 || row.week > 53) return NextResponse.json({ error: 'Ugyldig uke' }, { status: 400 });
                }

                if (table.key === 'weekPlanDays') {
                    if (typeof row.dayOfWeek !== 'number' || row.dayOfWeek < 1 || row.dayOfWeek > 7) return NextResponse.json({ error: 'Ugyldig ukedag' }, { status: 400 });
                }

                if (table.key === 'todoTemplates') {
                    if (!row.title || typeof row.title !== 'string') return NextResponse.json({ error: 'Ugyldig tittel på mal' }, { status: 400 });
                    row.title = row.title.trim().slice(0, 120);
                    if (typeof row.dayOfWeek !== 'number' || row.dayOfWeek < 1 || row.dayOfWeek > 7) return NextResponse.json({ error: 'Ugyldig ukedag i mal' }, { status: 400 });
                    if (row.time && !TIME_REGEX.test(row.time)) return NextResponse.json({ error: 'Ugyldig tidsformat i mal' }, { status: 400 });
                    if (!['he', 'she', 'both'].includes(row.responsible)) return NextResponse.json({ error: 'Ugyldig ansvarlig i mal' }, { status: 400 });
                    if (typeof row.intervalWeeks !== 'number' || row.intervalWeeks < 1 || row.intervalWeeks > 52) return NextResponse.json({ error: 'Ugyldig intervall i mal' }, { status: 400 });
                }

                if (table.key === 'todos') {
                    if (!row.title || typeof row.title !== 'string') return NextResponse.json({ error: 'Ugyldig tittel på gjøremål' }, { status: 400 });
                    row.title = row.title.trim().slice(0, 120);
                    if (row.time && !TIME_REGEX.test(row.time)) return NextResponse.json({ error: 'Ugyldig tidsformat på gjøremål' }, { status: 400 });
                    if (!['he', 'she', 'both'].includes(row.responsible)) return NextResponse.json({ error: 'Ugyldig ansvarlig på gjøremål' }, { status: 400 });
                }

                if (table.key === 'shoppingListItems') {
                    if (!row.displayName || typeof row.displayName !== 'string') return NextResponse.json({ error: 'Ugyldig navn på vare' }, { status: 400 });
                    row.displayName = row.displayName.trim().slice(0, 120);
                    if (!row.normalizedKey || typeof row.normalizedKey !== 'string') row.normalizedKey = row.displayName.toLowerCase();
                    row.normalizedKey = row.normalizedKey.trim().slice(0, 120);
                }
            }
        }

        // 3. Transactional Import
        await db.transaction(async (tx) => {
            // A. Wipe everything first (order matters for FKs)
            await tx.delete(todos);
            await tx.delete(ingredients);
            await tx.delete(weekPlanDays);
            await tx.delete(weekPlans);
            await tx.delete(dinners);
            await tx.delete(todoTemplates);
            await tx.delete(shoppingListItems);
            await tx.delete(eventLog);

            // B. Re-insert in order (dependencies first)
            // Note: We use .values(rows) directly as we trust the validated structure
            if (data.dinners.length > 0) await tx.insert(dinners).values(data.dinners);
            if (data.ingredients.length > 0) await tx.insert(ingredients).values(data.ingredients);
            if (data.weekPlans.length > 0) await tx.insert(weekPlans).values(data.weekPlans);
            if (data.weekPlanDays.length > 0) await tx.insert(weekPlanDays).values(data.weekPlanDays);

            const todoTemplatesData = data.todoTemplates || [];
            if (todoTemplatesData.length > 0) await tx.insert(todoTemplates).values(todoTemplatesData);

            const todosData = data.todos || [];
            if (todosData.length > 0) await tx.insert(todos).values(todosData);

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
