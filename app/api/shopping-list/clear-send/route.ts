import { NextResponse } from 'next/server';
import { clearAndSendWeekToList } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { year, week } = await request.json();

        if (!year || !week) {
            return NextResponse.json({ error: 'Missing year or week' }, { status: 400 });
        }

        const result = await clearAndSendWeekToList(year, week);

        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('POST /api/shopping-list/clear-send error:', error);
        return NextResponse.json({ error: 'Failed to clear and send week' }, { status: 500 });
    }
}
