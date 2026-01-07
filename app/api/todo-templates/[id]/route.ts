import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoTemplates } from '@/lib/db/schema';
import { updateTodoTemplate, deleteTodoTemplate } from '@/lib/domain/todos';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, must-revalidate'
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const template = await db.query.todoTemplates.findFirst({
            where: eq(todoTemplates.id, params.id),
        });
        if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        return NextResponse.json(template, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('GET /api/todo-templates/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const updated = await updateTodoTemplate(params.id, body);
        return NextResponse.json(updated, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('PATCH /api/todo-templates/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update template', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await deleteTodoTemplate(params.id);
        return NextResponse.json({ success: true }, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('DELETE /api/todo-templates/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
