import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eventLog } from '@/lib/db/schema';
import { desc, eq, gte, lte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    try {
        const conditions = [];
        if (type) conditions.push(eq(eventLog.eventType, type));
        if (from) conditions.push(gte(eventLog.createdAt, new Date(from)));
        if (to) conditions.push(lte(eventLog.createdAt, new Date(to)));

        const events = await db.query.eventLog.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(eventLog.createdAt)],
            limit,
            offset,
        });

        return NextResponse.json(events, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        console.error('GET /api/events error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
