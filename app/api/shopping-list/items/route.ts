import { NextResponse } from 'next/server';
import { addIngredientsToShoppingList } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json(); // { name: string, quantity?: string, unit?: string }
        const ingredients = [{
            name: body.name,
            quantity: body.quantity || '1',
            unit: body.unit || '',
        }];

        const result = await addIngredientsToShoppingList(ingredients, 'manual');
        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('POST /api/shopping-list/items error:', error);
        return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
    }
}
