import { NextResponse } from 'next/server';
import { getOrCreateWeekPlan } from '@/lib/domain/weekPlans';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const week = parseInt(searchParams.get('week') || '1'); // Fallback to 1 if missing

    try {
        const plan = await getOrCreateWeekPlan(year, week);
        return NextResponse.json(plan, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch week plan' }, { status: 500 });
    }
}
