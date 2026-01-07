import { db } from '@/lib/db';
import { shoppingListItems, dinners, ingredients, eventLog, weekPlanDays, weekPlans } from '@/lib/db/schema';
import { eq, and, sql, asc, desc, not } from 'drizzle-orm';
import { getMergeKey, normalizeUnit } from './normalize';
import { validateIntegerQty, formatQty } from '@/lib/utils/format';

export interface AddResult {
    added: number;
    skipped: number;
}

/**
 * Returns the current shopping list, grouped by hidden status.
 * Per V4: Stable ordering by position.
 */
export async function getShoppingList() {
    const items = await db.query.shoppingListItems.findMany({
        orderBy: [asc(shoppingListItems.position)],
    });

    return {
        active: items.filter(i => !i.hidden),
        hidden: items.filter(i => i.hidden),
    };
}

/**
 * Adds ingredients to the shopping list.
 * Per V4: 
 * - Merge only when name AND unit match.
 * - Hidden items are skipped and not resurfaced.
 * - Position preserved on merge, max+1 for new items.
 */
export async function addIngredientsToShoppingList(
    ingredientsList: { name: string; quantity: string; unit: string }[],
    source: string = 'auto'
): Promise<AddResult> {
    return await db.transaction(async (tx) => {
        return await addIngredientsToShoppingListInternal(tx, ingredientsList, source);
    });
}

/**
 * Internal helper for adding ingredients within a transaction.
 */
export async function addIngredientsToShoppingListInternal(
    tx: any,
    ingredientsList: { name: string; quantity: any; unit: string }[],
    source: string = 'auto'
): Promise<AddResult> {
    let added = 0;
    let skipped = 0;

    for (const item of ingredientsList) {
        const name = (item.name || '').trim();
        const unit = (item.unit || '').trim();

        // Validate quantity as integer
        validateIntegerQty(item.quantity);
        const qty = Math.round(parseFloat(item.quantity.toString()));

        if (!name) throw new Error('Navn på vare er påkrevd');
        if (name.length > 80) throw new Error('Navn på vare kan være maks 80 tegn');
        if (unit.length > 20) throw new Error('Enhet kan være maks 20 tegn');

        const normalizedUnit = normalizeUnit(unit);
        const mergeKey = getMergeKey(name, normalizedUnit);

        const existing = await tx.query.shoppingListItems.findFirst({
            where: and(
                eq(shoppingListItems.normalizedKey, mergeKey),
                eq(shoppingListItems.unit, normalizedUnit)
            ),
        });

        if (existing) {
            if (existing.hidden) {
                skipped++;
                continue;
            } else {
                const newQty = (Math.round(parseFloat(existing.quantity)) + qty).toString();
                await tx.update(shoppingListItems)
                    .set({ quantity: newQty, updatedAt: new Date() })
                    .where(eq(shoppingListItems.id, existing.id));
                added++;
            }
        } else {
            const maxPosResult = await tx.select({ max: sql<number>`max(position)` }).from(shoppingListItems);
            const nextPos = (maxPosResult[0]?.max ?? 0) + 1;

            await tx.insert(shoppingListItems).values({
                normalizedKey: mergeKey,
                displayName: name,
                quantity: qty.toString(),
                unit: normalizedUnit,
                source,
                position: nextPos,
                hidden: false,
            });
            added++;
        }
    }


    return { added, skipped };
}

/**
 * Updates an item's quantity or unit.
 * Per V4: Position must be preserved.
 */
export async function updateShoppingListItem(
    id: string,
    updates: { quantity?: string | number; unit?: string; displayName?: string }
) {
    const trimmedUpdates: any = { ...updates };

    if (updates.quantity !== undefined) {
        validateIntegerQty(updates.quantity);
        trimmedUpdates.quantity = Math.round(parseFloat(updates.quantity.toString())).toString();
    }
    if (updates.displayName !== undefined) {
        trimmedUpdates.displayName = updates.displayName.trim();
        if (!trimmedUpdates.displayName) throw new Error('Navn på vare er påkrevd');
        if (trimmedUpdates.displayName.length > 80) throw new Error('Navn på vare kan være maks 80 tegn');
    }
    if (updates.unit !== undefined) {
        trimmedUpdates.unit = updates.unit.trim();
        if (trimmedUpdates.unit.length > 20) throw new Error('Enhet kan være maks 20 tegn');
    }

    return await db.update(shoppingListItems)
        .set({
            ...trimmedUpdates,
            updatedAt: new Date()
        })
        .where(eq(shoppingListItems.id, id))
        .returning();
}


/**
 * Hides or restores an item.
 * Per V4: Position must be preserved for restore.
 */
export async function setItemHidden(id: string, hidden: boolean) {
    return await db.transaction(async (tx) => {
        const updatedItems = await tx.update(shoppingListItems)
            .set({ hidden, updatedAt: new Date() })
            .where(eq(shoppingListItems.id, id))
            .returning();

        const updated = updatedItems[0];
        if (hidden && updated) {
            await tx.insert(eventLog).values({
                eventType: 'shopping_item_removed',
                payload: { id, name: updated.displayName },
            });
        } else if (!hidden && updated) {
            await tx.insert(eventLog).values({
                eventType: 'shopping_item_restored',
                payload: { id, name: updated.displayName },
            });
        }

        return updatedItems;
    });
}

export async function sendDayToList(dayId: string): Promise<AddResult> {
    return await db.transaction(async (tx) => {
        const day = await tx.query.weekPlanDays.findFirst({
            where: eq(weekPlanDays.id, dayId),
        });

        if (!day?.dinnerId) return { added: 0, skipped: 0 };

        const dinnerIngredients = await tx.query.ingredients.findMany({
            where: eq(ingredients.dinnerId, day.dinnerId),
        });

        const result = await addIngredientsToShoppingListInternal(tx, dinnerIngredients, 'auto');

        await tx.insert(eventLog).values({
            eventType: 'shopping_items_added',
            payload: { source: 'send_day', dayId, dinnerId: day.dinnerId, ...result },
        });

        return result;
    });
}

export async function sendWeekToList(year: number, week: number): Promise<AddResult> {
    return await db.transaction(async (tx) => {
        const plan = await tx.query.weekPlans.findFirst({
            where: and(eq(weekPlans.year, year), eq(weekPlans.week, week)),
            with: {
                days: true,
            },
        });

        if (!plan) return { added: 0, skipped: 0 };

        let totalAdded = 0;
        let totalSkipped = 0;

        for (const day of plan.days) {
            if (day.dinnerId) {
                const dinnerIngredients = await tx.query.ingredients.findMany({
                    where: eq(ingredients.dinnerId, day.dinnerId),
                });
                const result = await addIngredientsToShoppingListInternal(tx, dinnerIngredients, 'auto');
                totalAdded += result.added;
                totalSkipped += result.skipped;
            }
        }

        await tx.insert(eventLog).values({
            eventType: 'shopping_items_added',
            payload: { source: 'send_week', year, week, added: totalAdded, skipped: totalSkipped },
        });

        return { added: totalAdded, skipped: totalSkipped };
    });
}

/**
 * Provides suggestions based on previously used ingredients.
 */
export async function getIngredientSuggestions(query: string) {
    if (!query || query.length < 2) return [];

    // Search in both ingredients table and shopping list history
    const ingredientMatches = await db.select({ name: ingredients.name })
        .from(ingredients)
        .where(and(
            sql`lower(${ingredients.name}) like ${query.toLowerCase() + '%'}`,
        ))
        .limit(10);

    const historicalMatches = await db.select({ name: shoppingListItems.displayName })
        .from(shoppingListItems)
        .where(and(
            sql`lower(${shoppingListItems.displayName}) like ${query.toLowerCase() + '%'}`,
        ))
        .limit(10);

    // Filter unique names
    const all = [...ingredientMatches.map(m => m.name), ...historicalMatches.map(m => m.name)];
    return Array.from(new Set(all)).slice(0, 10);
}

export async function getUnitSuggestions() {
    const units = await db.select({ unit: ingredients.unit })
        .from(ingredients)
        .groupBy(ingredients.unit);

    const shoppingUnits = await db.select({ unit: shoppingListItems.unit })
        .from(shoppingListItems)
        .groupBy(shoppingListItems.unit);

    const all = [...units.map(u => u.unit), ...shoppingUnits.map(u => u.unit)]
        .filter(u => u && u.length > 0);

    return Array.from(new Set(all));
}

/**
 * Clears the active shopping list session.
 * Per V4: Deletes ALL items (visible and hidden) to start a fresh session.
 */
export async function clearShoppingListSession() {
    return await db.transaction(async (tx) => {
        await tx.delete(shoppingListItems);

        await tx.insert(eventLog).values({
            eventType: 'shopping_list_cleared',
            payload: { timestamp: new Date().toISOString() },
        });
    });
}

/**
 * Clears the list and sends items from a specific week in one atomic operation.
 * Per V4: Fresh session (no hidden memory), positions start from 1.
 */
export async function clearAndSendWeekToList(year: number, week: number): Promise<AddResult> {
    return await db.transaction(async (tx) => {
        // 1. Clear everything
        await tx.delete(shoppingListItems);

        // 2. Fetch the plan
        const plan = await tx.query.weekPlans.findFirst({
            where: and(eq(weekPlans.year, year), eq(weekPlans.week, week)),
            with: {
                days: true,
            },
        });

        if (!plan) return { added: 0, skipped: 0 };

        // 3. Aggregate all ingredients from the week plan
        let totalAdded = 0;
        let totalSkipped = 0;

        for (const day of plan.days) {
            if (day.dinnerId) {
                const dinnerIngredients = await tx.query.ingredients.findMany({
                    where: eq(ingredients.dinnerId, day.dinnerId),
                });

                // Use the internal helper which uses the SAME transaction
                // Note: Since we cleared the list, everything should be 'added' and nothing 'skipped'
                const result = await addIngredientsToShoppingListInternal(tx, dinnerIngredients, 'auto');
                totalAdded += result.added;
                totalSkipped += result.skipped;
            }
        }

        await tx.insert(eventLog).values({
            eventType: 'shopping_list_reset_with_week',
            payload: { year, week, added: totalAdded },
        });

        return { added: totalAdded, skipped: totalSkipped };
    });
}

/**
 * Formats a list of shopping items for the clipboard.
 * Rules:
 * - One item per line
 * - Format: "{qty} {unit} {name}" or "{qty} {name}"
 * - Qty is always present (default 1)
 */
export function formatShoppingListForClipboard(items: any[]): string {
    return items
        .map(item => {
            const qty = formatQty(item.quantity);
            const unit = (item.unit || '').trim();
            const name = (item.displayName || item.name || '').trim();

            if (unit) {
                return `${qty} ${unit} ${name}`;
            }
            return `${qty} ${name}`;
        })
        .join('\n');
}

