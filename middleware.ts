import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'ukesplan_access';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths
    if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
        return NextResponse.next();
    }

    const secret = request.cookies.get(COOKIE_NAME)?.value;
    const expectedSecret = process.env.ACCESS_SECRET;

    if (!secret || secret !== expectedSecret) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (some api routes might be public, but we handle them above)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
