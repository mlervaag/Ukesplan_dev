import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'ukesplan_access';

export async function POST(request: Request) {
    const { password } = await request.json();
    const secret = process.env.ACCESS_SECRET || '';

    // timingSafeEqual requires equal length
    const passwordBuffer = Buffer.from(password || '');
    const secretBuffer = Buffer.from(secret);

    let isEqual = false;
    if (passwordBuffer.length === secretBuffer.length) {
        isEqual = crypto.timingSafeEqual(passwordBuffer, secretBuffer);
    } else {
        // Still perform a comparison to maintain similar timing profile
        crypto.timingSafeEqual(secretBuffer, secretBuffer);
        isEqual = false;
    }

    if (isEqual) {
        const response = NextResponse.json({ success: true });

        response.cookies.set(COOKIE_NAME, secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        return response;
    }

    // Brute force mitigation: fixed delay for failures
    await new Promise(resolve => setTimeout(resolve, 1000));
    return NextResponse.json({ success: false }, { status: 401 });
}


export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
}
