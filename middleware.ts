// middleware.ts  (project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow login page through — everything else under /admin is protected
    if (pathname === '/admin/login') {
        return NextResponse.next();
    }

    if (pathname.startsWith('/admin')) {
        const token = await getToken({
            req:    request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // Not logged in → redirect to login
        if (!token) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Valid roles only
        const validRoles = ['admin', 'editor', 'author'];
        if (!validRoles.includes(token.role as string)) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // Users page is admin-only
        if (pathname.startsWith('/admin/users') && token.role !== 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};