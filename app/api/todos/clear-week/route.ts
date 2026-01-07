import { NextResponse } from 'next/server';
import { hideTodosForWeek } from '@/lib/domain/todos';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, must-revalidate'
};

export async function POST(request: Request) {
    try {
        const { year, week } = await request.json();

        if (isNaN(year) || isNaN(week)) {
            return NextResponse.json({ error: 'Year and week are required' }, { status: 400 });
        }

        const count = await hideTodosForWeek(year, week);
        return NextResponse.json({ count }, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('POST /api/todos/clear-week error:', error);
        return NextResponse.json({ error: 'Failed to clear week todos', details: String(error) }, { status: 500 });
    }
}
