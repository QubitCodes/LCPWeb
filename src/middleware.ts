import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/middlewares/auth';
import { QubitRequest } from '@/middlewares/QubitRequest';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Verify Authentication (Only for Admin UI routes)
    // We skip API routes here because APIs handle their own 401 JSON responses,
    // and we don't want to redirect API clients to the login page.
    if (pathname.startsWith('/admin')) {
        const authResponse = await verifyAuth(request);

        // If auth fails (redirects occur), return immediately
        if (authResponse.status !== 200 || authResponse.headers.has('location')) {
            return authResponse;
        }
    }

    // 2. Run QubitRequest logic for ALL matched routes (Admin + API)
    // This injects the 'x-url', 'x-method', and 'x-auth-token' headers 
    // so that the `request()` helper works correctly in Server Components/API Routes.
    return QubitRequest(request);
}

// Config: Match dashboard routes AND API routes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - assets (public assets)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - public folders
         */
        '/admin/:path*',
        '/api/v1/companies/:path*', // Specifically target the companies API for now, or use /api/:path*
        '/api/:path*' // Catch-all for APIs to ensure QubitRequest works
    ],
};
