import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/middlewares/auth';
import { QubitRequest } from '@/middlewares/QubitRequest';

export async function middleware(request: NextRequest) {
    // 1. Verify Authentication
    // If this returns a redirect (e.g. to /login), we must return it immediately.
    const authResponse = await verifyAuth(request);
    if (authResponse.status !== 200 || authResponse.headers.has('location')) {
        return authResponse;
    }

    // 2. If Auth passes, run QubitRequest logic
    // This injects the 'x-url', 'x-method', and 'x-auth-token' headers 
    // so that the `request()` helper works correctly in Server Components.
    return QubitRequest(request);
}

// Config: Match only dashboard routes and other protected areas
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/v1/auth (Auth APIs)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - assets (public assets)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - public folders
         */
        '/admin/:path*',
        // Add other protected routes here
    ],
};
