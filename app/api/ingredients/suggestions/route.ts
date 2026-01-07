import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ingredients } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await db
            .select({ name: ingredients.name })
            .from(ingredients)
            .groupBy(ingredients.name)
            .orderBy(ingredients.name);

        return NextResponse.json(data.map(i => i.name), {
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
