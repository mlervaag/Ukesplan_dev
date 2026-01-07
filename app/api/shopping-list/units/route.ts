import { NextResponse } from 'next/server';
import { getUnitSuggestions } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const units = await getUnitSuggestions();
        return NextResponse.json(units, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
