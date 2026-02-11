import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { authData } from './QubitRequest';

// Define paths that are public
const PUBLIC_PATHS = [
    '/login',
    '/register',
    '/api/v1/auth/login',
    '/api/v1/auth/register-company'
];

export async function verifyAuth(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip Public Paths (Redundant if matcher is good, but safe)
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 2. Get Token using QubitRequest helper
    const auth = authData(request);
    const token = auth?.token;

    if (!token) {
        // Redirect to login if accessing protected route
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Verify Token
    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'development_secret_key_change_in_production'
        );

        await jwtVerify(token, secret);

        // Token is valid, proceed
        return NextResponse.next();

    } catch (error) {
        console.error('Middleware Auth Error:', error);
        // Token invalid or expired
        return NextResponse.redirect(new URL('/login', request.url));
    }
}
