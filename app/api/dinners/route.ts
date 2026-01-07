import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dinners, eventLog } from '@/lib/db/schema';
import { createDinner } from '@/lib/domain/dinners';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allDinners = await db.query.dinners.findMany({
            with: { ingredients: true },
            orderBy: (dinners, { asc }) => [asc(dinners.name)],
        });
        return NextResponse.json(allDinners, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('GET /api/dinners error:', error);
        return NextResponse.json({ error: 'Failed to fetch dinners', details: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const dinner = await createDinner(body);
        return NextResponse.json(dinner, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('POST /api/dinners error:', error);
        return NextResponse.json({ error: 'Failed to create dinner', details: String(error) }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await db.transaction(async (tx) => {
            // weekPlanDays.dinnerId is 'ON DELETE SET NULL', so we can just delete dinners.
            // ingredients is 'ON DELETE CASCADE', so we can just delete dinners.
            await tx.delete(dinners);
            await tx.insert(eventLog).values({
                eventType: 'all_dinners_deleted',
                payload: { timestamp: new Date().toISOString() },
            });
        });
        return NextResponse.json({ success: true }, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('DELETE /api/dinners error:', error);
        return NextResponse.json({ error: 'Failed to delete dinners', details: String(error) }, { status: 500 });
    }
}
