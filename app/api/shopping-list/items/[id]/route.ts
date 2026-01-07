import { NextResponse } from 'next/server';
import { updateShoppingListItem, setItemHidden } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        if (typeof body.hidden === 'boolean') {
            const [item] = await setItemHidden(params.id, body.hidden);
            return NextResponse.json(item, {
                headers: { 'Cache-Control': 'no-store, must-revalidate' }
            });
        }

        const [item] = await updateShoppingListItem(params.id, {
            quantity: body.quantity,
            unit: body.unit,
            displayName: body.displayName,
        });

        return NextResponse.json(item, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('PATCH /api/shopping-list/items/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}
