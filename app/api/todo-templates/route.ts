import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoTemplates } from '@/lib/db/schema';
import { createTodoTemplate } from '@/lib/domain/todos';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, must-revalidate'
};

export async function GET() {
    try {
        const ordered = await db.query.todoTemplates.findMany({
            orderBy: (t, { asc }) => [asc(t.dayOfWeek)],
        });

        return NextResponse.json(ordered, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('GET /api/todo-templates error:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const template = await createTodoTemplate(body);
        return NextResponse.json(template, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('POST /api/todo-templates error:', error);
        return NextResponse.json({ error: 'Failed to create template', details: String(error) }, { status: 500 });
    }
}
