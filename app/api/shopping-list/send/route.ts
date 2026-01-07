import { NextResponse } from 'next/server';
import { sendDayToList, sendWeekToList } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { dayId, year, week } = await request.json();

        let result;
        if (dayId) {
            result = await sendDayToList(dayId);
        } else {
            result = await sendWeekToList(year, week);
        }

        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send to list' }, { status: 500 });
    }
}
