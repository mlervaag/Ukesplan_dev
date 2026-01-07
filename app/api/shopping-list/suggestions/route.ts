import { NextResponse } from 'next/server';
import { getIngredientSuggestions } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    try {
        const suggestions = await getIngredientSuggestions(query);
        return NextResponse.json(suggestions, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
