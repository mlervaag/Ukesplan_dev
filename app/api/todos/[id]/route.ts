import { NextResponse } from 'next/server';
import { updateTodo, deleteTodo } from '@/lib/domain/todos';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, must-revalidate'
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const updated = await updateTodo(params.id, body);
        return NextResponse.json(updated, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('PATCH /api/todos/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update todo', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await deleteTodo(params.id);
        return NextResponse.json({ success: true }, { headers: CACHE_HEADERS });
    } catch (error) {
        console.error('DELETE /api/todos/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
    }
}
