import { NextResponse } from 'next/server';
import { copyWeek } from '@/lib/domain/weekPlans';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { fromYear, fromWeek, toYear, toWeek } = await request.json();
        const plan = await copyWeek(fromYear, fromWeek, toYear, toWeek);
        return NextResponse.json(plan, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to copy week' }, { status: 500 });
    }
}
