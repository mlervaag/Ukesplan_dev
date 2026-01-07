import { NextResponse } from 'next/server';
import { getShoppingList, clearShoppingListSession } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getShoppingList();
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('GET /api/shopping-list error:', error);
        return NextResponse.json({ error: 'Failed to fetch shopping list' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await clearShoppingListSession();
        return NextResponse.json({ success: true }, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('DELETE /api/shopping-list error:', error);
        return NextResponse.json({ error: 'Failed to clear shopping list' }, { status: 500 });
    }
}
