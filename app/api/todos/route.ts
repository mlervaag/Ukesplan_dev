import { NextResponse } from 'next/server';
import { getTodosForWeek, createAdHocTodo } from '@/lib/domain/todos';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, must-revalidate'
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || '');
        const week = parseInt(searchParams.get('week') || '');
        const includeHidden = searchParams.get('includeHidden') === 'true' || searchParams.get('includeHidden') === '1';

        if (isNaN(year) || isNaN(week)) {
            return NextResponse.json({ error: 'Year and week are required' }, { status: 400 });
        }

        const items = await getTodosForWeek(year, week, includeHidden);
        return NextResponse.json(items, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('GET /api/todos error:', error);
        return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const todo = await createAdHocTodo(body);
        return NextResponse.json(todo, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('POST /api/todos error:', error);
        return NextResponse.json({ error: 'Failed to create todo', details: String(error) }, { status: 500 });
    }
}
