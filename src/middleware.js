import { NextResponse } from 'next/server';

export async function middleware(request) {
    const session = request.cookies.get('__session');

    // Protected routes pattern
    if (!session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Validate session via Firebase Admin? 
    // Doing it on every request might be slow if calling Firebase Auth API.
    // Standard practice is to trust the cookie for middleware routing, 
    // and validate token in Server Components or API routes if needed for data.
    // For this prototype, existence check is enough for routing protection.

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/tasks/:path*', '/groups/:path*', '/reports/:path*'],
};
