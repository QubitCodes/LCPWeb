import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function authData(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const session = request.cookies.get('session_id')?.value || request.cookies.get('auth_token')?.value;

    if (authHeader?.startsWith('Bearer ')) {
        return { type: 'bearer', token: authHeader.split(' ')[1] };
    } else if (session) {
        return { type: 'session', token: session };
    }
    return null;
}

export function QubitRequest(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);

    // Necessary to expose full URL and Method to Server Components
    requestHeaders.set('x-url', request.url);
    requestHeaders.set('x-method', request.method);

    // Authentication Detection
    const auth = authData(request);
    if (auth) {
        requestHeaders.set('x-auth-type', auth.type);
        requestHeaders.set('x-auth-token', auth.token);
    }

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}