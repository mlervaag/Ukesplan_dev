import { NextResponse } from 'next/server';
import { assignDinnerToDay } from '@/lib/domain/weekPlans';
import { sendDayToList } from '@/lib/domain/shoppingList';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { dayId, dinnerId } = await request.json();

        // 1. Assign dinner
        await assignDinnerToDay(dayId, dinnerId);

        // 2. Auto-add to list if dinner assigned (V4 auto-add behavior)
        let result = { added: 0, skipped: 0 };
        if (dinnerId) {
            result = await sendDayToList(dayId);
        }

        return NextResponse.json(
            { success: true, ...result },
            { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
        );
    } catch (error) {
        return NextResponse.json({ error: 'Failed to assign dinner' }, { status: 500 });
    }
}
