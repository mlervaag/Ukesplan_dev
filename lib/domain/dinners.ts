import { db } from '@/lib/db';
import { dinners, ingredients, eventLog } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { validateIntegerQty } from '@/lib/utils/format';
import { getRandomDinnerIcon, isValidDinnerIcon } from '@/lib/constants/icons';

export interface IngredientInput {
    name: string;
    quantity?: number;
    unit?: string;
}

export interface DinnerInput {
    name: string;
    notes?: string;
    icon?: string;
    ingredients: IngredientInput[];
}

export async function getDinners() {
    return await db.query.dinners.findMany({
        with: {
            ingredients: true,
        },
        orderBy: (dinners, { desc }) => [desc(dinners.updatedAt)],
    });
}

export async function getDinnerById(id: string) {
    return await db.query.dinners.findFirst({
        where: eq(dinners.id, id),
        with: {
            ingredients: true,
        },
    });
}

export async function createDinner(input: DinnerInput) {
    // 1. Validation & Trimming
    const name = (input.name || '').trim();
    const notes = (input.notes || '').trim();

    if (!name) throw new Error('Navn på middag er påkrevd');
    if (name.length > 80) throw new Error('Navn på middag kan være maks 80 tegn');
    if (notes.length > 2000) throw new Error('Notater kan være maks 2000 tegn');

    return await db.transaction(async (tx) => {
        // Assign random icon if none provided
        const icon = input.icon && isValidDinnerIcon(input.icon) ? input.icon : getRandomDinnerIcon();

        const [dinner] = await tx.insert(dinners).values({
            name,
            notes: notes || null,
            icon,
        }).returning();

        if (input.ingredients.length > 0) {
            await tx.insert(ingredients).values(
                input.ingredients.map(ing => {
                    const ingName = (ing.name || '').trim();
                    const ingUnit = (ing.unit || '').trim();

                    if (!ingName) throw new Error('Navn på ingrediens er påkrevd');
                    if (ingName.length > 80) throw new Error('Navn på ingrediens kan være maks 80 tegn');
                    if (ingUnit.length > 20) throw new Error('Enhet kan være maks 20 tegn');

                    const qty = ing.quantity !== undefined ? validateIntegerQty(ing.quantity) : 1;

                    return {
                        dinnerId: dinner.id,
                        name: ingName,
                        quantity: qty.toString(),
                        unit: ingUnit,
                    };
                })
            );
        }

        await tx.insert(eventLog).values({
            eventType: 'dinner_created',
            payload: { dinnerId: dinner.id, name: dinner.name },
        });

        return dinner;
    });
}


export async function updateDinner(id: string, input: DinnerInput) {
    // 1. Validation & Trimming
    const name = (input.name || '').trim();
    const notes = (input.notes || '').trim();

    if (!name) throw new Error('Navn på middag er påkrevd');
    if (name.length > 80) throw new Error('Navn på middag kan være maks 80 tegn');
    if (notes.length > 2000) throw new Error('Notater kan være maks 2000 tegn');

    return await db.transaction(async (tx) => {
        // Only update icon if provided and valid
        const icon = input.icon && isValidDinnerIcon(input.icon) ? input.icon : undefined;

        await tx.update(dinners).set({
            name,
            notes: notes || null,
            ...(icon && { icon }),
            updatedAt: new Date(),
        }).where(eq(dinners.id, id));

        // Simple strategy: delete and recreate ingredients
        await tx.delete(ingredients).where(eq(ingredients.dinnerId, id));

        if (input.ingredients.length > 0) {
            await tx.insert(ingredients).values(
                input.ingredients.map(ing => {
                    const ingName = (ing.name || '').trim();
                    const ingUnit = (ing.unit || '').trim();

                    if (!ingName) throw new Error('Navn på ingrediens er påkrevd');
                    if (ingName.length > 80) throw new Error('Navn på ingrediens kan være maks 80 tegn');
                    if (ingUnit.length > 20) throw new Error('Enhet kan være maks 20 tegn');

                    const qty = ing.quantity !== undefined ? validateIntegerQty(ing.quantity) : 1;

                    return {
                        dinnerId: id,
                        name: ingName,
                        quantity: qty.toString(),
                        unit: ingUnit,
                    };
                })
            );
        }

        await tx.insert(eventLog).values({
            eventType: 'dinner_updated',
            payload: { dinnerId: id, name },
        });
    });
}


export async function deleteDinner(id: string) {
    return await db.transaction(async (tx) => {
        await tx.delete(dinners).where(eq(dinners.id, id));
        // Ingredients deleted by cascade
    });
}
