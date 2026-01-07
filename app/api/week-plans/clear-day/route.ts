import { NextResponse } from 'next/server';
import { assignDinnerToDay } from '@/lib/domain/weekPlans';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { dayId } = await request.json();
        await assignDinnerToDay(dayId, null);
        return NextResponse.json(
            { success: true },
            { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
        );
    } catch (error) {
        return NextResponse.json({ error: 'Failed to clear day' }, { status: 500 });
    }
}
