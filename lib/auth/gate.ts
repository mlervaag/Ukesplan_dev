import { cookies } from 'next/headers';

const COOKIE_NAME = 'ukesplan_access';

export function getAccessSecret() {
    return process.env.ACCESS_SECRET;
}

export function hasAccess() {
    const cookieStore = cookies();
    const secret = cookieStore.get(COOKIE_NAME)?.value;
    return secret === getAccessSecret();
}

export function setAccess() {
    const cookieStore = cookies();
    const secret = getAccessSecret();
    if (secret) {
        cookieStore.set(COOKIE_NAME, secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });
    }
}

export function clearAccess() {
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_NAME);
}
