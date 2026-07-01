// proxy.ts  (project root — Next.js 16 renamed middleware.ts → proxy.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Attach a header so the root layout knows to suppress the public Header/Footer.
function adminResponse(base?: NextResponse) {
    const res = base ?? NextResponse.next();
    res.headers.set('x-is-admin', '1');
    return res;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow login page through — everything else under /admin is protected
    if (pathname === '/admin/login') {
        return adminResponse();
    }

    // Redirect bare /admin to /admin/dashboard
    if (pathname === '/admin' || pathname === '/admin/') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
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

        // Users and Settings pages are admin-only
        if (
            (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/settings')) &&
            token.role !== 'admin'
        ) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }

        return adminResponse();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
