import { NextResponse } from 'next/server';
import { getDinnerById, updateDinner, deleteDinner } from '@/lib/domain/dinners';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const dinner = await getDinnerById(params.id);
        if (!dinner) {
            return NextResponse.json({ error: 'Dinner not found' }, { status: 404 });
        }
        return NextResponse.json(dinner, {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch dinner' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        await updateDinner(params.id, body);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update dinner' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await deleteDinner(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete dinner' }, { status: 500 });
    }
}
